"use client";

import LogSlider from "./LogSlider";
import TokenPresets from "./TokenPresets";
import { SCALE_BOUNDS } from "@/lib/simulateDefaults";

interface Props {
  monthlyUsers: number;
  requestsPerUserPerDay: number;
  avgInputTokens: number;
  avgOutputTokens: number;
  onChange: (
    patch: Partial<{
      monthlyUsers: number;
      requestsPerUserPerDay: number;
      avgInputTokens: number;
      avgOutputTokens: number;
    }>
  ) => void;
}

function formatUsers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}k`;
  return String(n);
}

function formatTokens(n: number): string {
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}k`;
  return String(n);
}

function formatRPD(n: number): string {
  return `${n}/day`;
}

export default function ScaleStep({
  monthlyUsers,
  requestsPerUserPerDay,
  avgInputTokens,
  avgOutputTokens,
  onChange,
}: Props) {
  const monthlyRequests = monthlyUsers * requestsPerUserPerDay * 30;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
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
        label="Requests per user per day"
        min={SCALE_BOUNDS.requestsPerUserPerDay.min}
        max={SCALE_BOUNDS.requestsPerUserPerDay.max}
        value={requestsPerUserPerDay}
        logScale={SCALE_BOUNDS.requestsPerUserPerDay.logScale}
        formatValue={formatRPD}
        onChange={(v) => onChange({ requestsPerUserPerDay: v })}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          padding: 12,
          background: "var(--surface-2)",
          border: "1px solid var(--border)",
          borderRadius: 6,
        }}
      >
        <TokenPresets
          input={avgInputTokens}
          output={avgOutputTokens}
          onChange={(input, output) => onChange({ avgInputTokens: input, avgOutputTokens: output })}
        />
        <LogSlider
          label="Input tokens / request"
          min={SCALE_BOUNDS.inputTokens.min}
          max={SCALE_BOUNDS.inputTokens.max}
          value={avgInputTokens}
          logScale={SCALE_BOUNDS.inputTokens.logScale}
          formatValue={formatTokens}
          onChange={(v) => onChange({ avgInputTokens: v })}
        />
        <LogSlider
          label="Output tokens / request"
          min={SCALE_BOUNDS.outputTokens.min}
          max={SCALE_BOUNDS.outputTokens.max}
          value={avgOutputTokens}
          logScale={SCALE_BOUNDS.outputTokens.logScale}
          formatValue={formatTokens}
          onChange={(v) => onChange({ avgOutputTokens: v })}
        />
      </div>

      <p style={{ fontSize: 11, color: "var(--text-muted)", margin: 0 }}>
        ≈ <strong style={{ color: "var(--text-secondary)" }}>{formatUsers(monthlyRequests)}</strong>{" "}
        requests/mo at this scale.
      </p>
    </div>
  );
}
