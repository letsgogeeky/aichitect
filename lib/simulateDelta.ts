/**
 * Shadow Stack delta computation (AIC-131).
 *
 * Given two SimulationResults (current + shadow), produce a pure delta record
 * the UI can render without doing arithmetic of its own.
 */

import type { BreakingPoint, SimulationResult, SimulationSnapshot } from "@/lib/simulate";

export interface DeltaSnapshot {
  users: number;
  currentCost: number;
  shadowCost: number;
  /** shadow - current; negative = savings */
  costDelta: number;
  currentLatency: number;
  shadowLatency: number;
}

export interface LatencyDeltaRow {
  layer: string;
  current: number;
  shadow: number;
  /** shadow - current; negative = shadow is faster */
  delta: number;
}

export type Verdict = "switch_now" | "switch_above_X" | "stick" | "latency_only";

export interface SimulationDelta {
  snapshots: DeltaSnapshot[];
  latencyByLayer: LatencyDeltaRow[];
  totalLatency: { current: number; shadow: number; delta: number };
  /** First scale step at which shadow becomes cheaper. null if never. */
  crossoverUsers: number | null;
  /** Shadow vs current annualised cost at the largest scale step. Positive = savings. */
  maxScaleAnnualSavings: number;
  currentFirstBreak: BreakingPoint | null;
  shadowFirstBreak: BreakingPoint | null;
  verdict: Verdict;
  verdictMessage: string;
}

function totalCost(snap: SimulationSnapshot): number {
  return Object.values(snap.costBreakdown).reduce((a, b) => a + b, 0);
}

function firstBreak(r: SimulationResult): BreakingPoint | null {
  if (r.breakingPoints.length === 0) return null;
  return [...r.breakingPoints].sort((a, b) => a.users - b.users)[0];
}

function formatUsers(n: number): string {
  if (n >= 1_000_000) return `${n / 1_000_000}M`;
  if (n >= 1_000) return `${n / 1_000}k`;
  return String(n);
}

function formatUsd(n: number): string {
  const abs = Math.abs(Math.round(n));
  if (abs >= 1_000) return `$${(abs / 1000).toFixed(1)}k`;
  return `$${abs.toLocaleString()}`;
}

function formatMs(ms: number): string {
  const abs = Math.abs(Math.round(ms));
  if (abs >= 1000) return `${(abs / 1000).toFixed(2)}s`;
  return `${abs}ms`;
}

export function computeDelta(current: SimulationResult, shadow: SimulationResult): SimulationDelta {
  // Snapshots align by index — both use the same SCALE_STEPS.
  const snapshots: DeltaSnapshot[] = current.snapshots.map((c, i) => {
    const s = shadow.snapshots[i];
    const currentCost = totalCost(c);
    const shadowCost = totalCost(s);
    return {
      users: c.users,
      currentCost,
      shadowCost,
      costDelta: shadowCost - currentCost,
      currentLatency: c.avgLatencyMs,
      shadowLatency: s.avgLatencyMs,
    };
  });

  // Latency — by layer. Layers come from snapshot[0]'s breakdown (constant across snapshots).
  const currentLatency = current.snapshots[0]?.latencyBreakdown ?? {};
  const shadowLatency = shadow.snapshots[0]?.latencyBreakdown ?? {};
  const layers = Array.from(
    new Set([...Object.keys(currentLatency), ...Object.keys(shadowLatency)])
  );
  const latencyByLayer: LatencyDeltaRow[] = layers.map((layer) => {
    const cur = currentLatency[layer] ?? 0;
    const sh = shadowLatency[layer] ?? 0;
    return { layer, current: cur, shadow: sh, delta: sh - cur };
  });

  const totalCurrent = Object.values(currentLatency).reduce((a, b) => a + b, 0);
  const totalShadow = Object.values(shadowLatency).reduce((a, b) => a + b, 0);
  const totalLatency = {
    current: totalCurrent,
    shadow: totalShadow,
    delta: totalShadow - totalCurrent,
  };

  const crossoverIdx = snapshots.findIndex((s) => s.costDelta < 0);
  const crossoverUsers = crossoverIdx >= 0 ? snapshots[crossoverIdx].users : null;

  const last = snapshots[snapshots.length - 1];
  // Positive = shadow saves money at max scale; negative = shadow costs more.
  const maxScaleAnnualSavings = last ? -last.costDelta * 12 : 0;

  const currentFirstBreak = firstBreak(current);
  const shadowFirstBreak = firstBreak(shadow);

  const verdict = decideVerdict(snapshots, totalLatency.delta);
  const verdictMessage = describeVerdict(
    verdict,
    crossoverUsers,
    maxScaleAnnualSavings,
    totalLatency.delta
  );

  return {
    snapshots,
    latencyByLayer,
    totalLatency,
    crossoverUsers,
    maxScaleAnnualSavings,
    currentFirstBreak,
    shadowFirstBreak,
    verdict,
    verdictMessage,
  };
}

function decideVerdict(snapshots: DeltaSnapshot[], latencyDelta: number): Verdict {
  if (snapshots.length === 0) return "stick";
  const first = snapshots[0];
  const last = snapshots[snapshots.length - 1];
  const faster = latencyDelta < 0;

  // Cheaper at the largest scale step.
  if (last.costDelta < 0) {
    return first.costDelta <= 0 ? "switch_now" : "switch_above_X";
  }

  // More expensive at the largest scale step.
  // Worth switching for latency only if the saving is meaningful (≥200ms).
  if (faster && Math.abs(latencyDelta) >= 200) return "latency_only";
  return "stick";
}

function describeVerdict(
  v: Verdict,
  crossover: number | null,
  annualSavings: number,
  latencyDelta: number
): string {
  const latencyPhrase =
    latencyDelta < 0
      ? `and gains ${formatMs(latencyDelta)} on p50 latency`
      : latencyDelta > 0
        ? `but adds ${formatMs(latencyDelta)} to p50 latency`
        : "and matches current latency";

  switch (v) {
    case "switch_now":
      return `Switch to the shadow stack — saves ${formatUsd(annualSavings)}/yr at 1M users ${latencyPhrase}.`;
    case "switch_above_X":
      return `Switch above ${crossover ? formatUsers(crossover) : "X"} users — saves ${formatUsd(annualSavings)}/yr at 1M users ${latencyPhrase}.`;
    case "latency_only":
      return `Only switch if latency is critical — shadow costs more at every scale ${latencyPhrase}.`;
    case "stick":
      return `Stick with the current stack — shadow is not cheaper at scale ${latencyPhrase}.`;
  }
}
