"use client";

import type { Verdict } from "@/lib/simulateDelta";

const ACCENT: Record<Verdict, { color: string; icon: string; label: string }> = {
  switch_now: { color: "var(--success)", icon: "✓", label: "Switch" },
  switch_above_X: { color: "var(--accent-2)", icon: "↗", label: "Switch above threshold" },
  latency_only: { color: "var(--warning)", icon: "⚡", label: "Trade money for latency" },
  stick: { color: "var(--text-muted)", icon: "—", label: "Stick with current" },
};

interface Props {
  verdict: Verdict;
  verdictMessage: string;
}

export default function SwitchVerdict({ verdict, verdictMessage }: Props) {
  const accent = ACCENT[verdict];
  return (
    <div
      style={{
        display: "flex",
        gap: 14,
        alignItems: "flex-start",
        padding: 16,
        background: "var(--surface-2)",
        border: `1px solid ${accent.color}55`,
        borderLeft: `4px solid ${accent.color}`,
        borderRadius: 8,
      }}
    >
      <span style={{ fontSize: 22, lineHeight: 1, color: accent.color }} aria-hidden>
        {accent.icon}
      </span>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
        <div
          style={{
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: 0.6,
            color: accent.color,
            fontWeight: 600,
          }}
        >
          {accent.label}
        </div>
        <div style={{ fontSize: 14, color: "var(--text-primary)", lineHeight: 1.5 }}>
          {verdictMessage}
        </div>
      </div>
    </div>
  );
}
