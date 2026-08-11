import type { Tool, Slot, StackArchetype, SlotPriority, LifecyclePhase } from "./types";
import { PHASES_BY_TRACK } from "./types";

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

/**
 * Per-track lifecycle scoring (PR 6).
 *
 * The dev and runtime tracks each have 7 canonical phases (5 unique + eval
 * + observability shared). `coveredPhases` is the subset the user's detected
 * tools touch via their `lifecycle_phases`. `score` is rounded percent.
 */
export interface TrackScore {
  covered: number;
  total: number;
  score: number;
  coveredPhases: LifecyclePhase[];
  missingPhases: LifecyclePhase[];
}

export interface GenomeReport {
  /** All tools confirmed present in the project */
  detectedTools: Tool[];
  /** Slots that are covered by a detected tool */
  filledSlots: FilledSlotInfo[];
  /** Slots with no detected tool — ordered: required → recommended → optional */
  missingSlots: MissingSlotInfo[];
  /** Composite 0–100 score (slot-coverage based) */
  fitnessScore: number;
  /** Label derived from score */
  tier: GenomeTier;
  /** Detected stack archetype — used for archetype-aware slot scoring */
  archetype: StackArchetype;
  /** Per-track lifecycle coverage — "how complete is each E2E story?" */
  trackScores: {
    development: TrackScore;
    runtime: TrackScore;
  };
}

// ---------------------------------------------------------------------------
// Score weights — archetype-aware (must sum to 1 per archetype)
// ---------------------------------------------------------------------------

// Score is based purely on slot coverage across all archetypes.
// Pairs scoring was removed — "commonly-paired-with" data is too sparse and
// penalises deliberate non-standard stacks.

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
  Minimal: "var(--text-muted)",
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
 * @param detectedIds — tool IDs confirmed present (from detectTools + manual additions)
 * @param tools       — full tools list
 * @param slots       — full slots list (with archetype-aware priority)
 * @param archetype   — detected stack archetype; defaults to "hybrid" (shows all slots)
 */
export function analyzeGenome(
  detectedIds: string[],
  tools: Tool[],
  slots: Slot[],
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

  // ── 2. Composite fitness score ─────────────────────────────────────────────

  const fitnessScore = Math.round(slotScore * 100);

  // ── 3. Per-track lifecycle scoring (PR 6) ──────────────────────────────────

  const trackScores = computeTrackScores(detectedTools);

  return {
    detectedTools,
    filledSlots,
    missingSlots,
    fitnessScore,
    tier: tierFromScore(fitnessScore),
    archetype,
    trackScores,
  };
}

/**
 * Bucket detected tools' `lifecycle_phases` into the two end-to-end tracks
 * and return per-track coverage. eval and observability count for BOTH tracks
 * since the same tool serves both contexts.
 *
 * Exported for tests and standalone use (e.g. Genome's missing-phase panel
 * computes this directly without going through analyzeGenome).
 */
export function computeTrackScores(detectedTools: Pick<Tool, "lifecycle_phases">[]): {
  development: TrackScore;
  runtime: TrackScore;
} {
  const seenPhases = new Set<LifecyclePhase>();
  for (const tool of detectedTools) {
    for (const phase of tool.lifecycle_phases) seenPhases.add(phase);
  }

  function trackScore(trackPhases: readonly LifecyclePhase[]): TrackScore {
    const covered = trackPhases.filter((p) => seenPhases.has(p));
    const missing = trackPhases.filter((p) => !seenPhases.has(p));
    const total = trackPhases.length;
    const score = total > 0 ? Math.round((covered.length / total) * 100) : 0;
    return {
      covered: covered.length,
      total,
      score,
      coveredPhases: covered,
      missingPhases: missing,
    };
  }

  return {
    development: trackScore(PHASES_BY_TRACK.development),
    runtime: trackScore(PHASES_BY_TRACK.runtime),
  };
}
