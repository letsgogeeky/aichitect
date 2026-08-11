"use client";

import type { SimulationSnapshot } from "@/lib/simulate";

interface Props {
  snapshot: SimulationSnapshot;
}

export default function UnitEconomics({ snapshot }: Props) {
  const annual = snapshot.monthlyCostUSD * 12;
  const tiles: { label: string; value: string; sub?: string }[] = [
    {
      label: "Cost / month",
      value: formatUsd(snapshot.monthlyCostUSD),
      sub: `at ${formatUsers(snapshot.users)} users`,
    },
    {
      label: "Cost / request",
      value: formatUsdMicro(snapshot.costPerRequest),
      sub: `${formatNumber(snapshot.monthlyRequests)} req/mo`,
    },
    {
      label: "Cost / user",
      value: formatUsdMicro(snapshot.costPerUser),
      sub: "monthly",
    },
    {
      label: "Cost / year",
      value: formatUsd(annual),
      sub: "constant traffic",
    },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        gap: 10,
      }}
    >
      {tiles.map((t) => (
        <div
          key={t.label}
          style={{
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            padding: "10px 12px",
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <span
            style={{
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: 0.6,
              color: "var(--text-muted)",
              fontWeight: 600,
            }}
          >
            {t.label}
          </span>
          <span
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: "var(--text-primary)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {t.value}
          </span>
          {t.sub && <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{t.sub}</span>}
        </div>
      ))}
    </div>
  );
}

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

function formatUsers(n: number): string {
  if (n >= 1_000_000) return `${n / 1_000_000}M`;
  if (n >= 1_000) return `${n / 1_000}k`;
  return String(n);
}

function formatNumber(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return String(n);
}
