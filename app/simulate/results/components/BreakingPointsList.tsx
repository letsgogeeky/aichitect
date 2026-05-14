"use client";

import type { BreakingPoint } from "@/lib/simulate";

const ICON: Record<BreakingPoint["type"], string> = {
  latency: "❌",
  cost: "⚠️",
  architecture: "🏗",
};

const ACCENT: Record<BreakingPoint["type"], string> = {
  latency: "var(--danger)",
  cost: "var(--warning)",
  architecture: "var(--accent)",
};

export default function BreakingPointsList({ points }: { points: BreakingPoint[] }) {
  if (points.length === 0) {
    return (
      <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
        No breaking points hit across the projected scale. Your stack scales cleanly through 1M
        users at the given request volume.
      </p>
    );
  }

  return (
    <ul
      style={{
        listStyle: "none",
        padding: 0,
        margin: 0,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      {points.map((bp, i) => (
        <li
          key={i}
          style={{
            display: "flex",
            gap: 12,
            padding: 12,
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            borderLeft: `3px solid ${ACCENT[bp.type]}`,
            borderRadius: 6,
          }}
        >
          <span style={{ fontSize: 18, lineHeight: 1 }} aria-hidden>
            {ICON[bp.type]}
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
            <div style={{ fontSize: 14, color: "var(--text-primary)" }}>{bp.message}</div>
            {bp.recommendation && (
              <div
                style={{
                  fontSize: 12,
                  color: "var(--text-secondary)",
                  lineHeight: 1.4,
                }}
              >
                <span style={{ color: "var(--accent-2)" }}>→ </span>
                {bp.recommendation}
              </div>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
