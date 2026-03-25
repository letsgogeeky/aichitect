import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_POSTGRES_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_POSTGRES_SUPABASE_ANON_KEY!;

/**
 * Legacy singleton client for server-side DB queries (no auth cookie awareness).
 * Use createSupabaseServerClient() from lib/db.server.ts in Server Components
 * and Route Handlers where you need session-aware auth context.
 */
export const supabase: SupabaseClient | null = url && anonKey ? createClient(url, anonKey) : null;

/**
 * Browser-side Supabase client — singleton per URL/key pair, safe to call in
 * client components. Returns null when env vars are absent (build/prerender time).
 */
export function createSupabaseBrowserClient() {
  if (!url || !anonKey) return null;
  return createBrowserClient(url, anonKey);
}
