import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { env } from "../config/env.js";
import { dedupeThemes } from "../utils/themeDedup.js";
import type { PromptContext, VisualPrompt } from "../db/types.js";

const openai = createOpenAI({ apiKey: env.OPENAI_API_KEY });

export const contentOutputSchema = z.object({
  theme: z.string(),
  hook: z.string(),
  caption: z.string(),
});

export const hookVariantsSchema = z.object({
  variants: z.array(contentOutputSchema).min(2).max(3),
});

export const visualPromptSchema = z.object({
  scene: z.string(),
  mood: z.string(),
  colorPalette: z.string(),
  quoteContextEn: z.string(),
  composition: z.string(),
});

export const visualVariantsSchema = z.object({
  variants: z
    .array(
      z.object({
        variantKey: z.string(),
        prompt: visualPromptSchema,
      })
    )
    .length(2),
});

export const extractedPatternsSchema = z.object({
  hookStructures: z.array(z.string()),
  emotionalTones: z.array(z.string()),
  sentenceRhythms: z.array(z.string()),
  culturalExpressions: z.array(z.string()),
  visualStyles: z.array(z.string()),
});

const CONTENT_OUTPUT_RULES = `
Output language: theme, hook, and caption MUST be native Mongolian Cyrillic. Do not use English in generated content fields.

Content rules:
- All output text must be 100% Mongolian in natural cultural phrasing
- No English words or translated-sentence structures
- One post = one idea
- Not generic motivational quotes — use direct, emotional, identity-based hooks
- Target Mongolian young adults aged 18–35 on social media
- Direct confrontation tone, self-reflection triggers
- Discipline vs laziness contrast, identity framing
`;

function buildContentSystemPrompt(
  context: PromptContext,
  avoidThemes: string[] = []
): string {
  const blockedThemes = dedupeThemes([
    ...context.recentThemes,
    ...avoidThemes,
  ]);
  const blockedThemesSection =
    blockedThemes.length > 0
      ? `\nThemes used in the last ${env.THEME_DEDUP_DAYS} days (DO NOT REUSE, exact match):
${blockedThemes.map((t) => `- ${t}`).join("\n")}`
      : "";

  return `You are an expert at writing viral Mongolian-language social media content.

${CONTENT_OUTPUT_RULES}

Successful hook examples:
${context.topHooks.map((h) => `- ${h}`).join("\n") || "- Чи залхуу биш. Чи зүгээр л хяналтаа алдсан."}

Successful tone:
${context.topTones.map((t) => `- ${t}`).join("\n") || "- Шууд, эелдэг бус, өөртөө шүүмжлэлтэй"}

High-performing themes:
${context.topThemes.map((t) => `- ${t}`).join("\n") || "- Сахилга, хяналт, өөртөө итгэх итгэл"}

Patterns to avoid (weak performance):
${context.suppressedPatterns.map((p) => `- ${p}`).join("\n") || "- Generic motivational quote"}${blockedThemesSection}

Instagram caption format:
- hook + 2-3 lines, 3-5 hashtags (Mongolian)`;
}

function buildVisualSystemPrompt(context: PromptContext): string {
  return `You are a visual director for viral Instagram images.

Rules:
- Minimal cinematic design
- Dark aesthetic, strong emotional contrast
- 4:5 vertical portrait composition for Instagram feed
- Keep bottom third clear for text overlay (text rendered separately in post-processing)
- High readability composition (text overlay post-rendered separately)
- Scene, mood, colorPalette, composition, and quoteContextEn must be in English
- Read the Mongolian hook, infer its core emotional message, and design scene/mood/composition to visually metaphorize or symbolize that message
- The image must reflect the quote's meaning — avoid generic motivational imagery unrelated to the hook

Successful visual styles:
${context.topVisuals.map((v) => `- ${v}`).join("\n") || "- Dark moody silhouette, high contrast lighting"}`;
}

export async function generateHookVariants(
  context: PromptContext,
  avoidThemes: string[] = []
) {
  const { object } = await generateObject({
    model: openai(env.OPENAI_TEXT_MODEL),
    schema: hookVariantsSchema,
    system: buildContentSystemPrompt(context, avoidThemes),
    prompt:
      "Generate 2-3 hook variants. Each variant shares one idea but uses a different Mongolian hook structure. Each caption must include hook + 2-3 lines + hashtags. All theme, hook, and caption fields must be in Mongolian Cyrillic. theme must not exactly match any blocked theme in the list above.",
  });
  return object.variants;
}

export async function generateVisualVariants(
  theme: string,
  hook: string,
  context: PromptContext
) {
  const { object } = await generateObject({
    model: openai(env.OPENAI_TEXT_MODEL),
    schema: visualVariantsSchema,
    system: buildVisualSystemPrompt(context),
    prompt: `Theme: ${theme}
Hook (Mongolian quote): ${hook}

Generate 2 visual variants with variantKey "primary" and "alternate".
For each variant:
1. Read the Mongolian hook and write quoteContextEn: 1-2 English sentences describing what the quote means visually.
2. Design scene, mood, colorPalette, and composition in English so the image metaphorically reflects the hook's emotional message.
Scene/mood/composition/quoteContextEn must be in English.`,
  });
  return object.variants;
}

export async function extractPatternsFromPosts(
  posts: Array<{ hook: string; theme: string; visualPrompt: string; score: number }>
) {
  const { object } = await generateObject({
    model: openai(env.OPENAI_TEXT_MODEL),
    schema: extractedPatternsSchema,
    system:
      "Extract reusable Mongolian viral content patterns from top-performing posts. Text patterns (hookStructures, emotionalTones, sentenceRhythms, culturalExpressions) should remain in Mongolian where applicable. visualStyles may be in English.",
    prompt: JSON.stringify(posts, null, 2),
  });
  return object;
}

export function buildImagePromptText(
  hook: string,
  theme: string,
  prompt: VisualPrompt
): string {
  return [
    "Minimal cinematic social media image.",
    `Quote message (Mongolian): ${hook}`,
    `Theme: ${theme}`,
    `Visual interpretation: ${prompt.quoteContextEn}`,
    `Scene: ${prompt.scene}`,
    `Mood: ${prompt.mood}`,
    `Colors: ${prompt.colorPalette}`,
    `Composition: ${prompt.composition}`,
    "The image must visually support and reflect the quote's meaning; avoid generic motivational imagery unrelated to the quote.",
    "Dark aesthetic, high emotional contrast, Instagram viral style.",
    "Vertical 4:5 portrait composition.",
    "No text, no letters, no watermarks in the image.",
  ].join(" ");
}
