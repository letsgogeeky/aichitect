"use client";

import { useMemo, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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

import stacksData from "@/data/stacks.json";
import toolsData from "@/data/tools.json";
import { Stack, Tool, getCategoryColor } from "@/lib/types";
import { applyDagreLayout } from "@/lib/graph";
import ToolNode from "@/components/graph/ToolNode";
import ComparisonPanel from "@/components/panels/ComparisonPanel";

const stacks = stacksData as Stack[];
const allTools = toolsData as Tool[];
const nodeTypes: NodeTypes = { tool: ToolNode };

const COMPLEXITY_META = {
  beginner: { label: "Beginner", color: "#26de81" },
  intermediate: { label: "Intermediate", color: "#fdcb6e" },
  advanced: { label: "Advanced", color: "#ff6b6b" },
} as const;

function StackGraph({ stack }: { stack: Stack }) {
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
    const color = sourceTool ? getCategoryColor(sourceTool.category) : "#7c6bff";
    return {
      id: `flow-${i}`,
      source: f.from,
      target: f.to,
      label: f.label,
      labelStyle: { fill: "#8888aa", fontSize: 10 },
      labelBgStyle: { fill: "#0e0e18", fillOpacity: 0.9 },
      style: { stroke: color, strokeWidth: 1.5 },
      animated: true,
    };
  });

  const laidOut = applyDagreLayout(nodes, edges, "LR", 280, 130);

  return (
    <ReactFlow
      nodes={laidOut}
      edges={edges}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.25, duration: 300 }}
      proOptions={{ hideAttribution: true }}
      minZoom={0.2}
    >
      <Background variant={BackgroundVariant.Dots} color="#1e1e2e" gap={20} size={1} />
      <Controls showInteractive={false} />
    </ReactFlow>
  );
}

function StacksContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stackId = searchParams.get("stack");
  const selected = stacks.find((s) => s.id === stackId) ?? stacks[0];

  const activeTag = searchParams.get("tag") ?? "All";

  const [compareA, setCompareA] = useState<Tool | null>(null);
  const [compareB, setCompareB] = useState<Tool | null>(null);

  function selectStack(s: Stack) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("stack", s.id);
    router.push(`?${params.toString()}`, { scroll: false });
    // Clear comparison when switching stacks
    setCompareA(null);
    setCompareB(null);
  }

  function selectTag(tag: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (tag === "All") params.delete("tag");
    else params.set("tag", tag);
    router.push(`?${params.toString()}`, { scroll: false });
  }

  function handleCompareClick(tool: Tool) {
    // Already showing comparison — replace slot B
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

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    stacks.forEach((s) => s.tags?.forEach((t) => tags.add(t)));
    return ["All", ...Array.from(tags)];
  }, []);

  const filtered = activeTag === "All" ? stacks : stacks.filter((s) => s.tags?.includes(activeTag));

  const builderUrl = `/builder?s=${selected.tools.join(",")}`;

  const complexity = selected.complexity ? COMPLEXITY_META[selected.complexity] : null;

  const selectedTools = selected.tools
    .map((id) => allTools.find((t) => t.id === id))
    .filter(Boolean) as Tool[];

  const accentColor = selectedTools[0] ? getCategoryColor(selectedTools[0].category) : "#7c6bff";

  return (
    <div className="flex h-full">
      {/* ── Sidebar ── */}
      <aside
        className="flex flex-col flex-shrink-0 border-r overflow-hidden"
        style={{ width: 288, background: "var(--surface)", borderColor: "var(--border)" }}
      >
        {/* Sidebar header */}
        <div
          className="flex-shrink-0 px-4 pt-4 pb-3 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[12px] font-semibold text-[var(--text-primary)] tracking-wide uppercase">
              Stacks
            </span>
            <span
              className="text-[11px] px-1.5 py-0.5 rounded"
              style={{ background: "#7c6bff18", color: "#7c6bff", border: "1px solid #7c6bff33" }}
            >
              {stacks.length} curated
            </span>
          </div>

          {/* Tag filters */}
          <div className="flex flex-wrap gap-1">
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => selectTag(tag)}
                className="text-[11px] px-2 py-0.5 rounded-full transition-colors"
                style={{
                  background: activeTag === tag ? "#7c6bff" : "#1c1c28",
                  color: activeTag === tag ? "#fff" : "#6666aa",
                  border: `1px solid ${activeTag === tag ? "#7c6bff" : "#2a2a3a"}`,
                }}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Stack list */}
        <div className="flex-1 overflow-y-auto py-2">
          {filtered.map((s) => {
            const isSelected = selected.id === s.id;
            const firstTool = allTools.find((t) => t.id === s.tools[0]);
            const color = firstTool ? getCategoryColor(firstTool.category) : "#7c6bff";
            const cx = s.complexity ? COMPLEXITY_META[s.complexity] : null;
            const stackTools = s.tools
              .map((id) => allTools.find((t) => t.id === id))
              .filter(Boolean) as Tool[];

            return (
              <button
                key={s.id}
                onClick={() => selectStack(s)}
                className="w-full text-left px-3 py-3 transition-all"
                style={{
                  borderLeft: `3px solid ${isSelected ? color : "transparent"}`,
                  background: isSelected ? color + "10" : "transparent",
                }}
              >
                {/* Name */}
                <div
                  className="text-[13px] font-semibold leading-snug mb-1"
                  style={{ color: isSelected ? color : "var(--text-primary)" }}
                >
                  {s.name}
                </div>

                {/* Target */}
                <div
                  className="text-[11px] leading-snug mb-2.5"
                  style={{ color: "var(--text-muted)" }}
                >
                  {s.target}
                </div>

                {/* Bottom row: complexity + tool dots */}
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
                  {/* Tool category dots */}
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

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Stack detail header */}
        <div
          className="flex-shrink-0 border-b"
          style={{
            borderColor: "var(--border)",
            background: "var(--surface-2)",
            padding: "20px 24px 16px",
          }}
        >
          {/* Top row: name + CTA */}
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex-1 min-w-0">
              <h2
                className="text-base font-bold leading-tight mb-1"
                style={{ color: "var(--text-primary)" }}
              >
                {selected.name}
              </h2>
              <p className="text-[12px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {selected.description}
              </p>
            </div>

            <Link
              href={builderUrl}
              className="flex items-center gap-1.5 flex-shrink-0 transition-all"
              style={{
                padding: "0 14px",
                height: 32,
                borderRadius: 7,
                background: accentColor + "20",
                border: `1px solid ${accentColor}44`,
                color: accentColor,
                fontSize: 12,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Try in Builder →
            </Link>
          </div>

          {/* Badges row */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {complexity && (
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide"
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
                className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                style={{
                  background: "#1c1c28",
                  border: "1px solid #2a2a3a",
                  color: "#6666aa",
                }}
              >
                {selected.monthly_cost}/mo
              </span>
            )}
            {selected.tags?.map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-2 py-0.5 rounded-full"
                style={{
                  background: "#1c1c28",
                  border: "1px solid #2a2a3a",
                  color: "#555577",
                }}
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Why + Tradeoffs */}
          <div
            className="grid gap-2 mb-3"
            style={{ gridTemplateColumns: selected.tradeoffs ? "1fr 1fr" : "1fr" }}
          >
            {selected.why && (
              <div
                className="rounded-lg px-3 py-2"
                style={{ background: "#7c6bff0a", border: "1px solid #7c6bff1a" }}
              >
                <div
                  className="text-[9px] font-bold uppercase tracking-widest mb-1"
                  style={{ color: "#7c6bff88" }}
                >
                  Why this stack
                </div>
                <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
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
                  className="text-[9px] font-bold uppercase tracking-widest mb-1"
                  style={{ color: "#ff6b6b88" }}
                >
                  Tradeoff
                </div>
                <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  {selected.tradeoffs}
                </p>
              </div>
            )}
          </div>

          {/* Tool chips — each gets a compare trigger on hover */}
          <div className="flex flex-wrap gap-1.5 items-center">
            {selectedTools.map((t) => {
              const c = getCategoryColor(t.category);
              const isCompareA = compareA?.id === t.id;
              const isCompareB = compareB?.id === t.id;
              const isCompared = isCompareA || isCompareB;
              return (
                <div key={t.id} className="relative group/chip inline-flex">
                  <span
                    className="text-[11px] font-medium px-2.5 py-0.5 rounded-full transition-all"
                    style={{
                      background: isCompared ? c + "30" : c + "18",
                      border: isCompared ? `1px solid ${c}66` : `1px solid ${c}33`,
                      color: c,
                    }}
                  >
                    {t.name}
                  </span>
                  {/* Compare button — appears on hover or when staged */}
                  <button
                    onClick={() => handleCompareClick(t)}
                    title={isCompareA ? `${t.name} staged — pick one more` : `Compare ${t.name}`}
                    className={`absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center transition-all ${isCompared ? "opacity-100" : "opacity-0 group-hover/chip:opacity-100"}`}
                    style={{
                      background: isCompared ? "#7c6bff" : "#0e0e18",
                      border: `1px solid ${isCompared ? "#7c6bff" : "var(--border)"}`,
                      color: isCompared ? "#fff" : "var(--text-muted)",
                    }}
                  >
                    <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
                      <rect
                        x="0.5"
                        y="0.5"
                        width="4"
                        height="11"
                        rx="1"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                      <rect
                        x="7.5"
                        y="0.5"
                        width="4"
                        height="11"
                        rx="1"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                    </svg>
                  </button>
                </div>
              );
            })}

            {/* Compare hint when A is staged */}
            {compareA && !compareB && (
              <div
                className="flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full ml-1"
                style={{ background: "#7c6bff14", border: "1px solid #7c6bff33", color: "#7c6bff" }}
              >
                <span className="font-medium">{compareA.name}</span>
                <span className="text-[#7c6bff66]">· pick one more</span>
                <button
                  onClick={() => setCompareA(null)}
                  className="text-[#7c6bff88] hover:text-[#7c6bff] transition-colors leading-none"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Graph */}
        <div className="flex-1 overflow-hidden">
          <ReactFlowProvider key={selected.id}>
            <StackGraph stack={selected} />
          </ReactFlowProvider>
        </div>
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

export default function StacksPage() {
  return (
    <Suspense>
      <StacksContent />
    </Suspense>
  );
}
