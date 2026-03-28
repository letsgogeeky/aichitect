"use client";

import { Suspense, useEffect, useRef, useState } from "react";
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
import GetStartedModal from "@/components/ui/GetStartedModal";
import { StackQuizModal } from "@/components/ui/StackQuizModal";
import { ProductionUsageSection } from "@/components/ui/ProductionUsageSection";
import { IconShare } from "@/components/icons";
import Link from "next/link";
import { SITE_URL } from "@/lib/constants";

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
        labelStyle: isPaired ? { fill: "#555577", fontSize: 10 } : undefined,
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
      nodesDraggable
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
  const [copied, setCopied] = useState(false);
  const [copiedBadge, setCopiedBadge] = useState(false);
  const [getStartedOpen, setGetStartedOpen] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);

  function copyStack() {
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {});
  }

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
    setStack,
    handleCompareClick,
    toggleSlot,
    clearCompare,
  } = useBuilderState(slots, allTools);

  const badgeUrl = `${SITE_URL}/badge?s=${stackParam}`;
  const badgeMarkdown = `[![AI Stack](${badgeUrl})](${SITE_URL}/builder?s=${stackParam})`;

  function copyBadge() {
    navigator.clipboard.writeText(badgeMarkdown).then(() => {
      setCopiedBadge(true);
      setTimeout(() => setCopiedBadge(false), 2000);
    });
  }

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
        onOpenQuiz={() => setQuizOpen(true)}
      />

      {/* Builder graph */}
      <div className="flex-1 overflow-hidden relative">
        {/* Floating action bar — desktop only, shown when tools are selected */}
        {selectedCount > 0 && (
          <div
            className="hidden sm:flex absolute top-0 left-0 right-0 z-10 items-center justify-end gap-2 px-3 py-2"
            style={{
              background: "linear-gradient(to bottom, var(--surface-2) 60%, transparent)",
              pointerEvents: "none",
            }}
          >
            <div style={{ pointerEvents: "auto" }}>
              <ProductionUsageSection tools={stackParam.split(",").filter(Boolean)} />
            </div>
            <Link
              href={`/case?s=${stackParam}`}
              className="flex items-center transition-all"
              style={{
                gap: 6,
                padding: "0 12px",
                height: 30,
                borderRadius: 7,
                background: "#fdcb6e18",
                border: "1px solid #fdcb6e44",
                color: "#fdcb6e",
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
                pointerEvents: "auto",
                textDecoration: "none",
              }}
            >
              Make a case →
            </Link>
            <button
              data-tour="builder-share"
              onClick={copyStack}
              className="flex items-center transition-all"
              style={{
                gap: 6,
                padding: "0 12px",
                height: 30,
                borderRadius: 7,
                background: copied ? "#00d4aa30" : "#00d4aa18",
                border: `1px solid ${copied ? "#00d4aa88" : "#00d4aa44"}`,
                color: "var(--accent-2)",
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
                pointerEvents: "auto",
              }}
            >
              <IconShare size={12} />
              {copied ? "Copied!" : "Share Stack"}
            </button>
            <button
              onClick={() => setGetStartedOpen(true)}
              className="flex items-center transition-all"
              style={{
                gap: 6,
                padding: "0 12px",
                height: 30,
                borderRadius: 7,
                background: "#7c6bff18",
                border: "1px solid #7c6bff44",
                color: "var(--accent)",
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
                pointerEvents: "auto",
              }}
            >
              Get Started →
            </button>
          </div>
        )}

        {/* Floating badge strip — below the action bar, desktop only */}
        {selectedCount > 0 && (
          <div
            className="hidden sm:flex absolute z-10 items-center gap-2 px-2.5 py-1.5 rounded-lg"
            style={{
              top: 46,
              right: 12,
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
            }}
          >
            <span className="type-caption text-[var(--text-muted)]">Add to your README</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={badgeUrl} alt="AI Stack badge" className="h-4" />
            <button
              onClick={copyBadge}
              className="type-tag transition-all"
              style={{
                padding: "2px 8px",
                borderRadius: 5,
                background: copiedBadge ? "#26de8118" : "var(--btn)",
                border: `1px solid ${copiedBadge ? "#26de8144" : "var(--btn-border)"}`,
                color: copiedBadge ? "var(--success)" : "var(--text-muted)",
              }}
            >
              {copiedBadge ? "Copied!" : "Copy snippet"}
            </button>
          </div>
        )}

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
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#7c6bff88] mb-1.5">
              Your stack reads
            </p>
            <p className="text-xs text-[var(--text-primary)] font-mono mb-1 leading-relaxed">
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
        onOpenQuiz={() => {
          setMobileSlotPickerOpen(false);
          setQuizOpen(true);
        }}
      />

      {getStartedOpen && (
        <GetStartedModal
          toolIds={stackParam.split(",").filter(Boolean)}
          onClose={() => setGetStartedOpen(false)}
        />
      )}

      {quizOpen && (
        <StackQuizModal
          onClose={() => setQuizOpen(false)}
          onApply={(toolIds) => {
            setStack(toolIds);
            setQuizOpen(false);
          }}
        />
      )}
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
