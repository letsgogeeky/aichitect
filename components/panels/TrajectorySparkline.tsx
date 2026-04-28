"use client";

import { useEffect, useRef, useState } from "react";
import type { SnapshotPoint, SnapshotsResponse } from "@/app/api/tool/[toolId]/snapshots/route";

interface TrajectorySparklineProps {
  toolId: string;
  categoryColor: string;
  className?: string;
}

interface TooltipState {
  x: number;
  date: string;
  healthScore: number | null;
  stars: number | null;
}

const WIDTH = 300;
const HEIGHT = 56;

function normalize(values: (number | null)[], height: number): (number | null)[] {
  const defined = values.filter((v): v is number => v != null);
  if (defined.length === 0) return values.map(() => null);
  const min = Math.min(...defined);
  const max = Math.max(...defined);
  const range = max - min;
  return values.map((v) => {
    if (v == null) return null;
    if (range === 0) return height / 2;
    // Invert: high values near top (y=0), low values near bottom (y=HEIGHT)
    return height - ((v - min) / range) * (height - 4) - 2;
  });
}

function buildPolyline(xs: number[], ys: (number | null)[]): string {
  const points: string[] = [];
  for (let i = 0; i < xs.length; i++) {
    if (ys[i] != null) {
      points.push(`${xs[i].toFixed(1)},${(ys[i] as number).toFixed(1)}`);
    }
  }
  return points.join(" ");
}

function formatStars(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export function TrajectorySparkline({
  toolId,
  categoryColor,
  className,
}: TrajectorySparklineProps) {
  const [snapshots, setSnapshots] = useState<SnapshotPoint[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/tool/${toolId}/snapshots`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: SnapshotsResponse | null) => {
        if (!cancelled) {
          setSnapshots(data?.snapshots ?? []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSnapshots([]);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [toolId]);

  if (loading) {
    return (
      <div
        className={`animate-pulse rounded bg-white/10 ${className ?? ""}`}
        style={{ height: HEIGHT }}
      />
    );
  }

  if (!snapshots || snapshots.length < 7) {
    return null;
  }

  const n = snapshots.length;
  const xs = snapshots.map((_, i) => (i / (n - 1)) * WIDTH);

  const healthValues = snapshots.map((s) => s.health_score);
  const starsValues = snapshots.map((s) => s.stars);

  const healthYs = normalize(healthValues, HEIGHT);
  const starsYs = normalize(starsValues, HEIGHT);

  const healthPolyline = buildPolyline(xs, healthYs);
  const starsPolyline = buildPolyline(xs, starsYs);

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * WIDTH;
    // Find closest snapshot index
    const idx = Math.round((relX / WIDTH) * (n - 1));
    const clamped = Math.max(0, Math.min(n - 1, idx));
    const snap = snapshots![clamped];
    const date = new Date(snap.recorded_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    setTooltip({
      x: (clamped / (n - 1)) * 100,
      date,
      healthScore: snap.health_score,
      stars: snap.stars,
    });
  }

  return (
    <div className={`relative select-none ${className ?? ""}`}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
        className="w-full cursor-crosshair overflow-visible"
        style={{ height: HEIGHT }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
      >
        {/* Stars line (dashed, muted) */}
        {starsPolyline && (
          <polyline
            points={starsPolyline}
            fill="none"
            stroke="rgba(255,255,255,0.25)"
            strokeWidth="1.5"
            strokeDasharray="4 3"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}
        {/* Health score line (solid, category color) */}
        {healthPolyline && (
          <polyline
            points={healthPolyline}
            fill="none"
            stroke={categoryColor}
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
            opacity={0.85}
          />
        )}
        {/* Hover indicator line */}
        {tooltip && (
          <line
            x1={(tooltip.x / 100) * WIDTH}
            x2={(tooltip.x / 100) * WIDTH}
            y1={0}
            y2={HEIGHT}
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="1"
          />
        )}
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none absolute bottom-full mb-1 rounded bg-[#1a1a2e] border border-white/20 px-2 py-1 text-xs text-white shadow-lg"
          style={{
            left: `${tooltip.x}%`,
            transform: "translateX(-50%)",
            whiteSpace: "nowrap",
          }}
        >
          <div className="font-medium">{tooltip.date}</div>
          {tooltip.healthScore != null && (
            <div style={{ color: categoryColor }}>Health: {tooltip.healthScore}</div>
          )}
          {tooltip.stars != null && (
            <div className="text-white/50">Stars: {formatStars(tooltip.stars)}</div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="mt-1 flex items-center gap-3 text-[10px] text-white/30">
        <span className="flex items-center gap-1">
          <span
            className="inline-block h-0.5 w-4 rounded"
            style={{ backgroundColor: categoryColor, opacity: 0.85 }}
          />
          health score
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-0.5 w-4 rounded bg-white/25" />
          stars
        </span>
      </div>
    </div>
  );
}
