import type { Tool, Slot, Relationship, StackArchetype, SlotPriority } from "./types";

// ---------------------------------------------------------------------------
// Output types
// ---------------------------------------------------------------------------

export interface FilledSlotInfo {
  slotId: string;
  slotName: string;
  tool: Tool;
  priority: SlotPriority;
}

export interface MissingSlotInfo {
  slotId: string;
  slotName: string;
  priority: SlotPriority;
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
  /** How many commonly-paired-with edges are relevant (at least one side detected) */
  criticalPairsTotal: number;
  /** Of those, how many have both sides detected */
  criticalPairsCovered: number;
  /** Detected stack archetype — used for archetype-aware slot scoring */
  archetype: StackArchetype;
}

// ---------------------------------------------------------------------------
// Score weights — archetype-aware (must sum to 1 per archetype)
// ---------------------------------------------------------------------------

// Dev-productivity stacks are scored purely on slot coverage because their
// integrations point outward to LLMs/APIs that aren't scanned as tools
// (Cursor integrates with Claude, not with Linear). Pairs scoring would
// always read 0 and unfairly cap every dev stack at 60.
const SLOT_WEIGHT: Record<StackArchetype, number> = {
  "dev-productivity": 1.0,
  "app-infrastructure": 0.6,
  hybrid: 0.6,
};
const PAIRS_WEIGHT: Record<StackArchetype, number> = {
  "dev-productivity": 0.0,
  "app-infrastructure": 0.4,
  hybrid: 0.4,
};

// Slot priority points — archetype-aware.
// For dev-productivity, optional slots carry real weight (1 pt) because
// almost everything beyond the first two slots is optional; without this,
// filling 6 extra tools has zero scoring impact.
const SLOT_PTS: Record<StackArchetype, Record<SlotPriority, number>> = {
  "dev-productivity": { required: 4, recommended: 2, optional: 1, "not-applicable": 0 },
  "app-infrastructure": { required: 2, recommended: 1, optional: 0, "not-applicable": 0 },
  hybrid: { required: 2, recommended: 1, optional: 0, "not-applicable": 0 },
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
// Archetype detection
// ---------------------------------------------------------------------------

/**
 * Infers the stack archetype from the detected tools' use_context values.
 *
 * Rules:
 *  - Tools with use_context "both" are context-agnostic and don't tip the scale.
 *  - If strictly dev-productivity tools outnumber app-infrastructure tools → "dev-productivity"
 *  - If strictly app-infrastructure tools outnumber dev-productivity tools → "app-infrastructure"
 *  - Otherwise (equal counts or only "both" tools) → "hybrid"
 */
export function detectArchetype(detectedIds: string[], tools: Tool[]): StackArchetype {
  const detectedTools = detectedIds
    .map((id) => tools.find((t) => t.id === id))
    .filter((t): t is Tool => !!t);

  let devCount = 0;
  let appCount = 0;

  for (const tool of detectedTools) {
    if (tool.use_context === "dev-productivity") devCount++;
    else if (tool.use_context === "app-infrastructure") appCount++;
    // "both" tools don't tip the scale
  }

  if (devCount > appCount) return "dev-productivity";
  if (appCount > devCount) return "app-infrastructure";
  return "hybrid";
}

// ---------------------------------------------------------------------------
// Main analysis function
// ---------------------------------------------------------------------------

/**
 * Given a list of detected tool IDs, returns a complete GenomeReport.
 *
 * @param detectedIds   — tool IDs confirmed present (from detectTools + manual additions)
 * @param tools         — full tools list
 * @param slots         — full slots list (with archetype-aware priority)
 * @param relationships — full relationships list
 * @param archetype     — detected stack archetype; defaults to "hybrid" (shows all slots)
 */
export function analyzeGenome(
  detectedIds: string[],
  tools: Tool[],
  slots: Slot[],
  relationships: Relationship[],
  archetype: StackArchetype = "hybrid"
): GenomeReport {
  const detectedSet = new Set(detectedIds);

  const detectedTools = detectedIds
    .map((id) => tools.find((t) => t.id === id))
    .filter((t): t is Tool => !!t);

  // ── 1. Slot coverage ──────────────────────────────────────────────────────

  const filledSlots: FilledSlotInfo[] = [];
  const missingSlots: MissingSlotInfo[] = [];

  for (const slot of slots) {
    const slotPriority = slot.priority[archetype];

    // Skip slots that don't apply to this archetype
    if (slotPriority === "not-applicable") continue;

    const matchedId = slot.tools.find((tid) => detectedSet.has(tid));

    if (matchedId) {
      const tool = tools.find((t) => t.id === matchedId)!;
      filledSlots.push({
        slotId: slot.id,
        slotName: slot.name,
        tool,
        priority: slotPriority,
      });
    } else {
      const suggestTool = slot.suggest ? tools.find((t) => t.id === slot.suggest) : undefined;
      missingSlots.push({
        slotId: slot.id,
        slotName: slot.name,
        priority: slotPriority,
        suggestTool,
        suggestReason: slot.suggest_reason,
      });
    }
  }

  // Sort missing: required → recommended → optional
  const PRIORITY_ORDER: Record<SlotPriority, number> = {
    required: 0,
    recommended: 1,
    optional: 2,
    "not-applicable": 3,
  };
  missingSlots.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);

  // Compute slot score (weighted) — only applicable slots count
  let maxPts = 0;
  let earnedPts = 0;

  for (const slot of slots) {
    const slotPriority = slot.priority[archetype];
    if (slotPriority === "not-applicable") continue;
    const pts = SLOT_PTS[archetype][slotPriority];
    maxPts += pts;
    if (filledSlots.some((f) => f.slotId === slot.id)) earnedPts += pts;
  }

  const slotScore = maxPts > 0 ? earnedPts / maxPts : 0;

  // ── 2. Critical pairs (integrates-with coverage) ──────────────────────────

  // Use commonly-paired-with edges for pair coverage scoring — these capture
  // tools that real teams use together, so having both sides is meaningful.
  // integrates-with is a technical API edge; one side absent just means an
  // unused capability, not a gap. Exclude context-qualified edges that don't
  // apply to this archetype.
  const integrateEdges = relationships.filter(
    (r) => r.type === "commonly-paired-with" && (r.context == null || r.context === archetype)
  );

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

  const rawScore = slotScore * SLOT_WEIGHT[archetype] + pairsScore * PAIRS_WEIGHT[archetype];
  const fitnessScore = Math.round(rawScore * 100);

  return {
    detectedTools,
    filledSlots,
    missingSlots,
    fitnessScore,
    tier: tierFromScore(fitnessScore),
    criticalPairsTotal: uniquePairs.length,
    criticalPairsCovered: coveredPairs.length,
    archetype,
  };
}
