"use client";

import { Stack, Tool, StackCluster, getCategoryColor, STACK_CLUSTERS } from "@/lib/types";
import { COMPLEXITY_META } from "../stacksConstants";

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
  const clusterStacks = stacks.filter((s) => s.cluster === activeCluster);

  return (
    <aside
      data-tour="stacks-sidebar"
      className="hidden sm:flex flex-col flex-shrink-0 border-r overflow-hidden"
      style={{ width: 288, background: "var(--surface)", borderColor: "var(--border)" }}
    >
      {/* Cluster tabs */}
      <div className="flex-shrink-0 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex flex-col gap-0">
          {STACK_CLUSTERS.map((cluster) => {
            const count = stacks.filter((s) => s.cluster === cluster.id).length;
            const isActive = activeCluster === cluster.id;
            return (
              <button
                key={cluster.id}
                onClick={() => onSelectCluster(cluster.id)}
                className="flex items-center justify-between px-4 py-2.5 text-left transition-all"
                style={{
                  background: isActive ? "#7c6bff12" : "transparent",
                  borderLeft: `3px solid ${isActive ? "#7c6bff" : "transparent"}`,
                }}
              >
                <div>
                  <div
                    className="text-[12px] font-semibold leading-tight"
                    style={{ color: isActive ? "#7c6bff" : "var(--text-secondary)" }}
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
                    background: isActive ? "#7c6bff20" : "#1c1c28",
                    color: isActive ? "#7c6bff" : "#555577",
                    border: `1px solid ${isActive ? "#7c6bff33" : "#2a2a3a"}`,
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Stack list */}
      <div className="flex-1 overflow-y-auto py-2">
        {clusterStacks.map((s) => {
          const isSelected = selectedId === s.id;
          const firstTool = allTools.find((t) => t.id === s.tools[0]);
          const color = firstTool ? getCategoryColor(firstTool.category) : "#7c6bff";
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
              <div
                className="text-[11px] leading-snug mb-2.5"
                style={{ color: "var(--text-muted)" }}
              >
                {s.target}
              </div>
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
                      <span style={{ fontSize: 11, color: cx.color }}>{cx.label}</span>
                    </>
                  )}
                  {s.monthly_cost && (
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
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
            </button>
          );
        })}
      </div>
    </aside>
  );
}
