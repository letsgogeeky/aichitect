"use client";

import { Stack, Tool, StackCluster, getCategoryColor, STACK_CLUSTERS } from "@/lib/types";

export function MobileStackPicker({
  stacks,
  allTools,
  selectedId,
  activeCluster,
  onSelectStack,
  onSelectCluster,
  onClose,
}: {
  stacks: Stack[];
  allTools: Tool[];
  selectedId: string;
  activeCluster: StackCluster;
  onSelectStack: (s: Stack) => void;
  onSelectCluster: (cluster: StackCluster) => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col sm:hidden"
      style={{ background: "var(--bg)", paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      <div
        className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0"
        style={{ borderColor: "var(--border)" }}
      >
        <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          Choose a Stack
        </span>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-sm"
          style={{ color: "var(--text-muted)", background: "var(--surface-2)" }}
        >
          ✕
        </button>
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        {STACK_CLUSTERS.map((cluster) => {
          const clStacks = stacks.filter((s) => s.cluster === cluster.id);
          return (
            <div key={cluster.id} className="mb-4">
              <div
                className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest"
                style={{ color: "var(--text-muted)" }}
              >
                {cluster.label}
              </div>
              {clStacks.map((s) => {
                const isSelected = selectedId === s.id;
                const firstTool = allTools.find((t) => t.id === s.tools[0]);
                const color = firstTool ? getCategoryColor(firstTool.category) : "var(--accent)";
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      onSelectStack(s);
                      if (s.cluster !== activeCluster) onSelectCluster(s.cluster);
                      onClose();
                    }}
                    className="w-full text-left px-4 py-3 transition-all"
                    style={{
                      borderLeft: `3px solid ${isSelected ? color : "transparent"}`,
                      background: isSelected ? color + "10" : "transparent",
                    }}
                  >
                    <div
                      className="text-sm font-semibold"
                      style={{ color: isSelected ? color : "var(--text-primary)" }}
                    >
                      {s.name}
                    </div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {s.target}
                    </div>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
