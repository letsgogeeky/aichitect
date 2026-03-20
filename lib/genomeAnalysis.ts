import type { Tool, Slot, Relationship } from "./types";

// ---------------------------------------------------------------------------
// Output types
// ---------------------------------------------------------------------------

export interface FilledSlotInfo {
  slotId: string;
  slotName: string;
  tool: Tool;
  priority: Slot["priority"];
}

export interface MissingSlotInfo {
  slotId: string;
  slotName: string;
  priority: Slot["priority"];
  suggestTool?: Tool;
  suggestReason?: string;
}

export type GenomeTier = "Minimal" | "Emerging" | "Competent" | "Production-Grade" | "Cutting-Edge";

export interface GenomeReport {
  /** All tools confirmed present in the project */
  detectedTools: Tool[];
  /** Slots that are covered by a detected tool */
  filledSlots: FilledSlotInfo[];
  /** Slots with no detected tool — ordered: required → recommended → optional */
  missingSlots: MissingSlotInfo[];
  /** Composite 0–100 score */
  fitnessScore: number;
  /** Label derived from score */
  tier: GenomeTier;
  /** How many integrates-with pairs are relevant (at least one side detected) */
  criticalPairsTotal: number;
  /** Of those, how many have both sides detected */
  criticalPairsCovered: number;
}

// ---------------------------------------------------------------------------
// Score weights (must sum to 1)
// ---------------------------------------------------------------------------
const SLOT_WEIGHT = 0.6;
const PAIRS_WEIGHT = 0.4;

// Slot priority weights — determines how much each slot type is worth
const SLOT_PTS: Record<Slot["priority"], number> = {
  required: 2,
  recommended: 1,
  optional: 0,
};

// ---------------------------------------------------------------------------
// Tier bands
// ---------------------------------------------------------------------------
const TIER_BANDS: { min: number; tier: GenomeTier }[] = [
  { min: 85, tier: "Cutting-Edge" },
  { min: 70, tier: "Production-Grade" },
  { min: 50, tier: "Competent" },
  { min: 25, tier: "Emerging" },
  { min: 0, tier: "Minimal" },
];

export function tierFromScore(score: number): GenomeTier {
  return TIER_BANDS.find((b) => score >= b.min)!.tier;
}

export const TIER_COLORS: Record<GenomeTier, string> = {
  Minimal: "#555577",
  Emerging: "#fd9644",
  Competent: "#00d4aa",
  "Production-Grade": "#7c6bff",
  "Cutting-Edge": "#26de81",
};

// ---------------------------------------------------------------------------
// Main analysis function
// ---------------------------------------------------------------------------

/**
 * Given a list of detected tool IDs, returns a complete GenomeReport.
 *
 * @param detectedIds — tool IDs confirmed present (from detectTools + manual additions)
 * @param tools       — full tools list
 * @param slots       — full slots list (with priority)
 * @param relationships — full relationships list
 */
export function analyzeGenome(
  detectedIds: string[],
  tools: Tool[],
  slots: Slot[],
  relationships: Relationship[]
): GenomeReport {
  const detectedSet = new Set(detectedIds);

  const detectedTools = detectedIds
    .map((id) => tools.find((t) => t.id === id))
    .filter((t): t is Tool => !!t);

  // ── 1. Slot coverage ──────────────────────────────────────────────────────

  const filledSlots: FilledSlotInfo[] = [];
  const missingSlots: MissingSlotInfo[] = [];

  for (const slot of slots) {
    const matchedId = slot.tools.find((tid) => detectedSet.has(tid));

    if (matchedId) {
      const tool = tools.find((t) => t.id === matchedId)!;
      filledSlots.push({
        slotId: slot.id,
        slotName: slot.name,
        tool,
        priority: slot.priority,
      });
    } else {
      const suggestTool = slot.suggest ? tools.find((t) => t.id === slot.suggest) : undefined;
      missingSlots.push({
        slotId: slot.id,
        slotName: slot.name,
        priority: slot.priority,
        suggestTool,
        suggestReason: slot.suggest_reason,
      });
    }
  }

  // Sort missing: required → recommended → optional
  const PRIORITY_ORDER: Record<Slot["priority"], number> = {
    required: 0,
    recommended: 1,
    optional: 2,
  };
  missingSlots.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);

  // Compute slot score (weighted)
  let maxPts = 0;
  let earnedPts = 0;

  for (const slot of slots) {
    const pts = SLOT_PTS[slot.priority];
    maxPts += pts;
    if (filledSlots.some((f) => f.slotId === slot.id)) earnedPts += pts;
  }

  const slotScore = maxPts > 0 ? earnedPts / maxPts : 0;

  // ── 2. Critical pairs (integrates-with coverage) ──────────────────────────

  const integrateEdges = relationships.filter((r) => r.type === "integrates-with");

  // Only edges where at least one side is in the detected set
  const relevantEdges = integrateEdges.filter(
    (r) => detectedSet.has(r.source) || detectedSet.has(r.target)
  );

  // Deduplicate by unordered pair
  const seenPairs = new Set<string>();
  const uniquePairs: Relationship[] = [];
  for (const edge of relevantEdges) {
    const key = [edge.source, edge.target].sort().join("|");
    if (!seenPairs.has(key)) {
      seenPairs.add(key);
      uniquePairs.push(edge);
    }
  }

  const coveredPairs = uniquePairs.filter(
    (r) => detectedSet.has(r.source) && detectedSet.has(r.target)
  );

  const pairsScore = uniquePairs.length > 0 ? coveredPairs.length / uniquePairs.length : 0;

  // ── 3. Composite fitness score ─────────────────────────────────────────────

  const rawScore = slotScore * SLOT_WEIGHT + pairsScore * PAIRS_WEIGHT;
  const fitnessScore = Math.round(rawScore * 100);

  return {
    detectedTools,
    filledSlots,
    missingSlots,
    fitnessScore,
    tier: tierFromScore(fitnessScore),
    criticalPairsTotal: uniquePairs.length,
    criticalPairsCovered: coveredPairs.length,
  };
}
