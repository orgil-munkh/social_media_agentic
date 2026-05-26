import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { env } from "../config/env.js";
import { dedupeThemes } from "../utils/themeDedup.js";
import type { PromptContext } from "../db/types.js";

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
  textOverlay: z.string().optional(),
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

const MONGOLIAN_CONTENT_RULES = `
Чухал дүрэм:
- БҮХ текст 100% монгол хэлээр, соёлын хэлбэрээр бичнэ
- Англи үг, орчуулгын бүтэц хориглоно
- Нэг пост = нэг санаа
- Ерөнхий motivational quote биш, шууд, эмotional, identity-based hook
- 18-35 насны монгол залуусын social media хэлбэр
- Шууд confrontation tone, self-reflection trigger
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
      ? `\nСүүлийн ${env.THEME_DEDUP_DAYS} хоногт ашигласан theme (ДАВТАЖ БОЛОХГҮЙ, exact match):
${blockedThemes.map((t) => `- ${t}`).join("\n")}`
      : "";

  return `Та монгол хэл дээр viral social media контент бичдэг мэргэжилтэн.

${MONGOLIAN_CONTENT_RULES}

Амжилттай hook жишээ:
${context.topHooks.map((h) => `- ${h}`).join("\n") || "- Чи залхуу биш. Чи зүгээр л хяналтаа алдсан."}

Амжилттай tone:
${context.topTones.map((t) => `- ${t}`).join("\n") || "- Шууд, эелдэг бус, өөртөө шүүмжлэлтэй"}

Сонирхолтой theme:
${context.topThemes.map((t) => `- ${t}`).join("\n") || "- Сахилга, хяналт, өөртөө итгэх итгэл"}

Хэрэглэхгүй бүтэц (сул гүйцэтгэл):
${context.suppressedPatterns.map((p) => `- ${p}`).join("\n") || "- Ерөнхий motivational quote"}${blockedThemesSection}

Instagram caption формат:
- hook + 2-3 мөр, hashtag 3-5 (монгол)`;
}

function buildVisualSystemPrompt(context: PromptContext): string {
  return `Та Instagram viral зурагны visual director.

Дүрэм:
- Minimal cinematic design
- Dark aesthetic, strong emotional contrast
- 4:5 vertical portrait composition for Instagram feed
- Keep bottom third clear for text overlay (text rendered separately)
- High readability composition (text overlay post-rendered separately)
- DO NOT include Cyrillic/Mongolian text in scene description — textOverlay field only
- Scene descriptions in English for image model

Амжилттай visual styles:
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
      "2-3 өөр hook variant үүсгэ. Нэг санаа, өөр Mongolian hook structure. Instagram caption бүрт hook + 2-3 мөр + hashtag. Бүх field монгол хэлээр. theme нь дээрх хориглосон жагсаалтад байгаа утгатай яг таарах ёсгүй.",
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
    prompt: `Theme: ${theme}\nHook: ${hook}\n\n2 visual variant үүсгэ. variantKey: "primary" болон "alternate". textOverlay монгол хэлээр (optional). Scene/mood/composition English.`,
  });
  return object.variants;
}

export async function extractPatternsFromPosts(
  posts: Array<{ hook: string; theme: string; visualPrompt: string; score: number }>
) {
  const { object } = await generateObject({
    model: openai(env.OPENAI_TEXT_MODEL),
    schema: extractedPatternsSchema,
    system: "Extract reusable Mongolian viral content patterns from top-performing posts.",
    prompt: JSON.stringify(posts, null, 2),
  });
  return object;
}

export function buildImagePromptText(prompt: {
  scene: string;
  mood: string;
  colorPalette: string;
  composition: string;
}): string {
  return [
    "Minimal cinematic social media image.",
    `Scene: ${prompt.scene}`,
    `Mood: ${prompt.mood}`,
    `Colors: ${prompt.colorPalette}`,
    `Composition: ${prompt.composition}`,
    "Dark aesthetic, high emotional contrast, Instagram viral style.",
    "Vertical 4:5 portrait composition.",
    "No text, no letters, no watermarks in the image.",
  ].join(" ");
}
