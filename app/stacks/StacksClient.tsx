"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useIsMobile } from "@/hooks/useIsMobile";
import BottomSheet from "@/components/mobile/BottomSheet";
import Link from "next/link";
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

import { Stack, Tool, getCategoryColor, STACK_CLUSTERS, StackCluster } from "@/lib/types";
import { applyDagreLayout } from "@/lib/graph";
import ToolNode from "@/components/graph/ToolNode";
import ComparisonPanel from "@/components/panels/ComparisonPanel";
import { COMPLEXITY_META } from "./stacksConstants";
import { StackSidebar } from "./components/StackSidebar";
import { StackDetailHeader } from "./components/StackDetailHeader";
const nodeTypes: NodeTypes = { tool: ToolNode };

function StackGraph({ stack, allTools }: { stack: Stack; allTools: Tool[] }) {
  const nodes: Node[] = stack.tools
    .map((id) => allTools.find((t) => t.id === id))
    .filter(Boolean)
    .map((t) => ({
      id: t!.id,
      type: "tool",
      data: { ...t!, expanded: true },
      position: { x: 0, y: 0 },
    }));

  const edges: Edge[] = stack.flow.map((f, i) => {
    const sourceTool = allTools.find((t) => t.id === f.from);
    const color = sourceTool ? getCategoryColor(sourceTool.category) : "var(--accent)";
    return {
      id: `flow-${i}`,
      source: f.from,
      target: f.to,
      label: f.label,
      labelStyle: { fill: "#8888aa", fontSize: 10 },
      labelBgStyle: { fill: "var(--surface)", fillOpacity: 0.9 },
      style: { stroke: color, strokeWidth: 1.5 },
      animated: true,
    };
  });

  // nodeHeight=260 matches the actual rendered height of expanded ToolNode cards.
  // Giving dagre the true height prevents vertical overlap between rows.
  const laidOut = applyDagreLayout(nodes, edges, "LR", 280, 260);

  return (
    <ReactFlow
      nodes={laidOut}
      edges={edges}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.25, duration: 300 }}
      proOptions={{ hideAttribution: true }}
      minZoom={0.2}
      nodesDraggable
    >
      <Background variant={BackgroundVariant.Dots} color="#1e1e2e" gap={20} size={1} />
      <Controls showInteractive={false} />
    </ReactFlow>
  );
}

