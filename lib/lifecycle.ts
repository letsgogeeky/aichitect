/**
 * Lifecycle phase helpers — display labels, track classification, and the
 * derivation rules used by /stacks, /builder, and Genome scoring.
 *
 * Source of truth for the enums is lib/types.ts. This file is the consumer
 * layer that gives the UI display strings and lookup helpers — kept separate
 * so the type module stays a pure type module.
 */

import {
  LIFECYCLE_PHASES,
  PHASES_BY_TRACK,
  type LifecyclePhase,
  type LifecycleTrack,
  type Slot,
  type Stack,
  type Tool,
} from "@/lib/types";

// ── Display labels (short — these render in compact pills) ────────────────────

export const LIFECYCLE_PHASE_LABEL: Record<LifecyclePhase, string> = {
  requirements: "Requirements",
  specs: "Specs",
  design: "Design",
  coding: "Coding",
  "code-review": "Review",
  providers: "Providers",
  orchestration: "Orchestration",
  "retrieval-memory": "Retrieval",
  "tools-mcp": "Tools / MCP",
  guardrails: "Guardrails",
  eval: "Eval",
  observability: "Observability",
};

// ── Phase → which track(s) it belongs to ──────────────────────────────────────
//
// "shared" means it appears in both PHASES_BY_TRACK.development and .runtime
// (eval and observability deliberately span both — same tools serve both).

export type PhaseTrack = "development" | "runtime" | "shared";

export const LIFECYCLE_PHASE_TRACK: Record<LifecyclePhase, PhaseTrack> = (() => {
  const map = {} as Record<LifecyclePhase, PhaseTrack>;
  const devSet = new Set(PHASES_BY_TRACK.development);
  const runtimeSet = new Set(PHASES_BY_TRACK.runtime);
  for (const phase of LIFECYCLE_PHASES) {
    const inDev = devSet.has(phase);
    const inRuntime = runtimeSet.has(phase);
    if (inDev && inRuntime) map[phase] = "shared";
    else if (inDev) map[phase] = "development";
    else if (inRuntime) map[phase] = "runtime";
    else throw new Error(`Phase "${phase}" is in PHASES_BY_TRACK for neither track`);
  }
  return map;
})();

// Track colors mirror existing category palette tones so the UI feels native.
export const PHASE_TRACK_COLOR: Record<PhaseTrack, string> = {
  development: "#7c6bff", // var(--accent) — violet
  runtime: "#4ecdc4", // teal (matches llm-infra category)
  shared: "#fdcb6e", // amber (eval + obs span both)
};

// ── Stack coverage ────────────────────────────────────────────────────────────

/**
 * Returns the set of phases a stack actually covers, derived from its tools'
 * `lifecycle_phases`. Single source of truth for the UI — stack.phases stored
 * in JSON should always equal this set, but if curation drifts the UI follows
 * the tools (the catalog is canonical).
 */
export function computeStackPhaseCoverage(
  stack: Pick<Stack, "tools">,
  toolsById: Map<string, Pick<Tool, "lifecycle_phases">>
): Set<LifecyclePhase> {
  const covered = new Set<LifecyclePhase>();
  for (const id of stack.tools) {
    const tool = toolsById.get(id);
    if (!tool) continue;
    for (const phase of tool.lifecycle_phases) covered.add(phase);
  }
  return covered;
}

/**
 * Builder-side coverage: takes the list of currently-selected tool IDs and
 * returns the union of their lifecycle phases. Pure, no React, easy to test.
 *
 * Different signature from computeStackPhaseCoverage (which takes a Stack) so
 * callers don't have to manufacture a fake Stack object. Both ultimately
 * compute the same union semantics.
 */
export function computePhaseCoverage(
  toolIds: Iterable<string | null | undefined>,
  toolsById: Map<string, Pick<Tool, "lifecycle_phases">>
): Set<LifecyclePhase> {
  const covered = new Set<LifecyclePhase>();
  for (const id of toolIds) {
    if (!id) continue;
    const tool = toolsById.get(id);
    if (!tool) continue;
    for (const phase of tool.lifecycle_phases) covered.add(phase);
  }
  return covered;
}

