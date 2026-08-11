import { createClient, SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_POSTGRES_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_POSTGRES_SUPABASE_ANON_KEY!;

/**
 * Server-only singleton client for DB queries (no auth cookie awareness).
 * Never import this from a "use client" file — it eagerly instantiates a
 * GoTrue auth client at module load, which would collide with the browser
 * client's own singleton (same storage key) and trigger Supabase's
 * "Multiple GoTrueClient instances" warning. Client components should use
 * createSupabaseBrowserClient() from lib/db.ts instead.
 */
export const supabase: SupabaseClient | null = url && anonKey ? createClient(url, anonKey) : null;
