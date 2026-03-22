"use client";

import { useCallback, useMemo, useState, Component, ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useComparisonMode } from "@/hooks/useComparisonMode";
import dynamic from "next/dynamic";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Node,
  Edge,
  NodeTypes,
  useReactFlow,
  ReactFlowProvider,
  FitViewOptions,
} from "reactflow";
import "reactflow/dist/style.css";

import toolsData from "@/data/tools.json";
import relationshipsData from "@/data/relationships.json";
import stacksData from "@/data/stacks.json";
import {
  Tool,
  Relationship,
  RelationshipType,
  Stack,
  getCategoryColor,
  STACK_LAYERS,
  CategoryId,
} from "@/lib/types";
import { gridLayout, swimlaneLayout } from "@/lib/graph";
import ToolNode from "./ToolNode";
import LaneLabel from "./LaneLabel";
const ExploreGraph3D = dynamic(() => import("./ExploreGraph3D"), { ssr: false });
import FilterPanel from "@/components/panels/FilterPanel";
import DetailPanel from "@/components/panels/DetailPanel";
import ComparisonPanel from "@/components/panels/ComparisonPanel";
import { useSuggestTool } from "@/components/ui/SuggestToolContext";
import BottomSheet from "@/components/mobile/BottomSheet";
import ToolDetailSheet from "@/components/mobile/ToolDetailSheet";

const staticTools = toolsData as Tool[];
const staticRelationships = relationshipsData as Relationship[];
const staticStacks = stacksData as Stack[];

// Aggregate rejection reasons per tool for search
const toolRejectionReasons = new Map<string, string[]>();
for (const stack of staticStacks) {
  for (const r of stack.not_in_stack ?? []) {
    const existing = toolRejectionReasons.get(r.tool) ?? [];
    existing.push(r.reason);
    toolRejectionReasons.set(r.tool, existing);
  }
}

const nodeTypes: NodeTypes = { tool: ToolNode, laneLabel: LaneLabel };

class Graph3DErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            gap: 8,
            color: "#8888aa",
            fontSize: 13,
            textAlign: "center",
            padding: 32,
          }}
        >
          <p>3D view failed to load.</p>
          <p style={{ fontSize: 11 }}>Switch to Grid or Layers using the toggle above.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

const FIT_VIEW_OPTIONS: FitViewOptions = { padding: 0.12, duration: 400 };

function edgeStyle(type: RelationshipType, sourceCategory: string) {
  const color = getCategoryColor(sourceCategory as never);
  if (type === "integrates-with") {
    return {
      stroke: color,
      strokeWidth: 1.5,
      strokeDasharray: undefined,
    };
  }
  if (type === "commonly-paired-with") {
    return { stroke: "#4a4a7a", strokeWidth: 1.5, strokeDasharray: "5,4" };
  }
  return { stroke: "#3a3a4a", strokeWidth: 1, strokeDasharray: "2,4" };
}

interface ExploreGraphInnerProps {
  tools: Tool[];
  relationships: Relationship[];
  activeCategories: Set<string>;
  activeRelTypes: Set<RelationshipType>;
  searchQuery: string;
  highlightedIds: Set<string>;
  onSelectTool: (tool: Tool) => void;
  viewMode: "grid" | "layers";
  onSuggest: (name: string) => void;
}

