import {
  generateHookVariants,
} from "../services/llm.js";
import {
  validateContentOutput,
  MongolianValidationError,
} from "../utils/mongolianGuard.js";
import type { ContentOutput, HookVariant, PromptContext } from "../db/types.js";
import { logEvent } from "../utils/logger.js";

export interface DailyContentResult {
  primary: ContentOutput;
  variants: HookVariant[];
}

export async function runDailyContentAgent(
  context: PromptContext
): Promise<DailyContentResult> {
  logEvent("agent.dailyContent.start");

  let lastError: unknown;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const rawVariants = await generateHookVariants(context);
      const variants: HookVariant[] = rawVariants.map((v, i) => {
        validateContentOutput(v);
        return {
          ...v,
          variantKey: i === 0 ? "primary" : `hook_alt_${i}`,
        };
      });

      logEvent("agent.dailyContent.done", { variantCount: variants.length });
      return { primary: variants[0], variants };
    } catch (error) {
      lastError = error;
      if (error instanceof MongolianValidationError && attempt < 2) {
        logEvent("agent.dailyContent.retry", { reason: error.message });
        continue;
      }
      throw error;
    }
  }

  throw lastError;
}
