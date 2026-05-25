import { getSupabase } from "../db/supabase.js";
import type {
  MemoryCategory,
  PatternType,
  PromptContext,
} from "../db/types.js";

export async function getPromptContext(): Promise<PromptContext> {
  const supabase = getSupabase();

  const [hooks, tones, themes, visuals, suppressed] = await Promise.all([
    supabase
      .from("trend_memory")
      .select("content")
      .eq("category", "hook")
      .order("score", { ascending: false })
      .limit(10),
    supabase
      .from("trend_memory")
      .select("content")
      .eq("category", "tone")
      .order("score", { ascending: false })
      .limit(5),
    supabase
      .from("trend_memory")
      .select("content")
      .eq("category", "theme")
      .order("score", { ascending: false })
      .limit(5),
    supabase
      .from("trend_memory")
      .select("content")
      .eq("category", "visual")
      .order("score", { ascending: false })
      .limit(5),
    supabase
      .from("mongolian_patterns")
      .select("pattern")
      .lt("performance_weight", 0.5)
      .order("performance_weight", { ascending: true })
      .limit(10),
  ]);

  return {
    topHooks: (hooks.data ?? []).map((r) => r.content),
    topTones: (tones.data ?? []).map((r) => r.content),
    topThemes: (themes.data ?? []).map((r) => r.content),
    topVisuals: (visuals.data ?? []).map((r) => r.content),
    suppressedPatterns: (suppressed.data ?? []).map((r) => r.pattern),
  };
}

export async function recordPostOutcome(input: {
  hook: string;
  theme: string;
  visualStyle: string;
  score: number;
  scheduledHour: number;
}): Promise<void> {
  const supabase = getSupabase();

  await Promise.all([
    upsertTrendMemory("hook", input.hook, input.score),
    upsertTrendMemory("theme", input.theme, input.score),
    upsertTrendMemory("visual", input.visualStyle, input.score),
    upsertTrendMemory(
      "posting_time",
      `${input.scheduledHour}:00`,
      input.score,
      { hour: input.scheduledHour }
    ),
  ]);
}

async function upsertTrendMemory(
  category: MemoryCategory,
  content: string,
  score: number,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  const supabase = getSupabase();

  const { data: existing } = await supabase
    .from("trend_memory")
    .select("id, score")
    .eq("category", category)
    .eq("content", content)
    .maybeSingle();

  if (existing) {
    const newScore = Math.max(Number(existing.score), score);
    await supabase
      .from("trend_memory")
      .update({ score: newScore, metadata, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
  } else {
    await supabase.from("trend_memory").insert({
      category,
      content,
      score,
      metadata,
    });
  }
}

export async function upsertPattern(
  patternType: PatternType,
  pattern: string,
  weightDelta: number
): Promise<void> {
  const supabase = getSupabase();

  const { data: existing } = await supabase
    .from("mongolian_patterns")
    .select("id, performance_weight, usage_count")
    .eq("pattern_type", patternType)
    .eq("pattern", pattern)
    .maybeSingle();

  if (existing) {
    const newWeight = Math.max(
      0.1,
      Math.min(5, Number(existing.performance_weight) + weightDelta)
    );
    await supabase
      .from("mongolian_patterns")
      .update({
        performance_weight: newWeight,
        usage_count: existing.usage_count + 1,
        last_used_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else {
    await supabase.from("mongolian_patterns").insert({
      pattern_type: patternType,
      pattern,
      performance_weight: Math.max(0.5, 1 + weightDelta),
      usage_count: 1,
      last_used_at: new Date().toISOString(),
    });
  }
}

export async function getBestPostingHour(): Promise<number> {
  const supabase = getSupabase();
  const candidateHours = [8, 13, 19];
  const platform = "instagram";

  const { data } = await supabase
    .from("posting_time_stats")
    .select("hour, avg_engagement, sample_count")
    .eq("platform", platform)
    .in("hour", candidateHours)
    .order("avg_engagement", { ascending: false });

  if (!data || data.length === 0) {
    return candidateHours[0];
  }

  const withSamples = data.filter((d) => d.sample_count > 0);
  if (withSamples.length === 0) {
    const dayIndex = new Date().getDay() % candidateHours.length;
    return candidateHours[dayIndex];
  }

  return withSamples[0].hour;
}

export async function updatePostingTimeStats(
  hour: number,
  engagement: number
): Promise<void> {
  const supabase = getSupabase();
  const platform = "instagram";

  const { data: existing } = await supabase
    .from("posting_time_stats")
    .select("avg_engagement, sample_count")
    .eq("hour", hour)
    .eq("platform", platform)
    .maybeSingle();

  if (existing) {
    const count = existing.sample_count + 1;
    const avg =
      (Number(existing.avg_engagement) * existing.sample_count + engagement) /
      count;
    await supabase
      .from("posting_time_stats")
      .update({ avg_engagement: avg, sample_count: count, updated_at: new Date().toISOString() })
      .eq("hour", hour)
      .eq("platform", platform);
  } else {
    await supabase.from("posting_time_stats").insert({
      hour,
      platform,
      avg_engagement: engagement,
      sample_count: 1,
    });
  }
}

export async function saveViralScore(
  postId: string,
  score: number,
  classification: string
): Promise<void> {
  const supabase = getSupabase();
  await supabase.from("viral_scores").insert({
    post_id: postId,
    score,
    classification,
  });
}
