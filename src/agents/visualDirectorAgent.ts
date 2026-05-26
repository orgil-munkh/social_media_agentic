import {
  buildImagePromptText,
  generateVisualVariants,
} from "../services/llm.js";
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

  const rawVariants = await generateVisualVariants(theme, hook, context);
  const variants: VisualVariant[] = rawVariants.map((v) => ({
    variantKey: v.variantKey,
    prompt: v.prompt,
    imagePromptText: buildImagePromptText(hook, theme, v.prompt),
  }));

  const primary =
    variants.find((v) => v.variantKey === "primary") ?? variants[0];

  logEvent("agent.visualDirector.done", { variantCount: variants.length });
  return { primary, variants };
}
