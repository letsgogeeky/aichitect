"use client";

import { useMemo } from "react";
import type { SimulationInput } from "@/lib/simulate";
import { simulate } from "@/lib/simulate";
import type { Tool } from "@/lib/types";
import { getCategoryColor } from "@/lib/types";

interface Props {
  input: SimulationInput;
  tools: Tool[];
  /** Scale step to compare at — usually the user's monthlyUsers picked from snapshots. */
  comparisonUsers?: number;
  /** Callback to swap the primary LLM. */
  onPickLlm?: (toolId: string) => void;
}

interface Row {
  tool: Tool;
  monthlyCost: number;
  costPerRequest: number;
  totalLatencyMs: number;
  active: boolean;
}

export default function ProviderCompare({ input, tools, comparisonUsers, onPickLlm }: Props) {
  const rows: Row[] = useMemo(() => {
    const candidates = tools.filter(
      (t) => t.slot === "inference" && t.cost_model?.type === "per_token"
    );

    const out: Row[] = candidates.map((tool) => {
      const result = simulate({ ...input, stack: { ...input.stack, llm: tool.id } }, tools);
      const snap =
        comparisonUsers != null
          ? (result.snapshots.find((s) => s.users === comparisonUsers) ?? result.snapshots[0])
          : result.snapshots[0];
      return {
        tool,
        monthlyCost: snap.monthlyCostUSD,
        costPerRequest: snap.costPerRequest,
        totalLatencyMs: snap.avgLatencyMs,
        active: tool.id === input.stack.llm,
      };
    });

    // Sort by monthly cost ascending; tied → lower latency wins.
    out.sort((a, b) => a.monthlyCost - b.monthlyCost || a.totalLatencyMs - b.totalLatencyMs);
    return out;
  }, [input, tools, comparisonUsers]);

  if (rows.length === 0) {
    return (
      <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
        No comparable per-token LLM providers in the catalog.
      </p>
    );
  }

  const scaleLabel = comparisonUsers
    ? `${formatUsers(comparisonUsers)} users`
    : `${formatUsers(rows[0]?.monthlyCost > 0 ? input.monthlyUsers : 1_000)}`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>
        Same workload at {scaleLabel} — ranked by monthly cost. Click a row to switch primary LLM.
      </p>
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
            <th style={thStyle}>Model</th>
            <th style={thStyleRight}>Cost / mo</th>
            <th style={thStyleRight}>Cost / req</th>
            <th style={thStyleRight}>p50 latency</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.tool.id}
              onClick={() => onPickLlm?.(row.tool.id)}
              onKeyDown={
                onPickLlm
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onPickLlm(row.tool.id);
                      }
                    }
                  : undefined
              }
              role={onPickLlm ? "button" : undefined}
              tabIndex={onPickLlm ? 0 : undefined}
              style={{
                borderBottom: "1px solid var(--border)",
                background: row.active ? "var(--surface-2)" : "transparent",
                cursor: onPickLlm ? "pointer" : "default",
                transition: "background 0.15s ease",
              }}
              title={onPickLlm ? "Switch primary LLM to this model" : undefined}
            >
              <td style={tdStyle}>
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 999,
                      background: getCategoryColor(row.tool.category),
                      flexShrink: 0,
                    }}
                  />
                  <span>{row.tool.name}</span>
                  {i === 0 && (
                    <span
                      style={{
                        fontSize: 11,
                        color: "var(--success)",
                        background: "color-mix(in srgb, var(--success) 12%, transparent)",
                        padding: "2px 6px",
                        borderRadius: 999,
                        marginLeft: 4,
                      }}
                    >
                      Cheapest
                    </span>
                  )}
                  {row.active && (
                    <span
                      style={{
                        fontSize: 11,
                        color: "var(--accent)",
                        background: "color-mix(in srgb, var(--accent) 12%, transparent)",
                        padding: "2px 6px",
                        borderRadius: 999,
                      }}
                    >
                      Current
                    </span>
                  )}
                </span>
              </td>
              <td style={tdStyleRight}>{formatUsd(row.monthlyCost)}</td>
              <td style={tdStyleRight}>{formatUsdMicro(row.costPerRequest)}</td>
              <td
                style={{
                  ...tdStyleRight,
                  color: row.totalLatencyMs > 2000 ? "var(--danger)" : "var(--text-primary)",
                }}
              >
                {formatMs(row.totalLatencyMs)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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
const tdStyle: React.CSSProperties = { padding: "10px 10px 10px 0", color: "var(--text-primary)" };
const tdStyleRight: React.CSSProperties = { ...tdStyle, textAlign: "right" };

function formatUsd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}k`;
  if (n < 1) return `$${n.toFixed(2)}`;
  return `$${Math.round(n).toLocaleString()}`;
}
function formatUsdMicro(n: number): string {
  if (n === 0) return "$0";
  if (n >= 1) return `$${n.toFixed(2)}`;
  if (n >= 0.01) return `$${n.toFixed(3)}`;
  if (n >= 0.001) return `$${n.toFixed(4)}`;
  return `${(n * 100).toFixed(3)}¢`;
}
function formatMs(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`;
  return `${Math.round(ms)}ms`;
}
function formatUsers(n: number): string {
  if (n >= 1_000_000) return `${n / 1_000_000}M`;
  if (n >= 1_000) return `${n / 1_000}k`;
  return String(n);
}
