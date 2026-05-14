"use client";

import { useState } from "react";
import type { DeltaSnapshot } from "@/lib/simulateDelta";
import { SCALE_STEPS } from "@/lib/simulate";

interface Props {
  snapshots: DeltaSnapshot[];
  crossoverUsers: number | null;
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

export default function CostDeltaChart({ snapshots, crossoverUsers }: Props) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const hoverSnap = hoverIdx !== null ? snapshots[hoverIdx] : null;

  const maxCost = Math.max(1, ...snapshots.map((s) => Math.max(s.currentCost, s.shadowCost)));
  const yMax = maxCost * 1.1;

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * yMax);

  const currentPath = snapshots
    .map((s) => `${xFor(s.users)},${yFor(s.currentCost, yMax)}`)
    .join(" ");
  const shadowPath = snapshots.map((s) => `${xFor(s.users)},${yFor(s.shadowCost, yMax)}`).join(" ");

  // Shaded delta area: polygon connecting current line and shadow line.
  const areaPoints = [
    ...snapshots.map((s) => `${xFor(s.users)},${yFor(s.currentCost, yMax)}`),
    ...snapshots
      .slice()
      .reverse()
      .map((s) => `${xFor(s.users)},${yFor(s.shadowCost, yMax)}`),
  ].join(" ");

  // Color the shaded area by which line is on top at max scale.
  const lastDelta = snapshots[snapshots.length - 1]?.costDelta ?? 0;
  const areaFill = lastDelta < 0 ? "var(--success)" : "var(--danger)";

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      width="100%"
      style={{ display: "block", maxWidth: WIDTH }}
      aria-label="Cost projection — current vs shadow stack"
    >
      {/* Y grid */}
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

      {/* X ticks */}
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

      {/* Delta area */}
      <polygon points={areaPoints} fill={areaFill} fillOpacity={0.12} stroke="none" />

      {/* Current line */}
      <polyline points={currentPath} fill="none" stroke="var(--accent)" strokeWidth={2} />
      {snapshots.map((s) => (
        <circle
          key={`c-${s.users}`}
          cx={xFor(s.users)}
          cy={yFor(s.currentCost, yMax)}
          r={2.5}
          fill="var(--accent)"
        />
      ))}

      {/* Shadow line */}
      <polyline
        points={shadowPath}
        fill="none"
        stroke="var(--accent-2)"
        strokeWidth={2}
        strokeDasharray="5,4"
      />
      {snapshots.map((s) => (
        <circle
          key={`s-${s.users}`}
          cx={xFor(s.users)}
          cy={yFor(s.shadowCost, yMax)}
          r={2.5}
          fill="var(--accent-2)"
        />
      ))}

      {/* Crossover marker */}
      {crossoverUsers && (
        <g>
          <line
            x1={xFor(crossoverUsers)}
            x2={xFor(crossoverUsers)}
            y1={PADDING.top}
            y2={PADDING.top + PLOT_H}
            stroke="var(--success)"
            strokeWidth={1.5}
            strokeDasharray="4,3"
          />
          <text
            x={xFor(crossoverUsers)}
            y={PADDING.top - 6}
            textAnchor="middle"
            fontSize={10}
            fill="var(--success)"
          >
            ↓ shadow wins
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
        <g>
          <line x1={0} x2={20} y1={-3} y2={-3} stroke="var(--accent)" strokeWidth={2} />
          <text x={26} fontSize={11} fill="var(--text-secondary)">
            Current stack
          </text>
        </g>
        <g transform="translate(180, 0)">
          <line
            x1={0}
            x2={20}
            y1={-3}
            y2={-3}
            stroke="var(--accent-2)"
            strokeWidth={2}
            strokeDasharray="5,4"
          />
          <text x={26} fontSize={11} fill="var(--text-secondary)">
            Shadow stack
          </text>
        </g>
      </g>

      {/* Hover guide line */}
      {hoverSnap && (
        <line
          x1={xFor(hoverSnap.users)}
          x2={xFor(hoverSnap.users)}
          y1={PADDING.top}
          y2={PADDING.top + PLOT_H}
          stroke="var(--text-muted)"
          strokeWidth={1}
          strokeDasharray="2,2"
          pointerEvents="none"
        />
      )}

      {/* Hit bands for hover */}
      {SCALE_STEPS.map((users, i) => {
        const xc = xFor(users);
        const left = i === 0 ? PADDING.left : (xFor(SCALE_STEPS[i - 1]) + xc) / 2;
        const right =
          i === SCALE_STEPS.length - 1
            ? PADDING.left + PLOT_W
            : (xc + xFor(SCALE_STEPS[i + 1])) / 2;
        return (
          <rect
            key={`hit-${users}`}
            x={left}
            y={PADDING.top}
            width={right - left}
            height={PLOT_H}
            fill="transparent"
            style={{ cursor: "crosshair" }}
            onMouseEnter={() => setHoverIdx(i)}
            onMouseLeave={() => setHoverIdx(null)}
          />
        );
      })}

      {/* Tooltip */}
      {hoverSnap && (
        <DeltaTooltip snap={hoverSnap} x={xFor(hoverSnap.users)} maxX={PADDING.left + PLOT_W} />
      )}
    </svg>
  );
}

function DeltaTooltip({ snap, x, maxX }: { snap: DeltaSnapshot; x: number; maxX: number }) {
  const boxW = 200;
  const boxH = 92;
  const flip = x + boxW + 12 > maxX;
  const boxX = flip ? x - boxW - 10 : x + 10;
  const boxY = PADDING.top + 10;
  const deltaColor =
    snap.costDelta < 0
      ? "var(--success)"
      : snap.costDelta > 0
        ? "var(--danger)"
        : "var(--text-muted)";
  return (
    <g pointerEvents="none">
      <rect
        x={boxX}
        y={boxY}
        width={boxW}
        height={boxH}
        rx={6}
        fill="var(--surface-2)"
        stroke="var(--border)"
        strokeWidth={1}
      />
      <text
        x={boxX + 10}
        y={boxY + 18}
        fontSize={11}
        fill="var(--text-muted)"
        fontWeight={600}
        style={{ textTransform: "uppercase", letterSpacing: 0.6 }}
      >
        {formatUsers(snap.users)} users
      </text>
      <text x={boxX + 10} y={boxY + 38} fontSize={11} fill="var(--text-secondary)">
        Current
      </text>
      <text
        x={boxX + boxW - 10}
        y={boxY + 38}
        textAnchor="end"
        fontSize={11}
        fill="var(--text-primary)"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {formatCost(snap.currentCost)}
      </text>
      <text x={boxX + 10} y={boxY + 54} fontSize={11} fill="var(--text-secondary)">
        Shadow
      </text>
      <text
        x={boxX + boxW - 10}
        y={boxY + 54}
        textAnchor="end"
        fontSize={11}
        fill="var(--text-primary)"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {formatCost(snap.shadowCost)}
      </text>
      <line
        x1={boxX + 10}
        x2={boxX + boxW - 10}
        y1={boxY + 64}
        y2={boxY + 64}
        stroke="var(--border)"
      />
      <text x={boxX + 10} y={boxY + 80} fontSize={11} fill="var(--text-secondary)" fontWeight={500}>
        Delta
      </text>
      <text
        x={boxX + boxW - 10}
        y={boxY + 80}
        textAnchor="end"
        fontSize={11}
        fill={deltaColor}
        fontWeight={600}
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {snap.costDelta < 0 ? "−" : snap.costDelta > 0 ? "+" : ""}
        {formatCost(Math.abs(snap.costDelta))}
      </text>
    </g>
  );
}
