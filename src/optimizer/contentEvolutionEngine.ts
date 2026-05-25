import { upsertPattern } from "../memory/mongolianTrendMemory.js";
import type { RankedPost } from "../analytics/viralityAnalyzer.js";
import { extractAndStorePatterns, suppressWeakPatterns } from "../analytics/patternExtractor.js";
import { logEvent } from "../utils/logger.js";

export async function evolveContent(
  topPosts: RankedPost[],
  bottomPosts: RankedPost[]
): Promise<void> {
  logEvent("optimizer.contentEvolution.start");

  await extractAndStorePatterns(topPosts);
  await suppressWeakPatterns(bottomPosts);

  for (const post of topPosts) {
    await upsertPattern("hook_structure", post.hook, 0.15);
    await upsertPattern("emotional_tone", post.theme, 0.1);
  }

  logEvent("optimizer.contentEvolution.done");
}
