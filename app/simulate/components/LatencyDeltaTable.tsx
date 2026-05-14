"use client";

import type { LatencyDeltaRow } from "@/lib/simulateDelta";

const LAYER_LABEL: Record<string, string> = {
  llm: "LLM call",
  vector: "Vector retrieval",
  framework: "Framework",
};

interface Props {
  rows: LatencyDeltaRow[];
  total: { current: number; shadow: number; delta: number };
}

export default function LatencyDeltaTable({ rows, total }: Props) {
  return (
    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
        fontSize: 13,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      <thead>
        <tr style={{ textAlign: "left" }}>
          <th style={thStyle}>Layer</th>
          <th style={thStyleRight}>Current</th>
          <th style={thStyleRight}>Shadow</th>
          <th style={thStyleRight}>Delta</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.layer} style={trStyle}>
            <td style={tdStyle}>{LAYER_LABEL[row.layer] ?? row.layer}</td>
            <td style={tdStyleRight}>{formatMs(row.current)}</td>
            <td style={tdStyleRight}>{formatMs(row.shadow)}</td>
            <td style={{ ...tdStyleRight, color: deltaColor(row.delta), fontWeight: 500 }}>
              {row.delta === 0
                ? "—"
                : `${row.delta < 0 ? "−" : "+"}${formatMs(Math.abs(row.delta))}`}
              {row.delta < 0 ? " ✓" : row.delta > 0 ? " ✗" : ""}
            </td>
          </tr>
        ))}
        <tr style={{ ...trStyle, borderTop: "2px solid var(--border)" }}>
          <td style={{ ...tdStyle, fontWeight: 600 }}>Total</td>
          <td style={{ ...tdStyleRight, fontWeight: 600 }}>{formatMs(total.current)}</td>
          <td style={{ ...tdStyleRight, fontWeight: 600 }}>{formatMs(total.shadow)}</td>
          <td
            style={{
              ...tdStyleRight,
              fontWeight: 600,
              color: deltaColor(total.delta),
            }}
          >
            {total.delta === 0
              ? "—"
              : `${total.delta < 0 ? "−" : "+"}${formatMs(Math.abs(total.delta))}`}
            {total.delta < 0 ? " ✓" : total.delta > 0 ? " ✗" : ""}
          </td>
        </tr>
      </tbody>
    </table>
  );
}

const thStyle: React.CSSProperties = {
  padding: "8px 10px 10px 0",
  borderBottom: "1px solid var(--border)",
  color: "var(--text-muted)",
  fontWeight: 500,
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: 0.6,
};

const thStyleRight: React.CSSProperties = { ...thStyle, textAlign: "right" };

const trStyle: React.CSSProperties = { borderBottom: "1px solid var(--border)" };

const tdStyle: React.CSSProperties = { padding: "10px 10px 10px 0", color: "var(--text-primary)" };

const tdStyleRight: React.CSSProperties = {
  ...tdStyle,
  textAlign: "right",
  color: "var(--text-primary)",
};

function formatMs(ms: number): string {
  if (ms === 0) return "0ms";
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`;
  return `${Math.round(ms)}ms`;
}

function deltaColor(d: number): string {
  if (d < 0) return "var(--success)";
  if (d > 0) return "var(--danger)";
  return "var(--text-muted)";
}
