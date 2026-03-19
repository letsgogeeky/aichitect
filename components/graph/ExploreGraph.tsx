"use client";

import { useCallback, useMemo, useState } from "react";
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
import { Tool, Relationship, RelationshipType, getCategoryColor, STACK_LAYERS, CategoryId } from "@/lib/types";
import { gridLayout, swimlaneLayout } from "@/lib/graph";
import ToolNode from "./ToolNode";
import LaneLabel from "./LaneLabel";
const ExploreGraph3D = dynamic(() => import("./ExploreGraph3D"), { ssr: false });
import FilterPanel from "@/components/panels/FilterPanel";
import DetailPanel from "@/components/panels/DetailPanel";

const tools = toolsData as Tool[];
const relationships = relationshipsData as Relationship[];

const nodeTypes: NodeTypes = { tool: ToolNode, laneLabel: LaneLabel };

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
  if (type === "commonly-paired") {
    return { stroke: "#4a4a7a", strokeWidth: 1.5, strokeDasharray: "5,4" };
  }
  return { stroke: "#3a3a4a", strokeWidth: 1, strokeDasharray: "2,4" };
}

interface ExploreGraphInnerProps {
  activeCategories: Set<string>;
  activeRelTypes: Set<RelationshipType>;
  searchQuery: string;
  selectedTool: Tool | null;
  onSelectTool: (tool: Tool | null) => void;
  viewMode: "grid" | "layers";
}

function ExploreGraphInner({
  activeCategories,
  activeRelTypes,
  searchQuery,
  selectedTool,
  onSelectTool,
  viewMode,
}: ExploreGraphInnerProps) {
  useReactFlow();

  const visibleTools = useMemo(
    () => tools.filter((t) => activeCategories.has(t.category)),
    [activeCategories]
  );

  const searchMatch = useMemo(() => {
    if (!searchQuery) return null;
    const q = searchQuery.toLowerCase();
    return new Set(
      tools
        .filter(
          (t) =>
            t.name.toLowerCase().includes(q) ||
            t.tagline.toLowerCase().includes(q)
        )
        .map((t) => t.id)
    );
  }, [searchQuery]);

  const nodes: Node[] = useMemo(() => {
    const toolNodeInputs = visibleTools.map((t) => ({
      id: t.id,
      type: "tool",
      data: {
        ...t,
        dimmed: searchMatch != null && !searchMatch.has(t.id),
        highlighted: selectedTool?.id === t.id,
        expanded: selectedTool?.id === t.id,
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
      5,   // cols
      220, // nodeWidth
      90,  // nodeHeight
      24,  // gap
      52,  // laneGap
      40,  // headerHeight
      20,  // padH
      14   // padV
    );

    // laneNodes first so they render behind tool nodes
    return [...laneNodes, ...toolNodes];
  }, [visibleTools, searchMatch, selectedTool, viewMode]);

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
        const style = edgeStyle(
          r.type as RelationshipType,
          sourceTool?.category ?? ""
        );
        return {
          id: `${r.source}-${r.target}`,
          source: r.source,
          target: r.target,
          animated: r.type === "integrates-with",
          style,
        };
      });
  }, [visibleTools, activeRelTypes]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const tool = tools.find((t) => t.id === node.id) ?? null;
      onSelectTool(tool?.id === selectedTool?.id ? null : tool);
    },
    [selectedTool, onSelectTool]
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodeClick={onNodeClick}
      fitView
      fitViewOptions={FIT_VIEW_OPTIONS}
      minZoom={0.15}
      maxZoom={2}
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
  );
}

export default function ExploreGraph() {
  const allCategories = useMemo(
    () => new Set(tools.map((t) => t.category)),
    []
  );

  const [activeCategories, setActiveCategories] = useState<Set<string>>(allCategories);
  const [activeRelTypes, setActiveRelTypes] = useState<Set<RelationshipType>>(
    new Set(["integrates-with", "commonly-paired", "competes-with"])
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "layers" | "3d">("grid");

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Intent banner */}
      {!bannerDismissed && (
        <div
          className="flex items-center justify-between px-4 py-2 flex-shrink-0 border-b"
          style={{ background: "#0d0d1a", borderColor: "var(--border)" }}
        >
          <p className="text-xs text-[var(--text-secondary)]">
            <span className="text-[var(--text-primary)] font-medium">
              AI tools are all over the place.
            </span>{" "}
            This is the full landscape — {tools.length} tools across {allCategories.size} categories, mapped and connected.
            Ready to narrow it down?{" "}
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
        <FilterPanel
          activeCategories={activeCategories}
          setActiveCategories={setActiveCategories}
          activeRelTypes={activeRelTypes}
          setActiveRelTypes={setActiveRelTypes}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        <div className="flex-1 relative">
          {/* View mode toggle */}
          <div
            className="absolute top-3 right-3 z-10 flex rounded-md overflow-hidden"
            style={{ border: "1px solid var(--border)", background: "var(--surface)" }}
          >
            {(["grid", "layers", "3d"] as const).map((mode, i) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
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

          {viewMode === "3d" ? (
            <ExploreGraph3D
              activeCategories={activeCategories}
              activeRelTypes={activeRelTypes}
              searchQuery={searchQuery}
              selectedTool={selectedTool}
              onSelectTool={setSelectedTool}
            />
          ) : (
            <ReactFlowProvider key={viewMode}>
              <ExploreGraphInner
                activeCategories={activeCategories}
                activeRelTypes={activeRelTypes}
                searchQuery={searchQuery}
                selectedTool={selectedTool}
                onSelectTool={setSelectedTool}
                viewMode={viewMode}
              />
            </ReactFlowProvider>
          )}
        </div>

        <DetailPanel tool={selectedTool} onClose={() => setSelectedTool(null)} />
      </div>
    </div>
  );
}
