import { env } from "../config/env.js";
import type { PublishResult } from "../db/types.js";
import { withRetry } from "../utils/retry.js";
import { logEvent, logError } from "../utils/logger.js";

const GRAPH_BASE = `https://graph.facebook.com/${env.META_GRAPH_VERSION}`;

interface PublishInput {
  imageUrl: string;
  caption: string;
}

async function graphPost(
  path: string,
  params: Record<string, string>
): Promise<Record<string, unknown>> {
  const body = new URLSearchParams({
    ...params,
    access_token: env.META_ACCESS_TOKEN ?? "",
  });

  const res = await fetch(`${GRAPH_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const data = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    throw new Error(
      `Meta API error: ${JSON.stringify(data)}`
    );
  }
  return data;
}

async function graphGet(path: string): Promise<Record<string, unknown>> {
  const url = new URL(`${GRAPH_BASE}${path}`);
  url.searchParams.set("access_token", env.META_ACCESS_TOKEN ?? "");
  const res = await fetch(url);
  const data = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    throw new Error(`Meta API error: ${JSON.stringify(data)}`);
  }
  return data;
}

async function waitForInstagramContainer(containerId: string): Promise<void> {
  for (let i = 0; i < 10; i++) {
    const status = await graphGet(`/${containerId}?fields=status_code`);
    if (status.status_code === "FINISHED") return;
    if (status.status_code === "ERROR") {
      throw new Error("Instagram container processing failed");
    }
    await sleep(3000);
  }
  throw new Error("Instagram container processing timeout");
}

async function publishInstagramPost(
  imageUrl: string,
  caption: string
): Promise<string> {
  const container = await graphPost(`/${env.META_IG_USER_ID}/media`, {
    image_url: imageUrl,
    caption,
  });
  const containerId = String(container.id);
  await waitForInstagramContainer(containerId);

  const published = await graphPost(
    `/${env.META_IG_USER_ID}/media_publish`,
    { creation_id: containerId }
  );
  return String(published.id);
}

export async function publishToInstagram(
  input: PublishInput
): Promise<PublishResult> {
  const platform = "instagram" as const;

  if (env.DRY_RUN) {
    logEvent("meta.publish.dry_run", { platform });
    return { platform, success: true, externalId: "dry-run-instagram" };
  }

  if (!env.META_ACCESS_TOKEN) {
    return { platform, success: false, error: "META_ACCESS_TOKEN missing" };
  }

  if (!env.META_IG_USER_ID) {
    return { platform, success: false, error: "META_IG_USER_ID missing" };
  }

  try {
    const externalId = await withRetry(
      () => publishInstagramPost(input.imageUrl, input.caption),
      "meta.instagram"
    );

    logEvent("meta.publish.success", { platform, externalId });
    return { platform, success: true, externalId };
  } catch (error) {
    logError("meta.publish.failed", error, { platform });
    return {
      platform,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function fetchInstagramInsights(
  externalId: string
): Promise<{ likes: number; comments: number; shares: number; saves: number }> {
  if (env.DRY_RUN) {
    return { likes: 10, comments: 3, shares: 0, saves: 2 };
  }

  try {
    const data = await graphGet(
      `/${externalId}?fields=like_count,comments_count`
    );
    return {
      likes: Number(data.like_count ?? 0),
      comments: Number(data.comments_count ?? 0),
      shares: 0,
      saves: 0,
    };
  } catch (error) {
    logError("meta.insights.failed", error, { platform: "instagram", externalId });
    return { likes: 0, comments: 0, shares: 0, saves: 0 };
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
