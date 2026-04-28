"use client";

import { useState } from "react";
import Link from "next/link";
import type { CategoryMomentum, PulseToolRow } from "@/lib/pulse";
import { healthColor } from "@/lib/health";
import { formatStarDelta } from "@/lib/format";

interface CategoryMomentumCardProps {
  data: CategoryMomentum;
}

/**
 * Returns arrow + delta label + color for the header.
 * When momentum is null but a raw score exists, signals "no comparison yet".
 */
function getMomentumDisplay(data: CategoryMomentum): {
  arrow: string;
  label: string;
  color: string;
  isEstimate: boolean;
} {
  if (data.momentum != null) {
    if (data.momentum > 5)
      return { arrow: "↑", label: `+${data.momentum}pts`, color: "#00b894", isEstimate: false };
    if (data.momentum < -5)
      return { arrow: "↓", label: `${data.momentum}pts`, color: "#ff6b6b", isEstimate: false };
    return {
      arrow: "→",
      label: `${data.momentum >= 0 ? "+" : ""}${data.momentum}pts`,
      color: "#a0a0b0",
      isEstimate: false,
    };
  }
  if (data.avg_health_now != null) {
    return { arrow: "~", label: `${data.avg_health_now}`, color: "#a0a0b0", isEstimate: true };
  }
  return { arrow: "–", label: "No data", color: "#555577", isEstimate: false };
}

/** Low confidence: fewer than half the tracked tools have a 30d baseline. */
function isLowConfidence(data: CategoryMomentum): boolean {
  if (data.momentum == null) return false;
  if (data.tracked_count < 2) return false;
  return data.baseline_count < Math.ceil(data.tracked_count / 2);
}

function ToolRow({ tool }: { tool: PulseToolRow }) {
  const score = tool.health_score;
  const delta = tool.stars_delta;
  const starInfo = delta != null ? formatStarDelta(delta) : null;

  return (
    <Link
      href={`/tool/${tool.id}`}
      className="flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-white/5"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="truncate text-xs font-medium text-white/85">{tool.name}</span>
          {tool.type === "oss" && (
            <span
              className="shrink-0 rounded px-1 text-[9px] font-semibold uppercase tracking-wide"
              style={{ background: "#26de8118", color: "#26de81" }}
            >
              OSS
            </span>
          )}
          {tool.is_stale && (
            <span className="shrink-0 text-[10px] text-amber-400" title="No commits in 90+ days">
              ⚠
            </span>
          )}
        </div>
        {starInfo && (
          <span className="text-[10px]" style={{ color: starInfo.color }}>
            {starInfo.text}
          </span>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        {score != null ? (
          <>
            <div className="relative h-1 w-16 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full"
                style={{ width: `${score}%`, backgroundColor: healthColor(score), opacity: 0.8 }}
              />
            </div>
            <span
              className="w-5 text-right text-[10px] tabular-nums font-medium"
              style={{ color: healthColor(score) }}
            >
              {score}
            </span>
          </>
        ) : (
          <span className="text-[10px] text-white/20">—</span>
        )}
      </div>
    </Link>
  );
}

export function CategoryMomentumCard({ data }: CategoryMomentumCardProps) {
  const [open, setOpen] = useState(false);
  const [tools, setTools] = useState<PulseToolRow[] | null>(null);
  const [loading, setLoading] = useState(false);

  const { arrow, label, color, isEstimate } = getMomentumDisplay(data);
  const lowConfidence = isLowConfidence(data);
  const healthPct = data.avg_health_now;

  function toggle() {
    if (!open && tools === null && !loading) {
      setLoading(true);
      fetch(`/api/pulse/category/${data.category_id}/tools`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => setTools(d?.tools ?? []))
        .catch(() => setTools([]))
        .finally(() => setLoading(false));
    }
    setOpen((v) => !v);
  }

  return (
    <div
      className="rounded-lg border border-white/10 bg-white/5"
      style={{ borderTopColor: data.color, borderTopWidth: 2 }}
    >
      <button onClick={toggle} className="w-full p-3 text-left" aria-expanded={open}>
        {/* Top row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: data.color }}
            />
            <span className="truncate text-sm font-medium text-white">{data.label}</span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-sm font-semibold tabular-nums" style={{ color }}>
              {arrow}{" "}
              {isEstimate ? (
                <span title="Current average health score — no 30-day comparison available yet">
                  {label}
                </span>
              ) : (
                label
              )}
            </span>
            <span className="text-white/30 text-xs">{open ? "▲" : "▼"}</span>
          </div>
        </div>

        {/* Confidence / estimate notice */}
        {isEstimate && (
          <p className="mt-1 text-[10px] text-white/30">Snapshot score · no 30-day baseline yet</p>
        )}
        {!isEstimate && lowConfidence && (
          <p className="mt-1 text-[10px] text-white/30">
            Based on {data.baseline_count} of {data.tracked_count} tracked tools · early data
          </p>
        )}

        {/* Health bar */}
        <div className={isEstimate || lowConfidence ? "mt-1.5" : "mt-2"}>
          {healthPct != null ? (
            <div className="flex items-center gap-2">
              <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${healthPct}%`, backgroundColor: data.color, opacity: 0.7 }}
                />
              </div>
              <span className="w-6 shrink-0 text-right text-xs tabular-nums text-white/60">
                {healthPct}
              </span>
            </div>
          ) : (
            <div className="h-1.5 rounded-full bg-white/10" />
          )}
        </div>

        {/* Metadata row */}
        <div className="mt-2 flex items-center gap-2 text-xs text-white/40">
          <span>
            {data.tool_count} tool{data.tool_count !== 1 ? "s" : ""}
          </span>
          {data.tracked_count > 0 && (
            <>
              <span>·</span>
              <span>{data.tracked_count} tracked</span>
            </>
          )}
          {data.at_risk_count > 0 && (
            <>
              <span>·</span>
              <span className="text-amber-400">⚠ {data.at_risk_count} at risk</span>
            </>
          )}
          {data.rising_count > 0 && (
            <>
              <span>·</span>
              <span className="text-emerald-400">⭑ {data.rising_count} rising</span>
            </>
          )}
        </div>
      </button>

      {/* Expanded tool list */}
      {open && (
        <div className="border-t border-white/10 px-1 pb-2 pt-1">
          {loading && (
            <div className="space-y-1 px-2 py-1">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-6 animate-pulse rounded bg-white/5" />
              ))}
            </div>
          )}
          {!loading && tools?.length === 0 && (
            <p className="px-3 py-2 text-xs text-white/30">No tools found.</p>
          )}
          {!loading && tools && tools.length > 0 && (
            <div>
              {tools.map((tool) => (
                <ToolRow key={tool.id} tool={tool} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
