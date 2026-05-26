export type PostStatus = "draft" | "scheduled" | "published" | "failed";
export type PlatformType = "instagram";
export type PublishStatus = "pending" | "published" | "failed";
export type ScoreClassification = "viral" | "good" | "weak";
export type PatternType =
  | "hook_structure"
  | "emotional_tone"
  | "sentence_rhythm"
  | "cultural_expression"
  | "visual_style";
export type MemoryCategory = "hook" | "tone" | "visual" | "theme" | "posting_time";
export type AbVariantType = "hook" | "visual";
export type PipelineRunType = "generate_post" | "measure_optimize";
export type PipelineRunStatus = "running" | "completed" | "partial" | "failed";

export interface PlatformCaptions {
  instagram: string;
}

export interface VisualPrompt {
  scene: string;
  mood: string;
  colorPalette: string;
  quoteContextEn: string;
  composition: string;
}

export interface ContentOutput {
  theme: string;
  hook: string;
  caption: string;
}

export interface HookVariant extends ContentOutput {
  variantKey: string;
}

export interface VisualVariant {
  variantKey: string;
  prompt: VisualPrompt;
  imagePromptText: string;
}

export interface EngagementMetrics {
  likes: number;
  comments: number;
  shares: number;
  saves: number;
}

export interface ViralScoreResult {
  score: number;
  classification: ScoreClassification;
}

export interface PromptContext {
  topHooks: string[];
  topTones: string[];
  topThemes: string[];
  topVisuals: string[];
  suppressedPatterns: string[];
  recentThemes: string[];
}

export interface PostRow {
  id: string;
  theme: string;
  hook: string;
  captions: PlatformCaptions;
  visual_prompt: VisualPrompt;
  image_path: string | null;
  image_url: string | null;
  ab_variant: string;
  scheduled_hour: number | null;
  status: PostStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlatformPostRow {
  id: string;
  post_id: string;
  platform: PlatformType;
  external_id: string | null;
  status: PublishStatus;
  error: string | null;
  published_at: string | null;
}

export interface PublishResult {
  platform: PlatformType;
  success: boolean;
  externalId?: string;
  error?: string;
}
