"use client";

const STAGE_LABEL: Record<string, string> = {
  guardrails: "Guardrails check",
  embedding: "Query embedding",
  vector: "Vector retrieval",
  ttft: "LLM time-to-first-token",
  generation: "LLM generation",
  framework: "Framework overhead",
  llm: "LLM call", // legacy alias
};

const STAGE_COLOR: Record<string, string> = {
  guardrails: "var(--danger)",
  embedding: "var(--accent-2)",
  vector: "var(--accent-2)",
  ttft: "var(--accent)",
  generation: "var(--accent)",
  framework: "var(--warning)",
  llm: "var(--accent)",
};

interface Props {
  totalMs: number;
  /** Stage-keyed millisecond breakdown — typically result.snapshots[0].latencyByStage. */
  stages: Record<string, number>;
}

export default function LatencyBreakdown({ totalMs, stages }: Props) {
  const entries = Object.entries(stages).filter(([, ms]) => ms > 0);
  const max = Math.max(1, ...entries.map(([, ms]) => ms));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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

      {entries.map(([stage, ms]) => {
        const widthPct = (ms / max) * 100;
        const sharePct = Math.round((ms / totalMs) * 100);
        return (
          <div key={stage} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
              <span style={{ color: "var(--text-secondary)" }}>{STAGE_LABEL[stage] ?? stage}</span>
              <span style={{ color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
                {formatMs(ms)} <span style={{ color: "var(--text-muted)" }}>· {sharePct}%</span>
              </span>
            </div>
            <div
              style={{
                height: 8,
                background: "var(--border)",
                borderRadius: 4,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${widthPct}%`,
                  height: "100%",
                  background: STAGE_COLOR[stage] ?? "var(--accent)",
                  transition: "width 0.3s ease",
                }}
              />
            </div>
          </div>
        );
      })}

      <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "4px 0 0" }}>
        Generation scales linearly with output tokens — shrink the response or pick a
        higher-throughput model to bring this down.
      </p>
    </div>
  );
}

function formatMs(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`;
  return `${Math.round(ms)}ms`;
}
