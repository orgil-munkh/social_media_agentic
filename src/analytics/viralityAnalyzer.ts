import { getSupabase } from "../db/supabase.js";
import { aggregateMetrics, scoreEngagement } from "../services/scorer.js";
import type { EngagementMetrics } from "../db/types.js";

export interface RankedPost {
  postId: string;
  hook: string;
  theme: string;
  visualPrompt: string;
  score: number;
  classification: string;
  metrics: EngagementMetrics;
}

export async function analyzeVirality(): Promise<{
  top20: RankedPost[];
  bottom20: RankedPost[];
  all: RankedPost[];
}> {
  const supabase = getSupabase();

  const { data: posts } = await supabase
    .from("posts")
    .select("id, hook, theme, visual_prompt, published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(100);

  if (!posts || posts.length === 0) {
    return { top20: [], bottom20: [], all: [] };
  }

  const ranked: RankedPost[] = [];

  for (const post of posts) {
    const { data: metricsRows } = await supabase
      .from("engagement_metrics")
      .select("likes, comments, shares, saves")
      .eq("post_id", post.id)
      .eq("platform", "instagram")
      .order("collected_at", { ascending: false })
      .limit(3);

    if (!metricsRows || metricsRows.length === 0) continue;

    const aggregated = aggregateMetrics(
      metricsRows.map((m) => ({
        likes: m.likes,
        comments: m.comments,
        shares: m.shares,
        saves: m.saves,
      }))
    );

    const { score, classification } = scoreEngagement(aggregated);
    const visualPrompt =
      typeof post.visual_prompt === "object" && post.visual_prompt !== null
        ? JSON.stringify(post.visual_prompt)
        : String(post.visual_prompt);

    ranked.push({
      postId: post.id,
      hook: post.hook,
      theme: post.theme,
      visualPrompt,
      score,
      classification,
      metrics: aggregated,
    });
  }

  ranked.sort((a, b) => b.score - a.score);

  const topCount = Math.max(1, Math.ceil(ranked.length * 0.2));
  const bottomCount = Math.max(1, Math.ceil(ranked.length * 0.2));

  return {
    top20: ranked.slice(0, topCount),
    bottom20: ranked.slice(-bottomCount),
    all: ranked,
  };
}
