import { supabase } from "@/lib/db";
import { TOOL_COUNT, CATEGORY_COUNT, STACK_COUNT, RELATIONSHIP_COUNT } from "@/lib/constants";

export interface Counts {
  toolCount: number;
  categoryCount: number;
  stackCount: number;
  relationshipCount: number;
}

const fallback: Counts = {
  toolCount: TOOL_COUNT,
  categoryCount: CATEGORY_COUNT,
  stackCount: STACK_COUNT,
  relationshipCount: RELATIONSHIP_COUNT,
};

export async function getCounts(): Promise<Counts> {
  if (!supabase) return fallback;

  const [tools, stacks, relationships] = await Promise.all([
    supabase.from("tools").select("category", { count: "exact", head: true }),
    supabase.from("stacks").select("*", { count: "exact", head: true }),
    supabase.from("relationships").select("*", { count: "exact", head: true }),
  ]);

  if (tools.error || stacks.error || relationships.error) return fallback;

  // Category count requires a distinct query — fetch just the category column
  const { data: categoryRows } = await supabase.from("tools").select("category");
  const categoryCount = categoryRows
    ? new Set(categoryRows.map((r) => r.category)).size
    : fallback.categoryCount;

  return {
    toolCount: tools.count ?? fallback.toolCount,
    categoryCount,
    stackCount: stacks.count ?? fallback.stackCount,
    relationshipCount: relationships.count ?? fallback.relationshipCount,
  };
}