function StacksContent({ stacks, allTools }: { stacks: Stack[]; allTools: Tool[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stackId = searchParams.get("stack");
  const clusterParam = (searchParams.get("cluster") as StackCluster) ?? "build";

  // Find by stack ID first — cluster is derivable from the stack itself
  const requestedStack = stackId ? stacks.find((s) => s.id === stackId) : null;
  const activeCluster = requestedStack?.cluster ?? clusterParam;
  const clusterStacks = stacks.filter((s) => s.cluster === activeCluster);
  const selected = requestedStack ?? clusterStacks[0] ?? stacks[0];

  const [compareA, setCompareA] = useState<Tool | null>(null);
  const [compareB, setCompareB] = useState<Tool | null>(null);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const isMobile = useIsMobile();

  function selectCluster(cluster: StackCluster) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("cluster", cluster);
    params.delete("stack");
    router.push(`?${params.toString()}`, { scroll: false });
    setCompareA(null);
    setCompareB(null);
  }

  function selectStack(s: Stack) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("stack", s.id);
    params.delete("cluster"); // cluster is derived from the stack
    router.push(`?${params.toString()}`, { scroll: false });
    setCompareA(null);
    setCompareB(null);
  }

  function handleAddToStack(tool: Tool) {
    const currentS = searchParams.get("s") ?? "";
    const stackIds = currentS.split(",").filter(Boolean);
    const inStack = stackIds.includes(tool.id);
    const next = inStack ? stackIds.filter((id) => id !== tool.id) : [...stackIds, tool.id];
    const params = new URLSearchParams(searchParams.toString());
    if (next.length > 0) params.set("s", next.join(","));
    else params.delete("s");
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  function handleCompareClick(tool: Tool) {
    if (compareA && compareB) {
      if (tool.id === compareA.id || tool.id === compareB.id) {
        setCompareA(null);
        setCompareB(null);
      } else {
        setCompareB(tool);
      }
      return;
    }
    if (!compareA) {
      setCompareA(tool);
      return;
    }
    if (compareA.id === tool.id) {
      setCompareA(null);
      return;
    }
    setCompareB(tool);
  }

  const builderUrl = `/builder?s=${selected.tools.join(",")}`;
  const complexity = selected.complexity ? COMPLEXITY_META[selected.complexity] : null;
  const selectedTools = selected.tools
    .map((id) => allTools.find((t) => t.id === id))
    .filter(Boolean) as Tool[];
  const accentColor = selectedTools[0]
    ? getCategoryColor(selectedTools[0].category)
    : "var(--accent)";

  return (
    <div className="flex h-full">
      <StackSidebar
        stacks={stacks}
        allTools={allTools}
        activeCluster={activeCluster}
        selectedId={selected.id}
        onSelectCluster={selectCluster}
        onSelectStack={selectStack}
      />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Mobile: horizontal pill selector */}
        <div
          className="sm:hidden flex-shrink-0 border-b"
          style={{ borderColor: "var(--border)", background: "var(--surface)" }}
        >
          <div className="flex gap-2 overflow-x-auto px-3 py-2 no-scrollbar">
            {stacks.map((s) => {
              const isSelected = selected.id === s.id;
              const ft = allTools.find((t) => t.id === s.tools[0]);
              const c = ft ? getCategoryColor(ft.category) : "var(--accent)";
              return (
                <button
                  key={s.id}
                  onClick={() => selectStack(s)}
                  className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold"
                  style={{
                    background: isSelected ? c + "30" : "var(--surface-2)",
                    border: `1px solid ${isSelected ? c + "66" : "var(--border)"}`,
                    color: isSelected ? c : "var(--text-muted)",
                  }}
                >
                  {s.name}
                </button>
              );
            })}
          </div>
          <div className="flex items-center justify-between px-3 pb-2">
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              {selected.target}
            </span>
            <button
              onClick={() => setMobileDetailOpen(true)}
              className="text-xs px-2.5 py-1 rounded-lg flex-shrink-0"
              style={{
                background: accentColor + "20",
                border: `1px solid ${accentColor}44`,
                color: accentColor,
              }}
            >
              Details ↑
            </button>
          </div>
        </div>

        <StackDetailHeader
          selected={selected}
          allTools={allTools}
          stacks={stacks}
          compareA={compareA}
          compareB={compareB}
          searchParams={searchParams as unknown as URLSearchParams}
          builderUrl={builderUrl}
          onSelectCluster={selectCluster}
          onSelectStack={selectStack}
          onAddToStack={handleAddToStack}
          onCompareClick={handleCompareClick}
          onClearCompare={() => setCompareA(null)}
        />

        {/* Graph */}
        <div data-tour="stacks-graph" className="flex-1 overflow-hidden">
          <ReactFlowProvider key={selected.id}>
            <StackGraph stack={selected} allTools={allTools} />
          </ReactFlowProvider>
        </div>
      </div>

      {!isMobile && compareA && compareB && (
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

      {/* Mobile: stack detail bottom sheet */}
      <BottomSheet
        open={mobileDetailOpen}
        onClose={() => setMobileDetailOpen(false)}
        title={selected.name}
        snapPoints={[55, 92]}
      >
        <div className="px-4 pt-2 pb-6 space-y-3">
          {selected.mission && (
            <div
              className="rounded-lg px-3 py-2.5"
              style={{ background: accentColor + "0a", border: `1px solid ${accentColor}22` }}
            >
              <div
                className="text-[10px] font-bold uppercase tracking-widest mb-1"
                style={{ color: accentColor + "99" }}
              >
                The Situation
              </div>
              <p
                className="text-xs leading-relaxed font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                {selected.mission}
              </p>
            </div>
          )}
          <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {selected.description}
          </p>
          <div className="flex flex-wrap gap-2">
            {complexity && (
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase"
                style={{
                  background: complexity.color + "18",
                  border: `1px solid ${complexity.color}44`,
                  color: complexity.color,
                }}
              >
                {complexity.label}
              </span>
            )}
            {selected.monthly_cost && (
              <span
                className="text-[10px] px-2 py-0.5 rounded-full"
                style={{
                  background: "var(--btn)",
                  border: "1px solid var(--btn-border)",
                  color: "#6666aa",
                }}
              >
                {selected.monthly_cost}/mo
              </span>
            )}
          </div>
          {selected.why && (
            <div
              className="rounded-lg px-3 py-2"
              style={{ background: "#7c6bff0a", border: "1px solid #7c6bff1a" }}
            >
              <div
                className="text-[10px] font-bold uppercase tracking-widest mb-1"
                style={{ color: "#7c6bff88" }}
              >
                Why this stack
              </div>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                {selected.why}
              </p>
            </div>
          )}
          {selected.tradeoffs && (
            <div
              className="rounded-lg px-3 py-2"
              style={{ background: "#ff6b6b08", border: "1px solid #ff6b6b1a" }}
            >
              <div
                className="text-[10px] font-bold uppercase tracking-widest mb-1"
                style={{ color: "#ff6b6b88" }}
              >
                Tradeoff
              </div>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                {selected.tradeoffs}
              </p>
            </div>
          )}
          <Link
            href={builderUrl}
            className="flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold"
            style={{
              background: accentColor + "20",
              border: `1px solid ${accentColor}44`,
              color: accentColor,
              textDecoration: "none",
            }}
          >
            Try in Builder →
          </Link>
        </div>
      </BottomSheet>
    </div>
  );
}

export default function StacksClient({ stacks, tools }: { stacks: Stack[]; tools: Tool[] }) {
  return (
    <Suspense>
      <StacksContent stacks={stacks} allTools={tools} />
    </Suspense>
  );
}
