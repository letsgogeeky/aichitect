"use client";

import type { BottleneckType } from "@/lib/simulate";

const STYLES: Record<BottleneckType, { label: string; icon: string; accent: string }> = {
  cost: { label: "Cost-bound", icon: "💸", accent: "var(--warning)" },
  latency: { label: "Latency-bound", icon: "⏱", accent: "var(--danger)" },
  rate_limit: { label: "Rate-limit-bound", icon: "🚦", accent: "var(--accent-2)" },
  balanced: { label: "Cost + latency-bound", icon: "⚠", accent: "var(--danger)" },
  none: { label: "Scales cleanly", icon: "✓", accent: "var(--success)" },
};

interface Props {
  bottleneck: BottleneckType;
  message: string;
}

export default function BottleneckDiagnosis({ bottleneck, message }: Props) {
  const style = STYLES[bottleneck];
  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
        padding: 14,
        background: "var(--surface-2)",
        border: `1px solid ${style.accent}55`,
        borderLeft: `4px solid ${style.accent}`,
        borderRadius: 8,
      }}
    >
      <span style={{ fontSize: 20, lineHeight: 1 }} aria-hidden>
        {style.icon}
      </span>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
        <div
          style={{
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: 0.6,
            color: style.accent,
            fontWeight: 600,
          }}
        >
          {style.label}
        </div>
        <div style={{ fontSize: 13, color: "var(--text-primary)", lineHeight: 1.5 }}>{message}</div>
      </div>
    </div>
  );
}
