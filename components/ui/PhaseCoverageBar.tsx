import { LIFECYCLE_PHASES, type LifecyclePhase } from "@/lib/types";
import { LIFECYCLE_PHASE_LABEL, LIFECYCLE_PHASE_TRACK, PHASE_TRACK_COLOR } from "@/lib/lifecycle";

interface Props {
  /** Phases this stack/slot covers. Anything not in this set renders dimmed. */
  covered: Set<LifecyclePhase>;
  /** Compact mode for sidebar contexts (e.g. inside StackDetailHeader). */
  compact?: boolean;
  /** Show track-divider lines between development | runtime | shared groups. */
  showDividers?: boolean;
}

/**
 * 12-cell horizontal bar that lights up the lifecycle phases a stack covers.
 * Color-coded by track (dev / runtime / shared) so the user can spot the shape
 * of the stack at a glance:
 *
 *   ●●●●●  ─ ─ ─ ─ ─ ─ ─   ←  development-track stack: all 5 dev phases lit
 *   ─ ─ ─ ─ ─  ●●●●●  ─ ─  ←  runtime-track stack: all 5 runtime phases lit
 *   ●●●●●  ●●●●●  ●●       ←  E2E flagship: all 12 lit
 */
export function PhaseCoverageBar({ covered, compact = false, showDividers = true }: Props) {
  const size = compact ? "text-[9px] px-1 py-[2px]" : "text-[10px] px-1.5 py-0.5";

  // Group phases for the divider rendering — preserves canonical order.
  const devPhases = LIFECYCLE_PHASES.filter((p) => LIFECYCLE_PHASE_TRACK[p] === "development");
  const rtPhases = LIFECYCLE_PHASES.filter((p) => LIFECYCLE_PHASE_TRACK[p] === "runtime");
  const sharedPhases = LIFECYCLE_PHASES.filter((p) => LIFECYCLE_PHASE_TRACK[p] === "shared");

  function cell(phase: LifecyclePhase) {
    const isCovered = covered.has(phase);
    const trackColor = PHASE_TRACK_COLOR[LIFECYCLE_PHASE_TRACK[phase]];
    return (
      <span
        key={phase}
        title={LIFECYCLE_PHASE_LABEL[phase]}
        className={`inline-flex items-center rounded ${size} whitespace-nowrap font-medium transition-colors`}
        style={
          isCovered
            ? {
                background: trackColor + "22",
                color: trackColor,
                border: `1px solid ${trackColor}55`,
              }
            : {
                background: "transparent",
                color: "var(--text-muted)",
                border: "1px dashed var(--border)",
                opacity: 0.5,
              }
        }
      >
        {LIFECYCLE_PHASE_LABEL[phase]}
      </span>
    );
  }

  const divider = showDividers ? (
    <span aria-hidden className="self-center px-1 text-[var(--text-muted)] opacity-40">
      ·
    </span>
  ) : null;

  return (
    <div className="flex flex-wrap items-center gap-1">
      {devPhases.map(cell)}
      {divider}
      {rtPhases.map(cell)}
      {divider}
      {sharedPhases.map(cell)}
    </div>
  );
}
