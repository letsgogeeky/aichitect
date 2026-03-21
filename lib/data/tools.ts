import { supabase } from "@/lib/db";
import type { Tool } from "@/lib/types";
import toolsJson from "@/data/tools.json";

const fallback = toolsJson as Tool[];

export async function getTools(): Promise<Tool[]> {
  if (!supabase) return fallback;
  const { data, error } = await supabase.from("tools").select("*").order("name");
  if (error || !data?.length) return fallback;
  return data as unknown as Tool[];
}

export async function getToolById(id: string): Promise<Tool | null> {
  if (!supabase) return fallback.find((t) => t.id === id) ?? null;
  const { data, error } = await supabase.from("tools").select("*").eq("id", id).single();
  if (error || !data) return fallback.find((t) => t.id === id) ?? null;
  return data as unknown as Tool;
}
