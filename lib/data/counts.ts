import { TOOL_COUNT, CATEGORY_COUNT, STACK_COUNT, RELATIONSHIP_COUNT } from "@/lib/constants";

export interface Counts {
  toolCount: number;
  categoryCount: number;
  stackCount: number;
  relationshipCount: number;
}

// JSON is the single source of truth (per CLAUDE.md). The DB may drift between
// deploys since seed isn't part of the deploy pipeline — render counts from
// constants so the landing page can never disagree with badges, README, or sitemap.
export async function getCounts(): Promise<Counts> {
  return {
    toolCount: TOOL_COUNT,
    categoryCount: CATEGORY_COUNT,
    stackCount: STACK_COUNT,
    relationshipCount: RELATIONSHIP_COUNT,
  };
}
