"use client";

import { useState } from "react";
import {
  Stack,
  Tool,
  StackCluster,
  LifecycleTrack,
  getCategoryColor,
  STACK_CLUSTERS,
} from "@/lib/types";
import { PHASE_TRACK_COLOR } from "@/lib/lifecycle";
import { COMPLEXITY_META } from "../stacksConstants";

type TrackFilter = "all" | LifecycleTrack;

const TRACK_CHIPS: { id: TrackFilter; label: string; tagline: string }[] = [
  { id: "all", label: "All", tagline: "every stack" },
  { id: "development", label: "Dev", tagline: "how you build" },
  { id: "runtime", label: "Runtime", tagline: "what runs in prod" },
  { id: "specialized", label: "Specialized", tagline: "narrow slices" },
];

export function StackSidebar({
  stacks,
  allTools,
  activeCluster,
  selectedId,
  onSelectCluster,
  onSelectStack,
}: {
  stacks: Stack[];
  allTools: Tool[];
  activeCluster: StackCluster;
  selectedId: string;
  onSelectCluster: (cluster: StackCluster) => void;
  onSelectStack: (s: Stack) => void;
}) {
  const [trackFilter, setTrackFilter] = useState<TrackFilter>("all");
  const [toolFilter, setToolFilter] = useState("");

  const trackFiltered =
    trackFilter === "all" ? stacks : stacks.filter((s) => s.track === trackFilter);
  const clusterStacks = trackFiltered.filter((s) => s.cluster === activeCluster);

  const q = toolFilter.trim().toLowerCase();
  const filteredResults: { stack: Stack; rejected: string | null }[] = q
    ? trackFiltered
        .map((s) => {
          const included = s.tools.some((id) => {
            const t = allTools.find((tool) => tool.id === id);
            return t?.name.toLowerCase().includes(q);
          });
          if (included) return { stack: s, rejected: null };
          const rejection = s.not_in_stack?.find((r) => {
            const t = allTools.find((tool) => tool.id === r.tool);
            return t?.name.toLowerCase().includes(q);
          });
          if (rejection) return { stack: s, rejected: rejection.reason };
          return null;
        })
        .filter(Boolean as unknown as <T>(x: T | null) => x is T)
    : [];

  // Counts per track for chip badge rendering.
  const trackCounts: Record<TrackFilter, number> = {
    all: stacks.length,
    development: stacks.filter((s) => s.track === "development").length,
    runtime: stacks.filter((s) => s.track === "runtime").length,
    specialized: stacks.filter((s) => s.track === "specialized").length,
  };

  return (
    <aside
      data-tour="stacks-sidebar"
      className="hidden sm:flex flex-col flex-shrink-0 border-r overflow-hidden"
      style={{ width: 288, background: "var(--surface)", borderColor: "var(--border)" }}
    >
      {/* Track filter chips */}
      {!q && (
        <div
          className="flex-shrink-0 flex items-center gap-1 px-3 py-2 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          {TRACK_CHIPS.map((chip) => {
            const active = trackFilter === chip.id;
            const chipColor =
              chip.id === "all"
                ? "var(--accent)"
                : chip.id === "specialized"
                  ? "var(--text-muted)"
                  : PHASE_TRACK_COLOR[chip.id];
            return (
              <button
                key={chip.id}
                onClick={() => setTrackFilter(chip.id)}
                title={chip.tagline}
                className="flex items-center gap-1 text-[10px] font-semibold rounded-full px-2 py-1 transition-colors"
                style={
                  active
                    ? {
                        background: chipColor + "22",
                        color: chipColor,
                        border: `1px solid ${chipColor}55`,
                      }
                    : {
                        background: "transparent",
                        color: "var(--text-muted)",
                        border: "1px solid var(--border)",
                      }
                }
              >
                {chip.label}
                <span className="opacity-60">{trackCounts[chip.id]}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Cluster tabs — hidden while tool filter is active */}
      {!q && (
        <div className="flex-shrink-0 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="flex flex-col gap-0">
            {STACK_CLUSTERS.map((cluster) => {
              const count = trackFiltered.filter((s) => s.cluster === cluster.id).length;
              const isActive = activeCluster === cluster.id;
              return (
                <button
                  key={cluster.id}
                  onClick={() => onSelectCluster(cluster.id)}
                  className="flex items-center justify-between px-4 py-2.5 text-left transition-all"
                  style={{
                    background: isActive ? "#7c6bff12" : "transparent",
                    borderLeft: `3px solid ${isActive ? "var(--accent)" : "transparent"}`,
                  }}
                >
                  <div>
                    <div
                      className="text-[12px] font-semibold leading-tight"
                      style={{ color: isActive ? "var(--accent)" : "var(--text-secondary)" }}
                    >
                      {cluster.label}
                    </div>
                    <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                      {cluster.tagline}
                    </div>
                  </div>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded"
                    style={{
                      background: isActive ? "#7c6bff20" : "var(--btn)",
                      color: isActive ? "var(--accent)" : "#555577",
                      border: `1px solid ${isActive ? "#7c6bff33" : "var(--btn-border)"}`,
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Tool filter */}
      <div className="flex-shrink-0 px-3 py-2 border-b" style={{ borderColor: "var(--border)" }}>
        <input
          type="text"
          value={toolFilter}
          onChange={(e) => setToolFilter(e.target.value)}
          placeholder="Filter by tool name…"
          className="w-full rounded-md px-2.5 py-1.5 text-xs outline-none"
          style={{
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            color: "var(--text-primary)",
          }}
        />
      </div>

      {/* Stack list */}
      <div className="flex-1 overflow-y-auto py-2">
        {q && filteredResults.length > 0 && (
          <div className="px-3 pb-1 text-[10px]" style={{ color: "var(--text-muted)" }}>
            {filteredResults.length} stack{filteredResults.length !== 1 ? "s" : ""} — click any to
            view
          </div>
        )}
        {q && filteredResults.length === 0 && (
          <div className="px-4 py-3 text-xs" style={{ color: "var(--text-muted)" }}>
            No stacks include or reject this tool.
          </div>
        )}
        {(q
          ? filteredResults.map(({ stack: s, rejected }) => ({ s, rejected }))
          : clusterStacks.map((s) => ({ s, rejected: null }))
        ).map(({ s, rejected }) => {
          const isSelected = selectedId === s.id;
          const firstTool = allTools.find((t) => t.id === s.tools[0]);
          const color = firstTool ? getCategoryColor(firstTool.category) : "var(--accent)";
          const cx = s.complexity ? COMPLEXITY_META[s.complexity] : null;
          const stackTools = s.tools
            .map((id) => allTools.find((t) => t.id === id))
            .filter(Boolean) as Tool[];

          return (
            <button
              key={s.id}
              onClick={() => onSelectStack(s)}
              className="w-full text-left px-3 py-3 transition-all"
              style={{
                borderLeft: `3px solid ${isSelected ? color : "transparent"}`,
                background: isSelected ? color + "10" : "transparent",
              }}
            >
              <div
                className="text-[13px] font-semibold leading-snug mb-1"
                style={{ color: isSelected ? color : "var(--text-primary)" }}
              >
                {s.name}
              </div>
              <div className="text-xs leading-snug mb-1.5" style={{ color: "var(--text-muted)" }}>
                {s.target}
              </div>
              {q && (
                <div
                  className="text-[10px] mb-1.5 font-semibold uppercase tracking-wide"
                  style={{ color: "#555577" }}
                >
                  {STACK_CLUSTERS.find((c) => c.id === s.cluster)?.label}
                </div>
              )}
              {rejected !== null && (
                <div
                  className="text-[10px] leading-snug mb-2 px-1.5 py-1 rounded"
                  style={{
                    background: "#ff6b6b10",
                    color: "#ff6b6b99",
                    border: "1px solid #ff6b6b22",
                  }}
                >
                  Ruled out: &ldquo;{rejected}&rdquo;
                </div>
              )}
              {rejected === null && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {cx && (
                      <>
                        <div
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: cx.color,
                            flexShrink: 0,
                          }}
                        />
                        <span style={{ fontSize: 12, color: cx.color }}>{cx.label}</span>
                      </>
                    )}
                    {s.monthly_cost && (
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        · {s.monthly_cost}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-0.5">
                    {stackTools.slice(0, 6).map((t) => (
                      <div
                        key={t.id}
                        title={t.name}
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: "50%",
                          background: getCategoryColor(t.category),
                          opacity: 0.8,
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Scope footer — explicit about what AIchitect curates (per SCOPE.md) */}
      <div
        className="flex-shrink-0 border-t px-3 py-2.5"
        style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
      >
        <p className="text-[10px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
          These are AI-layer stacks. Pair with your own hosting, CI, and database.
        </p>
      </div>
    </aside>
  );
}
