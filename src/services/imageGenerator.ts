import OpenAI from "openai";
import { OPENAI_IMAGE_SIZE } from "../config/imageDimensions.js";
import { env } from "../config/env.js";
import { withRetry } from "../utils/retry.js";
import { logEvent } from "../utils/logger.js";

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

export async function generateImage(prompt: string): Promise<Buffer> {
  logEvent("image.generate.start", { model: env.OPENAI_IMAGE_MODEL });

  const response = await withRetry(
    () =>
      openai.images.generate({
        model: env.OPENAI_IMAGE_MODEL,
        prompt,
        size: OPENAI_IMAGE_SIZE,
        quality: "high",
      }),
    "openai.images.generate"
  );

  const b64 = response.data?.[0]?.b64_json;
  if (!b64) {
    throw new Error("OpenAI image generation returned no data");
  }

  logEvent("image.generate.done");
  return Buffer.from(b64, "base64");
}
