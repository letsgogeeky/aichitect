import type { TrackScore } from "@/lib/genomeAnalysis";
import { LIFECYCLE_PHASE_LABEL } from "@/lib/lifecycle";

interface Props {
  title: string;
  subtitle: string;
  trackColor: string;
  score: TrackScore;
}

/**
 * Side-by-side per-track lifecycle panel rendered on the Genome results page.
 *
 * Shows: covered/total ratio + percent, followed by a phase list where covered
 * phases light up in the track color and missing phases stay dimmed with a
 * dashed outline. The user can immediately see which phases are absent without
 * cross-referencing the slot grid.
 */
export function TrackScorePanel({ title, subtitle, trackColor, score }: Props) {
  const phaseSet = new Set(score.coveredPhases);
  const allPhases = [...score.coveredPhases, ...score.missingPhases];
  return (
    <div
      style={{
        flex: 1,
        background: "var(--surface)",
        border: "1px solid #1e1e2e",
        borderRadius: 12,
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        minWidth: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: trackColor,
            }}
          >
            {title}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{subtitle}</div>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
          <span style={{ fontSize: 22, fontWeight: 700, color: "#f0f0f8", lineHeight: 1 }}>
            {score.covered}
          </span>
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>/ {score.total}</span>
          <span
            style={{
              marginLeft: 8,
              fontSize: 11,
              fontWeight: 600,
              color: trackColor,
            }}
          >
            {score.score}%
          </span>
        </div>
      </div>

      <div
        aria-hidden
        style={{
          height: 4,
          background: "#1e1e2e",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${score.score}%`,
            height: "100%",
            background: trackColor,
            transition: "width 0.4s ease",
          }}
        />
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
        {allPhases.map((phase) => {
          const isCovered = phaseSet.has(phase);
          return (
            <span
              key={phase}
              title={LIFECYCLE_PHASE_LABEL[phase]}
              style={
                isCovered
                  ? {
                      fontSize: 11,
                      fontWeight: 500,
                      padding: "2px 7px",
                      borderRadius: 4,
                      background: trackColor + "22",
                      color: trackColor,
                      border: `1px solid ${trackColor}55`,
                    }
                  : {
                      fontSize: 11,
                      fontWeight: 500,
                      padding: "2px 7px",
                      borderRadius: 4,
                      background: "transparent",
                      color: "var(--text-muted)",
                      border: "1px dashed #2a2a3a",
                      opacity: 0.7,
                    }
              }
            >
              {LIFECYCLE_PHASE_LABEL[phase]}
            </span>
          );
        })}
      </div>

      {score.missingPhases.length > 0 ? (
        <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0, lineHeight: 1.4 }}>
          Missing: {score.missingPhases.map((p) => LIFECYCLE_PHASE_LABEL[p]).join(", ")}.
        </p>
      ) : (
        <p style={{ fontSize: 11, color: trackColor, margin: 0, lineHeight: 1.4 }}>
          ● Full {title.toLowerCase()} coverage.
        </p>
      )}
    </div>
  );
}
