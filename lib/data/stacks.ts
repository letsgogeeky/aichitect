import { unstable_cache } from "next/cache";
import { supabase } from "@/lib/db";
import type { Stack } from "@/lib/types";
import stacksJson from "@/data/stacks.json";
import { hydrateStack, hydrateStacks } from "./hydrateLifecycle";

const fallback = stacksJson as Stack[];

const _getStacks = unstable_cache(
  async (): Promise<Stack[]> => {
    if (!supabase) return fallback;
    const { data, error } = await supabase.from("stacks").select("*");
    if (error || !data?.length) return fallback;
    // PR 8: hydrate JSON-only lifecycle metadata (track, phases) onto DB rows
    // so UI consumers (PhaseCoverageBar, StackSidebar track filter, etc.)
    // never see undefined fields.
    return hydrateStacks(data as Stack[], fallback);
  },
  ["stacks-all"],
  { revalidate: 3600, tags: ["stacks"] }
);

export async function getStacks(): Promise<Stack[]> {
  return _getStacks();
}

export async function getStackById(id: string): Promise<Stack | null> {
  if (!supabase) return fallback.find((s) => s.id === id) ?? null;
  const { data, error } = await supabase.from("stacks").select("*").eq("id", id).single();
  if (error || !data) return fallback.find((s) => s.id === id) ?? null;
  // PR 8: same hydration as getStacks — single-stack fetch path.
  return hydrateStack(data as Stack, new Map(fallback.map((s) => [s.id, s])));
}
