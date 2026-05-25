import {
  buildImagePromptText,
  generateVisualVariants,
} from "../services/llm.js";
import {
  validateTextOverlay,
  MongolianValidationError,
} from "../utils/mongolianGuard.js";
import type { PromptContext, VisualVariant } from "../db/types.js";
import { logEvent } from "../utils/logger.js";

export interface VisualDirectorResult {
  primary: VisualVariant;
  variants: VisualVariant[];
}

export async function runVisualDirectorAgent(
  theme: string,
  hook: string,
  context: PromptContext
): Promise<VisualDirectorResult> {
  logEvent("agent.visualDirector.start");

  let lastError: unknown;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const rawVariants = await generateVisualVariants(theme, hook, context);
      const variants: VisualVariant[] = rawVariants.map((v) => {
        validateTextOverlay(v.prompt.textOverlay);
        return {
          variantKey: v.variantKey,
          prompt: v.prompt,
          imagePromptText: buildImagePromptText(v.prompt),
        };
      });

      const primary =
        variants.find((v) => v.variantKey === "primary") ?? variants[0];

      logEvent("agent.visualDirector.done", { variantCount: variants.length });
      return { primary, variants };
    } catch (error) {
      lastError = error;
      if (error instanceof MongolianValidationError && attempt < 2) {
        logEvent("agent.visualDirector.retry", {
          reason: error.message,
        });
        continue;
      }
      throw error;
    }
  }

  throw lastError;
}
