import { runDailyContentAgent } from "../agents/dailyContentAgent.js";
import { runVisualDirectorAgent } from "../agents/visualDirectorAgent.js";
import { generateImage } from "../services/imageGenerator.js";
import { renderBrandedImage } from "../services/brandRenderer.js";
import { publishToInstagram } from "../services/metaPublisher.js";
import { getSupabase, uploadPostImage } from "../db/supabase.js";
import {
  getPromptContext,
  getBestPostingHour,
  recordPostOutcome,
  saveViralScore,
  updatePostingTimeStats,
} from "../memory/mongolianTrendMemory.js";
import { collectEngagementForRecentPosts } from "../analytics/engagementCollector.js";
import { analyzeVirality } from "../analytics/viralityAnalyzer.js";
import { evolveContent } from "../optimizer/contentEvolutionEngine.js";
import { evolveVisuals } from "../optimizer/visualEvolutionEngine.js";
import { aggregateMetrics, scoreEngagement } from "../services/scorer.js";
import { storeAbVariants, evaluateAbWinners } from "./abTestRunner.js";
import { env } from "../config/env.js";
import { logEvent, logError } from "../utils/logger.js";
import type { PipelineRunStatus } from "../db/types.js";

async function startPipelineRun(runType: "generate_post" | "measure_optimize") {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("pipeline_runs")
    .insert({ run_type: runType, status: "running" })
    .select("id")
    .single();

  if (error) throw new Error(`Failed to start pipeline run: ${error.message}`);
  return data.id as string;
}

async function finishPipelineRun(
  runId: string,
  status: PipelineRunStatus,
  errors: string[],
  metadata: Record<string, unknown> = {}
) {
  const supabase = getSupabase();
  await supabase
    .from("pipeline_runs")
    .update({
      status,
      errors,
      metadata,
      completed_at: new Date().toISOString(),
    })
    .eq("id", runId);
}

export async function runGenerateAndPost(): Promise<void> {
  const runId = await startPipelineRun("generate_post");
  const errors: string[] = [];

  try {
    logEvent("pipeline.generate.start");

    const context = await getPromptContext();
    const scheduledHour = await getBestPostingHour();

    const contentResult = await runDailyContentAgent(context);
    const visualResult = await runVisualDirectorAgent(
      contentResult.primary.theme,
      contentResult.primary.hook,
      context
    );

    const imageBuffer = await generateImage(visualResult.primary.imagePromptText);
    const brandedBuffer = await renderBrandedImage(imageBuffer, {
      textOverlay: contentResult.primary.hook,
    });

    const { path, publicUrl } = await uploadPostImage(
      brandedBuffer,
      `${Date.now()}.png`
    );

    const supabase = getSupabase();
    const { data: post, error: postError } = await supabase
      .from("posts")
      .insert({
        theme: contentResult.primary.theme,
        hook: contentResult.primary.hook,
        captions: {
          instagram: contentResult.primary.caption,
        },
        visual_prompt: visualResult.primary.prompt,
        image_path: path,
        image_url: publicUrl,
        ab_variant: "primary",
        scheduled_hour: scheduledHour,
        status: "draft",
      })
      .select("id")
      .single();

    if (postError || !post) {
      throw new Error(`Failed to save post: ${postError?.message}`);
    }

    await storeAbVariants(
      post.id,
      contentResult.variants,
      visualResult.variants
    );

    const publishResult = await publishToInstagram({
      imageUrl: publicUrl,
      caption: contentResult.primary.caption,
    });

    await supabase.from("platform_posts").insert({
      post_id: post.id,
      platform: publishResult.platform,
      external_id: publishResult.externalId ?? null,
      status: publishResult.success ? "published" : "failed",
      error: publishResult.error ?? null,
      published_at: publishResult.success ? new Date().toISOString() : null,
    });

    if (!publishResult.success && publishResult.error) {
      errors.push(`${publishResult.platform}: ${publishResult.error}`);
    }

    await supabase
      .from("posts")
      .update({
        status: publishResult.success ? "published" : "failed",
        published_at: publishResult.success ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", post.id);

    const status: PipelineRunStatus =
      publishResult.success ? "completed" : "failed";

    await finishPipelineRun(runId, status, errors, {
      postId: post.id,
      imageUrl: publicUrl,
      scheduledHour,
    });

    logEvent("pipeline.generate.done", { postId: post.id, status });
  } catch (error) {
    logError("pipeline.generate.failed", error);
    errors.push(error instanceof Error ? error.message : String(error));
    await finishPipelineRun(runId, "failed", errors);
  }
}

export async function runMeasureAndOptimize(): Promise<void> {
  const runId = await startPipelineRun("measure_optimize");
  const errors: string[] = [];

  try {
    logEvent("pipeline.measure.start");

    const collectedPostIds = await collectEngagementForRecentPosts(72);
    const { top20, bottom20, all } = await analyzeVirality();

    const supabase = getSupabase();

    for (const ranked of all) {
      const { score, classification } = scoreEngagement(ranked.metrics);
      await saveViralScore(ranked.postId, score, classification);

      const { data: post } = await supabase
        .from("posts")
        .select("theme, hook, visual_prompt, scheduled_hour")
        .eq("id", ranked.postId)
        .single();

      if (post) {
        const visualStyle =
          typeof post.visual_prompt === "object" && post.visual_prompt !== null
            ? JSON.stringify(post.visual_prompt)
            : String(post.visual_prompt);

        await recordPostOutcome({
          hook: post.hook,
          theme: post.theme,
          visualStyle,
          score,
          scheduledHour: post.scheduled_hour ?? env.DEFAULT_POST_HOUR,
        });

        await updatePostingTimeStats(
          post.scheduled_hour ?? env.DEFAULT_POST_HOUR,
          score
        );
      }
    }

    await evolveContent(top20, bottom20);
    await evolveVisuals(top20);
    await evaluateAbWinners();

    const status: PipelineRunStatus =
      errors.length === 0 ? "completed" : "partial";

    await finishPipelineRun(runId, status, errors, {
      collectedCount: collectedPostIds.length,
      analyzedCount: all.length,
      topCount: top20.length,
    });

    logEvent("pipeline.measure.done", {
      collected: collectedPostIds.length,
      analyzed: all.length,
    });
  } catch (error) {
    logError("pipeline.measure.failed", error);
    errors.push(error instanceof Error ? error.message : String(error));
    await finishPipelineRun(runId, "failed", errors);
  }
}
