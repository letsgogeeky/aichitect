"use client";

import type { CostByLayer } from "@/lib/simulate";

const LAYER_LABEL: Record<keyof CostByLayer, string> = {
  llm: "LLM tokens",
  embedding: "Embedding",
  vector: "Vector DB",
  framework: "Framework",
  eval: "Eval / observability",
  guardrails: "Guardrails",
};

const LAYER_COLOR: Record<keyof CostByLayer, string> = {
  llm: "var(--accent)",
  embedding: "var(--accent-2)",
  vector: "#5b8def",
  framework: "var(--warning)",
  eval: "#a29bfe",
  guardrails: "var(--danger)",
};

interface Props {
  /** costByLayer at the largest scale step — composition is most informative there. */
  byLayer: CostByLayer;
  totalMonthlyCost: number;
}

export default function CostComposition({ byLayer, totalMonthlyCost }: Props) {
  if (totalMonthlyCost <= 0) {
    return (
      <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
        Zero projectable cost — every layer is OSS, free, or has no published rate.
      </p>
    );
  }

  const entries = (Object.keys(LAYER_LABEL) as Array<keyof CostByLayer>)
    .map((key) => ({
      key,
      label: LAYER_LABEL[key],
      color: LAYER_COLOR[key],
      cost: byLayer[key],
      pct: byLayer[key] / totalMonthlyCost,
    }))
    .filter((e) => e.cost > 0)
    .sort((a, b) => b.cost - a.cost);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Stacked horizontal bar — single visual */}
      <div
        style={{
          display: "flex",
          height: 18,
          width: "100%",
          borderRadius: 4,
          overflow: "hidden",
          border: "1px solid var(--border)",
        }}
        aria-label="Cost composition at 1M users"
      >
        {entries.map((e) => (
          <div
            key={e.key}
            style={{
              width: `${Math.max(e.pct * 100, 0.5)}%`,
              background: e.color,
              transition: "width 0.3s ease",
            }}
            title={`${e.label}: ${formatUsd(e.cost)} (${(e.pct * 100).toFixed(1)}%)`}
          />
        ))}
      </div>

      {/* Legend + values */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 8,
        }}
      >
        {entries.map((e) => (
          <div
            key={e.key}
            style={{ display: "flex", gap: 8, alignItems: "baseline", fontSize: 12 }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                background: e.color,
                flexShrink: 0,
                marginTop: 2,
              }}
            />
            <span style={{ flex: 1, color: "var(--text-secondary)" }}>{e.label}</span>
            <span style={{ color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
              {formatUsd(e.cost)}
            </span>
            <span style={{ color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>
              {(e.pct * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatUsd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}k`;
  if (n < 1) return `$${n.toFixed(2)}`;
  return `$${Math.round(n).toLocaleString()}`;
}