function ExploreGraphInner({
  tools,
  relationships,
  activeCategories,
  activeRelTypes,
  searchQuery,
  highlightedIds,
  onSelectTool,
  viewMode,
  onSuggest,
}: ExploreGraphInnerProps) {
  useReactFlow();

  const visibleTools = useMemo(
    () => tools.filter((t) => activeCategories.has(t.category)),
    [activeCategories, tools]
  );

  const searchMatch = useMemo(() => {
    if (!searchQuery) return null;
    const q = searchQuery.toLowerCase();
    return new Set(
      tools
        .filter(
          (t) =>
            t.name.toLowerCase().includes(q) ||
            t.tagline.toLowerCase().includes(q) ||
            toolRejectionReasons.get(t.id)?.some((r) => r.toLowerCase().includes(q))
        )
        .map((t) => t.id)
    );
  }, [searchQuery, tools]);

  const nodes: Node[] = useMemo(() => {
    const toolNodeInputs = visibleTools.map((t) => ({
      id: t.id,
      type: "tool",
      data: {
        ...t,
        dimmed: searchMatch != null && !searchMatch.has(t.id),
        highlighted: highlightedIds.has(t.id),
      },
      position: { x: 0, y: 0 },
    }));

    if (viewMode === "grid") {
      return gridLayout(toolNodeInputs, 6, 220, 90, 24);
    }

    // Build layer index map: tool id → layer index
    const toolLayerIndex = new Map<string, number>();
    for (const tool of visibleTools) {
      for (let li = 0; li < STACK_LAYERS.length; li++) {
        if (STACK_LAYERS[li].categories.includes(tool.category as CategoryId)) {
          toolLayerIndex.set(tool.id, li);
          break;
        }
      }
    }

    const { toolNodes, laneNodes } = swimlaneLayout(
      toolNodeInputs,
      (id) => toolLayerIndex.get(id) ?? -1,
      STACK_LAYERS.map((l) => ({ label: l.label, question: l.question })),
      5, // cols
      220, // nodeWidth
      90, // nodeHeight
      24, // gap
      52, // laneGap
      40, // headerHeight
      20, // padH
      14 // padV
    );

    // laneNodes first so they render behind tool nodes
    return [...laneNodes, ...toolNodes];
  }, [visibleTools, searchMatch, highlightedIds, viewMode]);

  const edges: Edge[] = useMemo(() => {
    const visibleIds = new Set(visibleTools.map((t) => t.id));
    return relationships
      .filter(
        (r) =>
          visibleIds.has(r.source) &&
          visibleIds.has(r.target) &&
          activeRelTypes.has(r.type as RelationshipType)
      )
      .map((r) => {
        const sourceTool = tools.find((t) => t.id === r.source);
        const style = edgeStyle(r.type as RelationshipType, sourceTool?.category ?? "");
        return {
          id: `${r.source}-${r.target}`,
          source: r.source,
          target: r.target,
          animated: r.type === "integrates-with",
          style,
        };
      });
  }, [visibleTools, activeRelTypes, tools, relationships]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const tool = tools.find((t) => t.id === node.id);
      if (tool) onSelectTool(tool);
    },
    [onSelectTool, tools]
  );

  const hasSearchResults = !searchMatch || visibleTools.some((t) => searchMatch.has(t.id));

  return (
    <div className="w-full h-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        fitView
        fitViewOptions={FIT_VIEW_OPTIONS}
        minZoom={0.2}
        maxZoom={2}
        panOnScroll={false}
        panOnDrag={true}
        zoomOnPinch={true}
        zoomOnDoubleClick={false}
        selectionOnDrag={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} color="#1e1e2e" gap={20} size={1} />
        <Controls showInteractive={false} />
        <MiniMap
          nodeColor={(node) => {
            const tool = tools.find((t) => t.id === node.id);
            return tool ? getCategoryColor(tool.category) : "#555577";
          }}
          maskColor="#0a0a0f99"
        />
      </ReactFlow>
      {!hasSearchResults && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-3"
          style={{ zIndex: 10 }}
        >
          <p style={{ fontSize: 13, color: "#8888aa" }}>No tools match your search.</p>
          <button
            onClick={() => onSuggest(searchQuery)}
            style={{
              padding: "7px 16px",
              borderRadius: 8,
              background: "#7c6bff22",
              border: "1px solid #7c6bff44",
              color: "#7c6bff",
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            + Suggest &ldquo;{searchQuery}&rdquo;
          </button>
        </div>
      )}
    </div>
  );
}

