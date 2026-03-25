"use client";

import { Suspense, useEffect, useRef } from "react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useBuilderState } from "@/hooks/useBuilderState";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  Node,
  Edge,
  NodeTypes,
  ReactFlowProvider,
  useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";

import { Slot, Tool, Relationship, getCategoryColor } from "@/lib/types";
import { applyDagreLayout, relationshipEdgeStyle } from "@/lib/graph";
import ToolNode from "@/components/graph/ToolNode";
import ComparisonPanel from "@/components/panels/ComparisonPanel";
import { BuilderSlotList } from "./components/BuilderSlotList";
import { MobileSlotPicker } from "./components/MobileSlotPicker";

const nodeTypes: NodeTypes = { tool: ToolNode };

function BuilderGraph({
  toolIds,
  expandedId,
  onExpandId,
  onRemoveTool,
  allTools,
  relationships,
}: {
  toolIds: string[];
  expandedId: string | null;
  onExpandId: (id: string | null) => void;
  onRemoveTool: (toolId: string) => void;
  allTools: Tool[];
  relationships: Relationship[];
}) {
  const { fitView } = useReactFlow();
  const prevLengthRef = useRef(toolIds.length);

  // Re-fit when tools are added or removed, but not on expand/collapse or other re-renders.
  useEffect(() => {
    if (toolIds.length !== prevLengthRef.current) {
      prevLengthRef.current = toolIds.length;
      fitView({ padding: 0.25, duration: 300 });
    }
  }, [toolIds.length, fitView]);

  const toolSet = new Set(toolIds);

  const nodes: Node[] = toolIds
    .map((id) => allTools.find((t) => t.id === id))
    .filter(Boolean)
    .map((t) => ({
      id: t!.id,
      type: "tool",
      data: {
        ...t!,
        highlighted: true,
        expanded: expandedId === t!.id,
        onRemove: () => onRemoveTool(t!.id),
      },
      position: { x: 0, y: 0 },
    }));

  const edges: Edge[] = relationships
    .filter(
      (r) =>
        toolSet.has(r.source) &&
        toolSet.has(r.target) &&
        (r.type === "integrates-with" || r.type === "commonly-paired-with")
    )
    .map((r) => {
      const sourceTool = allTools.find((t) => t.id === r.source);
      const color = sourceTool ? getCategoryColor(sourceTool.category) : "var(--accent-2)";
      const isPaired = r.type === "commonly-paired-with";
      return {
        id: `builder-${r.source}-${r.target}`,
        source: r.source,
        target: r.target,
        animated: !isPaired,
        style: relationshipEdgeStyle(r.type, color),
        label: isPaired ? "often used together" : undefined,
        labelStyle: isPaired ? { fill: "#555577", fontSize: 9 } : undefined,
        labelBgStyle: isPaired ? { fill: "var(--surface)", fillOpacity: 0.8 } : undefined,
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
      nodesDraggable={false}
    >
      <Background variant={BackgroundVariant.Dots} color="#1e1e2e" gap={20} size={1} />
      <Controls showInteractive={false} />
    </ReactFlow>
  );
}

function BuilderPageContent({
  slots,
  allTools,
  relationships,
}: {
  slots: Slot[];
  allTools: Tool[];
  relationships: Relationship[];
}) {
  const isMobile = useIsMobile();
  const {
    urlToolIds,
    selected,
    selectedCount,
    story,
    archetype,
    stackParam,
    expandedId,
    setExpandedId,
    compareA,
    compareB,
    setCompareA,
    setCompareB,
    collapsedSlots,
    mobileSlotPickerOpen,
    setMobileSlotPickerOpen,
    pickTool,
    removeTool,
    handleCompareClick,
    toggleSlot,
    clearCompare,
  } = useBuilderState(slots, allTools);

  return (
    <div className="flex h-full">
      <BuilderSlotList
        slots={slots}
        allTools={allTools}
        selected={selected}
        selectedCount={selectedCount}
        stackParam={stackParam}
        collapsedSlots={collapsedSlots}
        archetype={archetype}
        compareA={compareA}
        compareB={compareB}
        onPickTool={pickTool}
        onToggleSlot={toggleSlot}
        onCompareClick={handleCompareClick}
        onClearCompare={clearCompare}
      />

      {/* Builder graph */}
      <div className="flex-1 overflow-hidden relative">
        <ReactFlowProvider>
          <BuilderGraph
            toolIds={urlToolIds}
            expandedId={expandedId}
            onExpandId={setExpandedId}
            onRemoveTool={removeTool}
            allTools={allTools}
            relationships={relationships}
          />
        </ReactFlowProvider>

        {/* Mobile: floating "Choose Tools" button */}
        <button
          onClick={() => setMobileSlotPickerOpen(true)}
          className="sm:hidden absolute left-3 z-20 flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
          style={{
            bottom: "calc(1rem + env(safe-area-inset-bottom, 0px))",
            background: "var(--accent)",
            color: "#fff",
          }}
        >
          ⊕ Choose Tools{selectedCount > 0 ? ` (${selectedCount})` : ""}
        </button>

        {/* Stack Story — floating overlay at the bottom of the graph */}
        {story && (
          <div
            className="absolute left-1/2 -translate-x-1/2 z-10 rounded-xl px-4 py-3 w-max max-w-[calc(100vw-2rem)] sm:max-w-[560px]"
            style={{
              bottom: "calc(4rem + env(safe-area-inset-bottom, 0px))",
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

      {/* Comparison panel — desktop only */}
      {!isMobile && compareA && compareB && (
        <ComparisonPanel
          toolA={compareA}
          toolB={compareB}
          onClose={clearCompare}
          onSwap={() => {
            setCompareA(compareB);
            setCompareB(compareA);
          }}
        />
      )}

      <MobileSlotPicker
        open={mobileSlotPickerOpen}
        slots={slots}
        allTools={allTools}
        selected={selected}
        selectedCount={selectedCount}
        archetype={archetype}
        onPickTool={pickTool}
        onClose={() => setMobileSlotPickerOpen(false)}
      />
    </div>
  );
}

export default function BuilderClient({
  slots,
  tools,
  relationships,
}: {
  slots: Slot[];
  tools: Tool[];
  relationships: Relationship[];
}) {
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
      <BuilderPageContent slots={slots} allTools={tools} relationships={relationships} />
    </Suspense>
  );
}
