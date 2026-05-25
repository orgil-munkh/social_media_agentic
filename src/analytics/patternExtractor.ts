import { extractPatternsFromPosts } from "../services/llm.js";
import { upsertPattern } from "../memory/mongolianTrendMemory.js";
import type { RankedPost } from "./viralityAnalyzer.js";
import { logEvent } from "../utils/logger.js";

const PATTERN_TYPE_MAP = {
  hookStructures: "hook_structure",
  emotionalTones: "emotional_tone",
  sentenceRhythms: "sentence_rhythm",
  culturalExpressions: "cultural_expression",
  visualStyles: "visual_style",
} as const;

export async function extractAndStorePatterns(
  topPosts: RankedPost[]
): Promise<void> {
  if (topPosts.length === 0) return;

  logEvent("analytics.patternExtract.start", { count: topPosts.length });

  const extracted = await extractPatternsFromPosts(
    topPosts.map((p) => ({
      hook: p.hook,
      theme: p.theme,
      visualPrompt: p.visualPrompt,
      score: p.score,
    }))
  );

  for (const [key, patterns] of Object.entries(extracted)) {
    const patternType = PATTERN_TYPE_MAP[key as keyof typeof PATTERN_TYPE_MAP];
    if (!patternType) continue;

    for (const pattern of patterns) {
      await upsertPattern(patternType, pattern, 0.2);
    }
  }

  logEvent("analytics.patternExtract.done");
}

export async function suppressWeakPatterns(
  bottomPosts: RankedPost[]
): Promise<void> {
  for (const post of bottomPosts) {
    await upsertPattern("hook_structure", post.hook, -0.3);
  }
}
