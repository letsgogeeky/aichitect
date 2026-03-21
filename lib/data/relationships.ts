import { supabase } from "@/lib/db";
import type { Relationship } from "@/lib/types";
import relationshipsJson from "@/data/relationships.json";

const fallback = relationshipsJson as Relationship[];

export async function getRelationships(): Promise<Relationship[]> {
  if (!supabase) return fallback;
  const { data, error } = await supabase.from("relationships").select("*");
  if (error || !data?.length) return fallback;
  return data as Relationship[];
}

export async function getRelationshipsByTool(toolId: string): Promise<Relationship[]> {
  if (!supabase) return fallback.filter((r) => r.source === toolId || r.target === toolId);
  const { data, error } = await supabase
    .from("relationships")
    .select("*")
    .or(`source.eq.${toolId},target.eq.${toolId}`);
  if (error || !data) return fallback.filter((r) => r.source === toolId || r.target === toolId);
  return data as Relationship[];
}
