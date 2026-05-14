"use client";

import LogSlider from "./LogSlider";
import { SCALE_BOUNDS } from "@/lib/simulateDefaults";

interface Props {
  monthlyUsers: number;
  requestsPerUserPerDay: number;
  avgTokens: number;
  onChange: (
    patch: Partial<{
      monthlyUsers: number;
      requestsPerUserPerDay: number;
      avgTokens: number;
    }>
  ) => void;
}

function formatUsers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}k`;
  return String(n);
}

function formatTokens(n: number): string {
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}k tok`;
  return `${n} tok`;
}

function formatRPD(n: number): string {
  return `${n} / user / day`;
}

export default function ScaleStep({
  monthlyUsers,
  requestsPerUserPerDay,
  avgTokens,
  onChange,
}: Props) {
  const monthlyRequests = monthlyUsers * requestsPerUserPerDay * 30;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
        How big is the workload?
      </h2>
      <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>
        Approximate scale — the simulator projects nine points from 1k to 1M users so being precise
        isn&apos;t critical.
      </p>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 20,
          marginTop: 8,
          padding: 16,
          background: "var(--surface-2)",
          border: "1px solid var(--border)",
          borderRadius: 8,
        }}
      >
        <LogSlider
          label="Monthly active users"
          min={SCALE_BOUNDS.monthlyUsers.min}
          max={SCALE_BOUNDS.monthlyUsers.max}
          value={monthlyUsers}
          logScale={SCALE_BOUNDS.monthlyUsers.logScale}
          formatValue={formatUsers}
          onChange={(v) => onChange({ monthlyUsers: v })}
        />
        <LogSlider
          label="Avg requests / user / day"
          min={SCALE_BOUNDS.requestsPerUserPerDay.min}
          max={SCALE_BOUNDS.requestsPerUserPerDay.max}
          value={requestsPerUserPerDay}
          logScale={SCALE_BOUNDS.requestsPerUserPerDay.logScale}
          formatValue={formatRPD}
          onChange={(v) => onChange({ requestsPerUserPerDay: v })}
        />
        <LogSlider
          label="Avg tokens / request"
          min={SCALE_BOUNDS.avgTokens.min}
          max={SCALE_BOUNDS.avgTokens.max}
          value={avgTokens}
          logScale={SCALE_BOUNDS.avgTokens.logScale}
          formatValue={formatTokens}
          onChange={(v) => onChange({ avgTokens: v })}
          hint="prompt + completion combined"
        />
      </div>

      <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>
        At these settings:{" "}
        <strong style={{ color: "var(--text-secondary)" }}>{formatUsers(monthlyRequests)}</strong>{" "}
        requests/month.
      </p>
    </div>
  );
}
