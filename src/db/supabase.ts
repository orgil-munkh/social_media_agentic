import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!client) {
    client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

export async function uploadPostImage(
  buffer: Buffer,
  filename: string
): Promise<{ path: string; publicUrl: string }> {
  const supabase = getSupabase();
  const path = `posts/${Date.now()}-${filename}`;

  const { error } = await supabase.storage
    .from("post-images")
    .upload(path, buffer, {
      contentType: "image/png",
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  const { data } = supabase.storage.from("post-images").getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}
