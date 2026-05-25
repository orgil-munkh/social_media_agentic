import { config } from "dotenv";
import { z } from "zod";

config();

const envSchema = z.object({
  OPENAI_API_KEY: z.string().min(1),
  OPENAI_IMAGE_MODEL: z.string().default("gpt-image-2"),
  OPENAI_TEXT_MODEL: z.string().default("gpt-4o"),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  META_ACCESS_TOKEN: z.string().optional(),
  META_IG_USER_ID: z.string().optional(),
  META_GRAPH_VERSION: z.string().default("v22.0"),
  BRAND_NAME: z.string().default("discipline.mn"),
  DEFAULT_POST_HOUR: z.coerce.number().int().min(0).max(23).default(8),
  DRY_RUN: z
    .string()
    .optional()
    .transform((v) => v === "true" || v === "1"),
  TZ: z.string().default("Asia/Ulaanbaatar"),
});

export type Env = z.infer<typeof envSchema>;

export const env: Env = envSchema.parse(process.env);

export const POSTING_CANDIDATE_HOURS = [8, 13, 19] as const;
