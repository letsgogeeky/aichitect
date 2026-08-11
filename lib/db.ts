import { SupabaseClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_POSTGRES_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_POSTGRES_SUPABASE_ANON_KEY!;

declare global {
  var __supabaseBrowserClient: SupabaseClient | null | undefined;
}

/**
 * Browser-side Supabase client — singleton per URL/key pair, safe to call in
 * client components. Returns null when env vars are absent (build/prerender time).
 * Server Components, Route Handlers, and data loaders should import
 * `supabase` from lib/db.server.ts instead — importing it here would bundle
 * a second, server-oriented GoTrue client into every client component that
 * touches this file, which duplicates the auth client in the browser.
 *
 * Cached on globalThis rather than module scope: routes with a
 * `dynamic(..., { ssr: false })` subtree (Explore's 3D graph, Stacks'
 * React Flow canvas, Builder, Genome) get that subtree split into its own
 * bundler chunk, which gets its own copy of this module — a module-scoped
 * `let` would then produce two "singletons" and trigger Supabase's
 * "Multiple GoTrueClient instances" warning. globalThis is shared across
 * chunks, so this survives the split.
 */
export function createSupabaseBrowserClient() {
  if (!url || !anonKey) return null;
  if (!globalThis.__supabaseBrowserClient) {
    globalThis.__supabaseBrowserClient = createBrowserClient(url, anonKey);
  }
  return globalThis.__supabaseBrowserClient;
}
