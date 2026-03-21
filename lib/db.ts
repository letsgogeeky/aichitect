import { createClient, SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Supabase client singleton. Null when env vars are not set (local dev fallback).
 * Server components and API routes use this for DB queries.
 * Client components use static JSON fallback directly (see lib/data/*.ts).
 */
export const supabase: SupabaseClient | null = url && key ? createClient(url, key) : null;
