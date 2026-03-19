"use client";

import { useState, useMemo, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  Node,
  Edge,
  NodeTypes,
  ReactFlowProvider,
} from "reactflow";
import "reactflow/dist/style.css";

import slotsData from "@/data/slots.json";
import toolsData from "@/data/tools.json";
import relationshipsData from "@/data/relationships.json";
import { Slot, Tool, Relationship, getCategoryColor } from "@/lib/types";
import { applyDagreLayout } from "@/lib/graph";
import { SLOT_AUTONOMY, generateStackStory } from "@/lib/stackStory";
import ToolNode from "@/components/graph/ToolNode";
import ComparisonPanel from "@/components/panels/ComparisonPanel";
import StackHealthPanel from "@/components/panels/StackHealthPanel";

const slots = slotsData as Slot[];
const allTools = toolsData as Tool[];
const relationships = relationshipsData as Relationship[];
const nodeTypes: NodeTypes = { tool: ToolNode };

// Default slots always shown in the sidebar
const DEFAULT_SLOT_IDS = new Set(slots.slice(0, 6).map((s) => s.id));

function BuilderGraph({
  toolIds,
  expandedId,
  onExpandId,
}: {
  toolIds: string[];
  expandedId: string | null;
  onExpandId: (id: string | null) => void;
}) {
  const toolSet = new Set(toolIds);

  const nodes: Node[] = toolIds
    .map((id) => allTools.find((t) => t.id === id))
    .filter(Boolean)
    .map((t) => ({
      id: t!.id,
      type: "tool",
      data: { ...t!, highlighted: true, expanded: expandedId === t!.id },
      position: { x: 0, y: 0 },
    }));

  const edges: Edge[] = relationships
    .filter(
      (r) =>
        toolSet.has(r.source) &&
        toolSet.has(r.target) &&
        (r.type === "integrates-with" || r.type === "commonly-paired")
    )
    .map((r) => {
      const sourceTool = allTools.find((t) => t.id === r.source);
      const color = sourceTool ? getCategoryColor(sourceTool.category) : "#00d4aa";
      const isPaired = r.type === "commonly-paired";
      return {
        id: `builder-${r.source}-${r.target}`,
        source: r.source,
        target: r.target,
        animated: !isPaired,
        style: {
          stroke: isPaired ? "#4a4a7a" : color,
          strokeWidth: isPaired ? 1 : 1.5,
          strokeDasharray: isPaired ? "5,4" : undefined,
        },
        label: isPaired ? "often used together" : undefined,
        labelStyle: isPaired ? { fill: "#555577", fontSize: 9 } : undefined,
        labelBgStyle: isPaired ? { fill: "#0e0e18", fillOpacity: 0.8 } : undefined,
      };
    });

  const laidOut = applyDagreLayout(nodes, edges, "LR", 280, 130);

  if (laidOut.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3 px-8 text-center">
        <p className="text-sm font-semibold text-[var(--text-primary)]">
          Too many tools, not enough signal.
        </p>
        <p className="text-xs text-[var(--text-muted)] max-w-xs leading-relaxed">
          Pick one tool per slot on the left. Your stack will render here — with every integration
          mapped out.
        </p>
        <div className="flex items-center gap-1 text-[10px] text-[var(--text-muted)] mt-2">
          <span>←</span>
          <span>Start with your code editor</span>
        </div>
      </div>
    );
  }

  return (
    <ReactFlow
      nodes={laidOut}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodeClick={(_, node) => onExpandId(expandedId === node.id ? null : node.id)}
      fitView
      fitViewOptions={{ padding: 0.25, duration: 300 }}
      proOptions={{ hideAttribution: true }}
      minZoom={0.3}
    >
      <Background variant={BackgroundVariant.Dots} color="#1e1e2e" gap={20} size={1} />
      <Controls showInteractive={false} />
    </ReactFlow>
  );
}

function BuilderPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stackParam = searchParams.get("s") ?? "";

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [compareA, setCompareA] = useState<Tool | null>(null);
  const [compareB, setCompareB] = useState<Tool | null>(null);

  // All tool IDs from the URL — used directly by the graph (no slot constraint)
  const urlToolIds = useMemo(() => stackParam.split(",").filter(Boolean), [stackParam]);

  // Slot-constrained selection for the sidebar — first occurrence per slot wins
  const selected = useMemo<Record<string, string>>(() => {
    const result: Record<string, string> = {};
    for (const toolId of urlToolIds) {
      const slot = slots.find((s) => s.tools.includes(toolId));
      if (slot && !result[slot.id]) result[slot.id] = toolId;
    }
    return result;
  }, [urlToolIds]);

  // Sidebar shows the default 6 slots + any extra slots that have URL-specified tools
  const visibleSlots = useMemo(() => {
    const extras = slots.filter((s) => !DEFAULT_SLOT_IDS.has(s.id) && !!selected[s.id]);
    return [...slots.slice(0, 6), ...extras];
  }, [selected]);

  const pickTool = useCallback(
    (slotId: string, toolId: string) => {
      const next = {
        ...selected,
        [slotId]: selected[slotId] === toolId ? "" : toolId,
      };
      const param = Object.values(next).filter(Boolean).join(",");
      const url = new URL(window.location.href);
      if (param) {
        url.searchParams.set("s", param);
      } else {
        url.searchParams.delete("s");
      }
      router.replace(url.pathname + url.search, { scroll: false });
    },
    [selected, router]
  );

  function handleCompareClick(tool: Tool, e: React.MouseEvent) {
    e.stopPropagation();
    // Already showing a comparison — replace slot B
    if (compareA && compareB) {
      if (tool.id === compareA.id || tool.id === compareB.id) {
        setCompareA(null);
        setCompareB(null);
      } else {
        setCompareB(tool);
      }
      return;
    }
    // No A staged yet
    if (!compareA) {
      setCompareA(tool);
      return;
    }
    // A is staged — clicking A again deselects
    if (compareA.id === tool.id) {
      setCompareA(null);
      return;
    }
    // Stage B → show panel
    setCompareB(tool);
  }

  const selectedCount = Object.values(selected).filter(Boolean).length;
  const [collapsedSlots, setCollapsedSlots] = useState<Record<string, boolean>>({});

  const selectedTools = useMemo(
    () => urlToolIds.map((id) => allTools.find((t) => t.id === id)).filter(Boolean) as Tool[],
    [urlToolIds]
  );
  const story = useMemo(() => generateStackStory(selectedTools), [selectedTools]);

  function toggleSlot(slotId: string) {
    setCollapsedSlots((prev) => ({ ...prev, [slotId]: !prev[slotId] }));
  }

  return (
    <div className="flex h-full">
      {/* Slots panel */}
      <aside
        className="w-64 flex-shrink-0 border-r overflow-y-auto"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div className="p-3 space-y-3">
          <div className="mb-1">
            <p className="text-xs font-semibold text-[var(--text-primary)] mb-1">
              Your stack, no bloat.
            </p>
            <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">
              Answer each question. We&apos;ll map how the tools wire together.
            </p>
          </div>
          {selectedCount > 0 && (
            <div
              className="text-[10px] px-2 py-1 rounded-md"
              style={{ background: "#7c6bff18", color: "#7c6bff" }}
            >
              {selectedCount} of {visibleSlots.length} slots filled
            </div>
          )}

          {/* Compare staging hint */}
          {compareA && !compareB && (
            <div
              className="flex items-center gap-1.5 text-[10px] px-2 py-1.5 rounded-md"
              style={{ background: "#7c6bff14", border: "1px solid #7c6bff33", color: "#7c6bff" }}
            >
              <div
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: getCategoryColor(compareA.category) }}
              />
              <span className="truncate font-medium">{compareA.name}</span>
              <span className="text-[#7c6bff66] flex-shrink-0">· pick one more</span>
              <button
                onClick={() => setCompareA(null)}
                className="ml-auto flex-shrink-0 text-[#7c6bff88] hover:text-[#7c6bff] transition-colors"
              >
                ✕
              </button>
            </div>
          )}

          <StackHealthPanel
            selected={selected}
            slots={slots}
            allTools={allTools}
            onAddTool={pickTool}
          />

          {visibleSlots.map((slot) => {
            const selectedId = selected[slot.id];
            const slotTools = slot.tools
              .map((id) => allTools.find((t) => t.id === id))
              .filter(Boolean) as Tool[];
            const isOpen = !collapsedSlots[slot.id];
            const selectedTool = slotTools.find((t) => t.id === selectedId);

            return (
              <div key={slot.id}>
                {/* Slot header — collapsible */}
                <button
                  onClick={() => toggleSlot(slot.id)}
                  className="w-full flex items-start gap-2 mb-1 text-left group"
                >
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 10 10"
                    fill="none"
                    className="mt-0.5 flex-shrink-0 text-[var(--text-muted)]"
                    style={{
                      transform: isOpen ? "rotate(0deg)" : "rotate(-90deg)",
                      transition: "transform 180ms ease",
                    }}
                  >
                    <path
                      d="M2 3.5L5 6.5L8 3.5"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-[var(--text-primary)] leading-tight">
                      {slot.name}
                    </p>
                    {SLOT_AUTONOMY[slot.id] && (
                      <span
                        className="text-[9px] font-medium"
                        style={{ color: SLOT_AUTONOMY[slot.id].color, opacity: 0.75 }}
                      >
                        {SLOT_AUTONOMY[slot.id].label}
                      </span>
                    )}
                    {!isOpen && selectedTool && (
                      <p
                        className="text-[10px] mt-0.5 truncate"
                        style={{ color: getCategoryColor(selectedTool.category) }}
                      >
                        {selectedTool.name}
                      </p>
                    )}
                    {!isOpen && !selectedTool && (
                      <p className="text-[10px] text-[var(--text-muted)] mt-0.5">not set</p>
                    )}
                  </div>
                </button>

                {isOpen && (
                  <>
                    <p className="text-[10px] text-[var(--text-muted)] mb-1.5 pl-4 leading-relaxed">
                      {slot.description}
                    </p>
                    <div className="space-y-0.5">
                      {slotTools.map((t) => {
                        const active = selectedId === t.id;
                        const color = getCategoryColor(t.category);
                        const isCompareA = compareA?.id === t.id;
                        const isCompareB = compareB?.id === t.id;
                        const isCompared = isCompareA || isCompareB;
                        return (
                          <div key={t.id} className="flex items-center gap-1 group/tool">
                            <button
                              onClick={() => pickTool(slot.id, t.id)}
                              className="flex-1 flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-all"
                              style={{
                                background: active ? color + "22" : "var(--surface-2)",
                                border: active ? `1px solid ${color}66` : "1px solid var(--border)",
                              }}
                            >
                              <div
                                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                style={{ background: color }}
                              />
                              <span
                                className="text-xs font-medium"
                                style={{ color: active ? color : "var(--text-primary)" }}
                              >
                                {t.name}
                              </span>
                              {t.type === "oss" && (
                                <span className="ml-auto text-[9px] text-[#26de81]">OSS</span>
                              )}
                            </button>
                            {/* Compare icon — visible on row hover or when staged */}
                            <button
                              onClick={(e) => handleCompareClick(t, e)}
                              title={isCompareA ? "Staged for comparison" : `Compare ${t.name}`}
                              className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded transition-all"
                              style={{
                                opacity: isCompared ? 1 : undefined,
                                background: isCompared ? "#7c6bff22" : "transparent",
                                color: isCompared ? "#7c6bff" : "var(--text-muted)",
                              }}
                              // Show on hover via CSS class — we use a sibling trick with group
                            >
                              <svg
                                width="11"
                                height="11"
                                viewBox="0 0 12 12"
                                fill="none"
                                className={
                                  isCompared
                                    ? ""
                                    : "opacity-0 group-hover/tool:opacity-100 transition-opacity"
                                }
                              >
                                <rect
                                  x="0.5"
                                  y="0.5"
                                  width="4"
                                  height="11"
                                  rx="1"
                                  stroke="currentColor"
                                  strokeWidth="1.2"
                                />
                                <rect
                                  x="7.5"
                                  y="0.5"
                                  width="4"
                                  height="11"
                                  rx="1"
                                  stroke="currentColor"
                                  strokeWidth="1.2"
                                />
                              </svg>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </aside>

      {/* Builder graph */}
      <div className="flex-1 overflow-hidden relative">
        <ReactFlowProvider key={stackParam}>
          <BuilderGraph toolIds={urlToolIds} expandedId={expandedId} onExpandId={setExpandedId} />
        </ReactFlowProvider>

        {/* Stack Story — floating overlay at the bottom of the graph */}
        {story && (
          <div
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 rounded-xl px-4 py-3 w-max max-w-[560px]"
            style={{
              background: "#0e0e18ee",
              border: "1px solid #7c6bff33",
              backdropFilter: "blur(8px)",
              animation: "fadeIn 220ms ease",
            }}
          >
            <p className="text-[9px] font-semibold uppercase tracking-widest text-[#7c6bff88] mb-1.5">
              Your stack reads
            </p>
            <p className="text-[11px] text-[var(--text-primary)] font-mono mb-1 leading-relaxed">
              {story.flow}
            </p>
            <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">{story.prose}</p>
          </div>
        )}
      </div>

      {/* Comparison panel */}
      {compareA && compareB && (
        <ComparisonPanel
          toolA={compareA}
          toolB={compareB}
          onClose={() => {
            setCompareA(null);
            setCompareB(null);
          }}
          onSwap={() => {
            setCompareA(compareB);
            setCompareB(compareA);
          }}
        />
      )}
    </div>
  );
}

export default function BuilderPage() {
  return (
    <Suspense
      fallback={
        <div
          className="h-full flex items-center justify-center text-xs"
          style={{ color: "var(--text-muted)" }}
        >
          Loading stack…
        </div>
      }
    >
      <BuilderPageContent />
    </Suspense>
  );
}
