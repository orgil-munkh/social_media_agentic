import { getSupabase } from "../db/supabase.js";
import { fetchInstagramInsights } from "../services/metaPublisher.js";
import type { EngagementMetrics } from "../db/types.js";
import { logEvent, logError } from "../utils/logger.js";

export async function collectEngagementForPost(
  postId: string
): Promise<EngagementMetrics[]> {
  const supabase = getSupabase();

  const { data: platformPosts, error } = await supabase
    .from("platform_posts")
    .select("platform, external_id, status")
    .eq("post_id", postId)
    .eq("platform", "instagram")
    .eq("status", "published");

  if (error) {
    throw new Error(`Failed to fetch platform posts: ${error.message}`);
  }

  const results: EngagementMetrics[] = [];

  for (const pp of platformPosts ?? []) {
    if (!pp.external_id) continue;

    try {
      const metrics = await fetchInstagramInsights(pp.external_id);

      await supabase.from("engagement_metrics").insert({
        post_id: postId,
        platform: pp.platform,
        ...metrics,
      });

      results.push(metrics);
      logEvent("analytics.engagement.collected", {
        postId,
        platform: pp.platform,
        metrics,
      });
    } catch (err) {
      logError("analytics.engagement.failed", err, {
        postId,
        platform: pp.platform,
      });
    }
  }

  return results;
}

export async function collectEngagementForRecentPosts(
  hoursAgo = 72
): Promise<string[]> {
  const supabase = getSupabase();
  const since = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();

  const { data: posts } = await supabase
    .from("posts")
    .select("id")
    .eq("status", "published")
    .gte("published_at", since);

  const collected: string[] = [];

  for (const post of posts ?? []) {
    try {
      await collectEngagementForPost(post.id);
      collected.push(post.id);
    } catch (err) {
      logError("analytics.collectPost.failed", err, { postId: post.id });
    }
  }

  return collected;
}
