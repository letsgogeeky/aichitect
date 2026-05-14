"use client";

import type { KillCondition, BreakingPoint } from "@/lib/simulate";

interface Props {
  killConditions: KillCondition[];
  breakingPoints: BreakingPoint[];
}

function triggerForBreakingPoint(bp: BreakingPoint): string {
  const scale = formatUsers(bp.users);
  switch (bp.type) {
    case "latency":
      return `Monthly users exceed ${scale} (p50 latency above 2s).`;
    case "cost":
      return bp.message.replace(/at .+$/, "").trim() + ".";
    case "architecture":
      return `LLM cost takes more than 80% of the bill (around ${scale}).`;
    case "rate_limit":
      return `Peak load exceeds the LLM provider's standard tier (around ${scale}).`;
  }
}

export default function KillConditionsPanel({ killConditions, breakingPoints }: Props) {
  const switchTriggers = breakingPoints.map(triggerForBreakingPoint);
  const structuralRisks = killConditions;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {switchTriggers.length > 0 && (
        <div>
          <h3 style={subheaderStyle}>Switch away from this stack when</h3>
          <ul style={listStyle}>
            {switchTriggers.map((t, i) => (
              <li key={i} style={liStyle}>
                <span style={{ color: "var(--warning)" }}>•</span> {t}
              </li>
            ))}
          </ul>
        </div>
      )}

      {structuralRisks.length > 0 && (
        <div>
          <h3 style={subheaderStyle}>Structural risks</h3>
          <ul style={listStyle}>
            {structuralRisks.map((kc, i) => (
              <li key={i} style={liStyle}>
                <span style={{ color: "var(--danger)" }}>•</span>
                <span style={{ flex: 1 }}>
                  <span style={{ color: "var(--text-primary)" }}>{kc.message}.</span>
                  {kc.recommendation && (
                    <span style={{ color: "var(--text-secondary)" }}> {kc.recommendation}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {switchTriggers.length === 0 && structuralRisks.length === 0 && (
        <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
          No structural risks or thresholds tripped. This stack scales as configured.
        </p>
      )}
    </div>
  );
}

const subheaderStyle: React.CSSProperties = {
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: 0.6,
  color: "var(--text-muted)",
  marginBottom: 8,
  fontWeight: 600,
};

const listStyle: React.CSSProperties = {
  listStyle: "none",
  padding: 0,
  margin: 0,
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const liStyle: React.CSSProperties = {
  display: "flex",
  gap: 8,
  fontSize: 13,
  color: "var(--text-secondary)",
  lineHeight: 1.5,
};

function formatUsers(n: number): string {
  if (n >= 1_000_000) return `${n / 1_000_000}M`;
  if (n >= 1_000) return `${n / 1_000}k`;
  return String(n);
}
