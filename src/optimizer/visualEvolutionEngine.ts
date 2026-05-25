import { upsertPattern } from "../memory/mongolianTrendMemory.js";
import type { RankedPost } from "../analytics/viralityAnalyzer.js";
import { logEvent } from "../utils/logger.js";

export async function evolveVisuals(topPosts: RankedPost[]): Promise<void> {
  logEvent("optimizer.visualEvolution.start");

  for (const post of topPosts) {
    try {
      const visual = JSON.parse(post.visualPrompt) as {
        mood?: string;
        colorPalette?: string;
        composition?: string;
      };

      if (visual.mood) {
        await upsertPattern("visual_style", visual.mood, 0.15);
      }
      if (visual.colorPalette) {
        await upsertPattern("visual_style", visual.colorPalette, 0.1);
      }
      if (visual.composition) {
        await upsertPattern("visual_style", visual.composition, 0.1);
      }
    } catch {
      await upsertPattern("visual_style", post.visualPrompt.slice(0, 200), 0.05);
    }
  }

  logEvent("optimizer.visualEvolution.done");
}