/**
 * Returns the lifecycle phase associated with a slot — the union of phases
 * across all tools currently assigned to that slot. Most slots collapse to a
 * single phase since slots are mostly homogeneous (vector-db tools all map to
 * retrieval-memory, code-editor tools all map to coding, etc).
 *
 * When a slot is empty or its tools don't carry phases, returns an empty array.
 */
export function getSlotPhases(
  slot: Pick<Slot, "tools">,
  toolsById: Map<string, Pick<Tool, "lifecycle_phases">>
): LifecyclePhase[] {
  const set = new Set<LifecyclePhase>();
  for (const id of slot.tools) {
    const tool = toolsById.get(id);
    if (!tool) continue;
    for (const phase of tool.lifecycle_phases) set.add(phase);
  }
  // Return in canonical order so callers can groupBy deterministically.
  return LIFECYCLE_PHASES.filter((p) => set.has(p));
}

/**
 * Group a list of slots by their primary lifecycle phase, in canonical phase
 * order. A slot with multiple phases is bucketed under its first phase in
 * canonical order — the deterministic tie-break that keeps the Builder slot
 * list stable across renders.
 */
export function groupSlotsByPhase<S extends Pick<Slot, "id" | "tools">>(
  slots: S[],
  toolsById: Map<string, Pick<Tool, "lifecycle_phases">>
): { phase: LifecyclePhase; slots: S[] }[] {
  const buckets = new Map<LifecyclePhase, S[]>();
  const unmatched: S[] = [];
  for (const slot of slots) {
    const phases = getSlotPhases(slot, toolsById);
    if (phases.length === 0) {
      unmatched.push(slot);
      continue;
    }
    const primary = phases[0];
    if (!buckets.has(primary)) buckets.set(primary, []);
    buckets.get(primary)!.push(slot);
  }
  const grouped = LIFECYCLE_PHASES.filter((p) => buckets.has(p)).map((p) => ({
    phase: p,
    slots: buckets.get(p)!,
  }));
  // Unmatched goes at the end under an "other" pseudo-phase. Callers can
  // choose to drop it or render under a fallback label.
  return grouped;
}

// ── Track classification (mirrors PR 3 script logic) ─────────────────────────

const DEV_ONLY = new Set(
  PHASES_BY_TRACK.development.filter((p) => !PHASES_BY_TRACK.runtime.includes(p))
);
const RUNTIME_ONLY = new Set(
  PHASES_BY_TRACK.runtime.filter((p) => !PHASES_BY_TRACK.development.includes(p))
);

/**
 * Classify a phase set into a lifecycle track. The same rule used in PR 3 to
 * label stacks, exported here so the UI and Genome scoring stay consistent.
 *
 *   development: ≥2 dev-only phases AND ≤1 runtime-only phase
 *   runtime:     ≥3 runtime-only phases AND ≤1 dev-only phase
 *   specialized: anything else
 */
export function classifyTrack(phases: Iterable<LifecyclePhase>): LifecycleTrack {
  let devCount = 0;
  let runtimeCount = 0;
  for (const p of phases) {
    if (DEV_ONLY.has(p)) devCount++;
    else if (RUNTIME_ONLY.has(p)) runtimeCount++;
  }
  if (devCount >= 2 && runtimeCount <= 1) return "development";
  if (runtimeCount >= 3 && devCount <= 1) return "runtime";
  return "specialized";
}

/**
 * Given a phase coverage set, returns the phases missing from each end-to-end
 * track. Used by the Builder's StackHealthPanel to surface "you're missing
 * eval / observability / guardrails" without the user having to read a chart.
 */
export function getMissingPhasesByTrack(covered: Set<LifecyclePhase>): {
  development: LifecyclePhase[];
  runtime: LifecyclePhase[];
} {
  return {
    development: PHASES_BY_TRACK.development.filter((p) => !covered.has(p)),
    runtime: PHASES_BY_TRACK.runtime.filter((p) => !covered.has(p)),
  };
}
