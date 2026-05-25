import sharp from "sharp";
import { env } from "../config/env.js";
import {
  IG_POST_HEIGHT,
  IG_POST_WIDTH,
} from "../config/imageDimensions.js";
import { validateTextOverlay } from "../utils/mongolianGuard.js";

export interface BrandRenderOptions {
  textOverlay?: string;
}

const OVERLAY_FONT_SIZE = 52;
const OVERLAY_MAX_CHARS_PER_LINE = 28;
const OVERLAY_LINE_HEIGHT = 1.2;

export async function renderBrandedImage(
  imageBuffer: Buffer,
  options: BrandRenderOptions = {}
): Promise<Buffer> {
  validateTextOverlay(options.textOverlay);

  const base = sharp(imageBuffer).resize(IG_POST_WIDTH, IG_POST_HEIGHT, {
    fit: "cover",
  });
  const composites: sharp.OverlayOptions[] = [];

  if (options.textOverlay) {
    const lines = wrapText(options.textOverlay, OVERLAY_MAX_CHARS_PER_LINE);
    const lineCount = lines.length;
    const textBlockHeight = lineCount * OVERLAY_FONT_SIZE * OVERLAY_LINE_HEIGHT;
    const startY = IG_POST_HEIGHT - 80 - textBlockHeight;
    const tspans = lines
      .map((line, i) => {
        const dy = i === 0 ? 0 : `${OVERLAY_LINE_HEIGHT}em`;
        return `<tspan x="512" dy="${dy}">${escapeXml(line)}</tspan>`;
      })
      .join("");

    const overlaySvg = `
      <svg width="${IG_POST_WIDTH}" height="${IG_POST_HEIGHT}">
        <style>
          .overlay { fill: white; font-size: ${OVERLAY_FONT_SIZE}px; font-family: Arial, sans-serif; font-weight: bold; }
        </style>
        <text x="512" y="${startY}" text-anchor="middle" class="overlay">${tspans}</text>
      </svg>`;
    composites.push({ input: Buffer.from(overlaySvg), top: 0, left: 0 });
  }

  const watermarkSvg = `
    <svg width="200" height="40">
      <text x="200" y="30" text-anchor="end" fill="white" fill-opacity="0.15"
        font-size="18" font-family="Arial, sans-serif">${escapeXml(env.BRAND_NAME)}</text>
    </svg>`;

  composites.push({
    input: Buffer.from(watermarkSvg),
    top: IG_POST_HEIGHT - 48,
    left: IG_POST_WIDTH - 220,
  });

  return base.composite(composites).png().toBuffer();
}

function wrapText(text: string, maxCharsPerLine: number): string[] {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxCharsPerLine) {
      current = next;
    } else {
      if (current) lines.push(current);
      if (word.length > maxCharsPerLine) {
        for (let i = 0; i < word.length; i += maxCharsPerLine) {
          lines.push(word.slice(i, i + maxCharsPerLine));
        }
        current = "";
      } else {
        current = word;
      }
    }
  }

  if (current) lines.push(current);
  return lines.length > 0 ? lines : [text.trim()];
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
