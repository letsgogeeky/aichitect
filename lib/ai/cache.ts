import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";

function getClient() {
  const url = process.env.NEXT_PUBLIC_POSTGRES_SUPABASE_URL;
  const key = process.env.POSTGRES_SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

/**
 * Returns a SHA-256 hex string over the joined parts.
 * Use to build deterministic cache keys from variable-length inputs.
 */
export function buildAICacheKey(parts: string[]): string {
  return createHash("sha256").update(parts.join("|")).digest("hex");
}

export async function getAICachedResponse<T>(cacheKey: string): Promise<T | null> {
  const db = getClient();
  if (!db) return null;
  const { data, error } = await db
    .from("ai_response_cache")
    .select("response")
    .eq("cache_key", cacheKey)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  if (error || !data) return null;
  return data.response as T;
}

export async function setAICachedResponse<T>(
  cacheKey: string,
  response: T,
  ttlSeconds = 86400
): Promise<void> {
  const db = getClient();
  if (!db) return;
  await db.from("ai_response_cache").upsert(
    {
      cache_key: cacheKey,
      response,
      expires_at: new Date(Date.now() + ttlSeconds * 1000).toISOString(),
    },
    { onConflict: "cache_key" }
  );
}