export default function ExploreGraph({
  initialTools,
  initialRelationships,
}: {
  initialTools?: Tool[];
  initialRelationships?: Relationship[];
}) {
  const [tools] = useState<Tool[]>(initialTools ?? staticTools);
  const activeRelationships = initialRelationships ?? staticRelationships;
  const { openSuggest } = useSuggestTool();
  const isMobile = useIsMobile();

  const allCategories = useMemo(() => new Set(tools.map((t) => t.category)), [tools]);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  const searchParams = useSearchParams();

  const initialComparison = useMemo((): [Tool, Tool] | null => {
    const param = searchParams.get("compare");
    if (!param) return null;
    const [aId, bId] = param.split(",");
    const a = tools.find((t) => t.id === aId);
    const b = tools.find((t) => t.id === bId);
    return a && b ? [a, b] : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const {
    selectedTool,
    setSelectedTool,
    compareMode,
    setCompareMode,
    comparisonTools,
    setComparisonTools,
    handleNodeSelect,
    highlightedIds,
    panelMode,
  } = useComparisonMode(initialComparison);

  const [activeCategories, setActiveCategories] = useState<Set<string>>(allCategories);
  const [activeRelTypes, setActiveRelTypes] = useState<Set<RelationshipType>>(
    new Set(["integrates-with", "commonly-paired-with", "competes-with"])
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "layers" | "3d">("3d");

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Intent banner — hidden on mobile to save space */}
      {!bannerDismissed && (
        <div
          className="hidden sm:flex items-center justify-between px-4 py-2 flex-shrink-0 border-b"
          style={{ background: "#0d0d1a", borderColor: "var(--border)" }}
        >
          <p className="text-xs text-[var(--text-secondary)]">
            <span className="text-[var(--text-primary)] font-medium">
              AI tools are all over the place.
            </span>{" "}
            This is the full landscape — {tools.length} tools across {allCategories.size}{" "}
            categories, mapped and connected. Ready to narrow it down?{" "}
            <a
              href="/builder"
              className="underline underline-offset-2"
              style={{ color: "#7c6bff" }}
            >
              Build your stack →
            </a>
          </p>
          <button
            onClick={() => setBannerDismissed(true)}
            className="ml-4 text-[var(--text-muted)] hover:text-[var(--text-secondary)] text-xs flex-shrink-0 transition-colors"
          >
            ✕
          </button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* FilterPanel — hidden on mobile, shown via overlay */}
        <div className="hidden sm:flex flex-shrink-0">
          <FilterPanel
            activeCategories={activeCategories}
            setActiveCategories={setActiveCategories}
            activeRelTypes={activeRelTypes}
            setActiveRelTypes={setActiveRelTypes}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        </div>

        <div className="flex-1 relative overflow-hidden">
          {/* Compare toggle button — top-left */}
          {viewMode !== "3d" && (
            <div
              className="absolute top-3 left-3 z-10 flex items-center rounded-md overflow-hidden"
              style={{ border: "1px solid var(--border)", background: "var(--surface)" }}
            >
              <button
                onClick={() => {
                  const entering = !compareMode;
                  setCompareMode(entering);
                  if (!entering) {
                    setComparisonTools(null);
                    setSelectedTool(null);
                  }
                }}
                className="px-2.5 py-1 text-[10px] font-medium transition-colors flex items-center gap-1.5"
                style={{
                  background: compareMode ? "#7c6bff22" : "transparent",
                  color: compareMode ? "#7c6bff" : "var(--text-muted)",
                }}
              >
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
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
                Compare
              </button>
            </div>
          )}

          {/* View mode toggle — top-right */}
          <div
            data-tour="view-toggle"
            className="absolute top-3 right-3 z-10 flex rounded-md overflow-hidden"
            style={{ border: "1px solid var(--border)", background: "var(--surface)" }}
          >
            {(["grid", "layers", "3d"] as const)
              .filter((m) => !isMobile || m !== "3d")
              .map((mode, i) => (
                <button
                  key={mode}
                  onClick={() => {
                    setViewMode(mode);
                    if (mode === "3d" && compareMode) {
                      setCompareMode(false);
                      setComparisonTools(null);
                      setSelectedTool(null);
                    }
                  }}
                  className="px-2.5 py-1 text-[10px] font-medium transition-colors"
                  style={{
                    background: viewMode === mode ? "#7c6bff22" : "transparent",
                    color: viewMode === mode ? "#7c6bff" : "var(--text-muted)",
                    borderLeft: i > 0 ? "1px solid var(--border)" : undefined,
                  }}
                >
                  {mode === "grid" ? "Grid" : mode === "layers" ? "Layers" : "3D"}
                </button>
              ))}
          </div>

          {/* Mobile: selected tool mini-banner */}
          {isMobile && selectedTool && panelMode === "detail" && (
            <div
              className="absolute left-3 right-3 z-20 flex items-center justify-between rounded-xl px-4 py-3"
              style={{
                bottom: "calc(5rem + env(safe-area-inset-bottom, 0px))",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                backdropFilter: "blur(8px)",
              }}
            >
              <div className="min-w-0 mr-3">
                <div
                  className="text-sm font-semibold truncate"
                  style={{ color: "var(--text-primary)" }}
                >
                  {selectedTool.name}
                </div>
                <div className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                  {selectedTool.tagline}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => setMobileDetailOpen(true)}
                  className="text-xs px-3 py-1.5 rounded-lg"
                  style={{ background: "#7c6bff", color: "#fff" }}
                >
                  Details →
                </button>
                <button
                  onClick={() => setSelectedTool(null)}
                  className="text-xs w-6 h-6 flex items-center justify-center rounded-full"
                  style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Mobile: floating filter button */}
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="sm:hidden absolute left-3 z-20 flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
            style={{
              bottom: "calc(1rem + env(safe-area-inset-bottom, 0px))",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
            }}
          >
            ⊞ Filter
            {activeCategories.size < allCategories.size && (
              <span
                style={{
                  background: "#7c6bff",
                  color: "#fff",
                  borderRadius: 10,
                  padding: "0 5px",
                  fontSize: 10,
                }}
              >
                {allCategories.size - activeCategories.size}
              </span>
            )}
          </button>

          {viewMode === "3d" ? (
            <Graph3DErrorBoundary>
              <ExploreGraph3D
                tools={tools}
                relationships={activeRelationships}
                activeCategories={activeCategories}
                activeRelTypes={activeRelTypes}
                searchQuery={searchQuery}
                selectedTool={selectedTool}
                onSelectTool={handleNodeSelect}
                onWebGLUnavailable={() => setViewMode("grid")}
              />
            </Graph3DErrorBoundary>
          ) : (
            <ReactFlowProvider key={viewMode}>
              <ExploreGraphInner
                tools={tools}
                relationships={activeRelationships}
                activeCategories={activeCategories}
                activeRelTypes={activeRelTypes}
                searchQuery={searchQuery}
                highlightedIds={highlightedIds}
                onSelectTool={handleNodeSelect}
                viewMode={viewMode}
                onSuggest={openSuggest}
              />
            </ReactFlowProvider>
          )}
        </div>

        {/* Right panel — hidden on mobile */}
        <div className="hidden sm:flex flex-shrink-0">
          {panelMode === "compare" && comparisonTools ? (
            <ComparisonPanel
              toolA={comparisonTools[0]}
              toolB={comparisonTools[1]}
              onClose={() => {
                setComparisonTools(null);
                setCompareMode(false);
              }}
              onSwap={() => setComparisonTools([comparisonTools[1], comparisonTools[0]])}
            />
          ) : panelMode === "detail" ? (
            <DetailPanel tool={selectedTool} onClose={() => setSelectedTool(null)} />
          ) : panelMode === "compare-hint" ? (
            <div
              className="w-72 flex-shrink-0 border-l flex flex-col items-center justify-center gap-3 p-6 text-center"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}
            >
              {selectedTool ? (
                <>
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ background: getCategoryColor(selectedTool.category) }}
                  />
                  <p className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                    {selectedTool.name}
                  </p>
                  <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                    Now click a second tool to compare
                  </p>
                </>
              ) : (
                <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                  Click two tools on the graph to compare them
                </p>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* Mobile: tool detail bottom sheet */}
      <ToolDetailSheet
        tool={selectedTool}
        open={mobileDetailOpen}
        onClose={() => setMobileDetailOpen(false)}
      />

      {/* Mobile: filter bottom sheet */}
      <BottomSheet
        open={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        title="Filter"
        snapPoints={[70, 92]}
      >
        <FilterPanel
          activeCategories={activeCategories}
          setActiveCategories={setActiveCategories}
          activeRelTypes={activeRelTypes}
          setActiveRelTypes={setActiveRelTypes}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
        <div className="px-4 pb-4 pt-2">
          <button
            className="w-full py-2.5 rounded-lg text-sm font-semibold"
            style={{ background: "#7c6bff", color: "#fff" }}
            onClick={() => setMobileFilterOpen(false)}
          >
            Show results
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}
