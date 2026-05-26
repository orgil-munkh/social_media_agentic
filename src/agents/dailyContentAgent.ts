import { generateHookVariants } from "../services/llm.js";
import {
  validateContentOutput,
  MongolianValidationError,
} from "../utils/mongolianGuard.js";
import {
  isDuplicateTheme,
  ThemeDuplicateError,
} from "../utils/themeDedup.js";
import type { ContentOutput, HookVariant, PromptContext } from "../db/types.js";
import { logEvent } from "../utils/logger.js";

export interface DailyContentResult {
  primary: ContentOutput;
  variants: HookVariant[];
}

const MAX_ATTEMPTS = 3;

export async function runDailyContentAgent(
  context: PromptContext
): Promise<DailyContentResult> {
  logEvent("agent.dailyContent.start");

  const avoidThemes: string[] = [];
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const rawVariants = await generateHookVariants(context, avoidThemes);
      const variants: HookVariant[] = rawVariants.map((v, i) => {
        validateContentOutput(v);
        return {
          ...v,
          variantKey: i === 0 ? "primary" : `hook_alt_${i}`,
        };
      });

      const usedThemes = [...context.recentThemes, ...avoidThemes];
      if (isDuplicateTheme(variants[0].theme, usedThemes)) {
        avoidThemes.push(variants[0].theme);
        logEvent("agent.dailyContent.themeDuplicate", {
          theme: variants[0].theme,
          attempt,
        });
        if (attempt >= MAX_ATTEMPTS) {
          throw new ThemeDuplicateError(
            `Theme duplicate after ${MAX_ATTEMPTS} attempts: ${variants[0].theme}`
          );
        }
        continue;
      }

      logEvent("agent.dailyContent.done", { variantCount: variants.length });
      return { primary: variants[0], variants };
    } catch (error) {
      lastError = error;
      if (error instanceof ThemeDuplicateError) {
        throw error;
      }
      if (error instanceof MongolianValidationError && attempt < MAX_ATTEMPTS) {
        logEvent("agent.dailyContent.retry", { reason: error.message });
        continue;
      }
      throw error;
    }
  }

  throw (
    lastError ??
    new ThemeDuplicateError(`Theme duplicate after ${MAX_ATTEMPTS} attempts`)
  );
}
