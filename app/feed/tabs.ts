import type { ToolEventType } from "@/lib/types";

export const FILTER_TABS: { id: string; label: string; types: ToolEventType[] | null }[] = [
  { id: "all", label: "All", types: null },
  { id: "health", label: "Health", types: ["health_score_change"] },
  { id: "stars", label: "Stars", types: ["star_milestone"] },
  { id: "stale", label: "Stale", types: ["stale_transition"] },
  { id: "archived", label: "Archived", types: ["archived_detected"] },
  { id: "pricing", label: "Pricing", types: ["pricing_change"] },
];
