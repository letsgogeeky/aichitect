"use client";

const LAYER_LABEL: Record<string, string> = {
  llm: "LLM call",
  vector: "Vector retrieval",
  framework: "Framework",
};

const LAYER_COLOR: Record<string, string> = {
  llm: "var(--accent)",
  vector: "var(--accent-2)",
  framework: "var(--warning)",
};

interface Props {
  totalMs: number;
  breakdown: Record<string, number>;
}

export default function LatencyBreakdown({ totalMs, breakdown }: Props) {
  const entries = Object.entries(breakdown);
  const max = Math.max(1, ...entries.map(([, ms]) => ms));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 4,
        }}
      >
        <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>p50 end-to-end</span>
        <span
          style={{
            fontSize: 22,
            fontWeight: 600,
            color: totalMs > 2000 ? "var(--danger)" : "var(--text-primary)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {formatMs(totalMs)}
        </span>
      </div>

      {entries.map(([layer, ms]) => {
        const widthPct = (ms / max) * 100;
        return (
          <div key={layer} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
              <span style={{ color: "var(--text-secondary)" }}>{LAYER_LABEL[layer] ?? layer}</span>
              <span style={{ color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
                {formatMs(ms)}
              </span>
            </div>
            <div
              style={{
                height: 10,
                background: "var(--border)",
                borderRadius: 4,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${widthPct}%`,
                  height: "100%",
                  background: LAYER_COLOR[layer] ?? "var(--accent)",
                  transition: "width 0.3s ease",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function formatMs(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`;
  return `${Math.round(ms)}ms`;
}
