"use client";

import type { SimulationSnapshot, BreakingPoint } from "@/lib/simulate";
import { SCALE_STEPS } from "@/lib/simulate";

interface ToolSeries {
  id: string;
  name: string;
  color: string;
}

interface Props {
  snapshots: SimulationSnapshot[];
  series: ToolSeries[];
  /** First breaking point of any type, drawn as a vertical marker. */
  firstBreakingPoint?: BreakingPoint;
}

const WIDTH = 720;
const HEIGHT = 300;
const PADDING = { top: 24, right: 24, bottom: 72, left: 64 };
const PLOT_W = WIDTH - PADDING.left - PADDING.right;
const PLOT_H = HEIGHT - PADDING.top - PADDING.bottom;

const X_MIN_LOG = Math.log10(SCALE_STEPS[0]);
const X_MAX_LOG = Math.log10(SCALE_STEPS[SCALE_STEPS.length - 1]);
const X_SPAN = X_MAX_LOG - X_MIN_LOG;

function xFor(users: number): number {
  return PADDING.left + ((Math.log10(users) - X_MIN_LOG) / X_SPAN) * PLOT_W;
}

function yFor(cost: number, yMax: number): number {
  if (yMax <= 0) return PADDING.top + PLOT_H;
  return PADDING.top + PLOT_H - (cost / yMax) * PLOT_H;
}

function formatUsers(n: number): string {
  if (n >= 1_000_000) return `${n / 1_000_000}M`;
  if (n >= 1_000) return `${n / 1_000}k`;
  return String(n);
}

function formatCost(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}k`;
  return `$${Math.round(n)}`;
}

export default function CostChart({ snapshots, series, firstBreakingPoint }: Props) {
  // y-axis max: highest cost line, then add 10% headroom
  const maxCost = Math.max(
    1,
    ...snapshots.map((s) =>
      series.reduce((acc, sx) => Math.max(acc, s.costBreakdown[sx.id] ?? 0), 0)
    )
  );
  const yMax = maxCost * 1.1;

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * yMax);

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      width="100%"
      style={{ display: "block", maxWidth: WIDTH }}
      aria-label="Monthly cost projected across user scale"
    >
      {/* Y grid + labels */}
      {yTicks.map((tick, i) => {
        const y = yFor(tick, yMax);
        return (
          <g key={i}>
            <line
              x1={PADDING.left}
              x2={PADDING.left + PLOT_W}
              y1={y}
              y2={y}
              stroke="var(--border)"
              strokeWidth={1}
              strokeDasharray={i === 0 ? "" : "2,3"}
            />
            <text
              x={PADDING.left - 8}
              y={y + 4}
              textAnchor="end"
              fontSize={10}
              fill="var(--text-muted)"
            >
              {formatCost(tick)}
            </text>
          </g>
        );
      })}

      {/* X ticks + labels */}
      {SCALE_STEPS.map((users) => {
        const x = xFor(users);
        return (
          <g key={users}>
            <line
              x1={x}
              x2={x}
              y1={PADDING.top + PLOT_H}
              y2={PADDING.top + PLOT_H + 4}
              stroke="var(--text-muted)"
              strokeWidth={1}
            />
            <text
              x={x}
              y={PADDING.top + PLOT_H + 16}
              textAnchor="middle"
              fontSize={10}
              fill="var(--text-muted)"
            >
              {formatUsers(users)}
            </text>
          </g>
        );
      })}

      {/* One polyline per tool series */}
      {series.map((s) => {
        const points = snapshots
          .map((snap) => `${xFor(snap.users)},${yFor(snap.costBreakdown[s.id] ?? 0, yMax)}`)
          .join(" ");
        return (
          <g key={s.id}>
            <polyline points={points} fill="none" stroke={s.color} strokeWidth={2} />
            {snapshots.map((snap) => (
              <circle
                key={snap.users}
                cx={xFor(snap.users)}
                cy={yFor(snap.costBreakdown[s.id] ?? 0, yMax)}
                r={2.5}
                fill={s.color}
              />
            ))}
          </g>
        );
      })}

      {/* First breaking-point marker */}
      {firstBreakingPoint && (
        <g>
          <line
            x1={xFor(firstBreakingPoint.users)}
            x2={xFor(firstBreakingPoint.users)}
            y1={PADDING.top}
            y2={PADDING.top + PLOT_H}
            stroke="var(--danger)"
            strokeWidth={1.5}
            strokeDasharray="4,3"
          />
          <text
            x={xFor(firstBreakingPoint.users)}
            y={PADDING.top - 6}
            textAnchor="middle"
            fontSize={10}
            fill="var(--danger)"
          >
            ⚠ {formatUsers(firstBreakingPoint.users)}
          </text>
        </g>
      )}

      {/* Axis title */}
      <text
        x={PADDING.left + PLOT_W / 2}
        y={PADDING.top + PLOT_H + 36}
        textAnchor="middle"
        fontSize={10}
        fill="var(--text-muted)"
      >
        Monthly active users
      </text>

      {/* Legend */}
      <g transform={`translate(${PADDING.left}, ${HEIGHT - 12})`}>
        {series.map((s, i) => (
          <g key={s.id} transform={`translate(${i * 180}, 0)`}>
            <rect width={10} height={10} fill={s.color} y={-9} />
            <text x={14} fontSize={11} fill="var(--text-secondary)">
              {s.name}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
}
