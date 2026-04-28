import { unstable_cache } from "next/cache";
import { supabase } from "@/lib/db";
import type { Relationship } from "@/lib/types";
import relationshipsJson from "@/data/relationships.json";

const fallback = relationshipsJson as Relationship[];

const _getRelationships = unstable_cache(
  async (): Promise<Relationship[]> => {
    if (!supabase) return fallback;
    const { data, error } = await supabase.from("relationships").select("*");
    if (error || !data?.length) return fallback;
    return data as Relationship[];
  },
  ["relationships-all"],
  { revalidate: 3600, tags: ["relationships"] }
);

export async function getRelationships(): Promise<Relationship[]> {
  return _getRelationships();
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
