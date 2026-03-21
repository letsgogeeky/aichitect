import { supabase } from "@/lib/db";
import type { Stack } from "@/lib/types";
import stacksJson from "@/data/stacks.json";

const fallback = stacksJson as Stack[];

export async function getStacks(): Promise<Stack[]> {
  if (!supabase) return fallback;
  const { data, error } = await supabase.from("stacks").select("*");
  if (error || !data?.length) return fallback;
  return data as Stack[];
}

export async function getStackById(id: string): Promise<Stack | null> {
  if (!supabase) return fallback.find((s) => s.id === id) ?? null;
  const { data, error } = await supabase.from("stacks").select("*").eq("id", id).single();
  if (error || !data) return fallback.find((s) => s.id === id) ?? null;
  return data as Stack;
}
