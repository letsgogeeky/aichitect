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

import stacksData from "@/data/stacks.json";
import toolsData from "@/data/tools.json";
import { Stack, Tool, getCategoryColor, STACK_CLUSTERS, StackCluster } from "@/lib/types";
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
  const activeCluster = (searchParams.get("cluster") as StackCluster) ?? "build";

  const clusterStacks = stacks.filter((s) => s.cluster === activeCluster);
  const selected =
    stacks.find((s) => s.id === stackId && s.cluster === activeCluster) ??
    clusterStacks[0] ??
    stacks[0];

  const [compareA, setCompareA] = useState<Tool | null>(null);
  const [compareB, setCompareB] = useState<Tool | null>(null);
  const [killOpen, setKillOpen] = useState(false);
  const [mobilePickerOpen, setMobilePickerOpen] = useState(false);
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
    router.push(`?${params.toString()}`, { scroll: false });
    setCompareA(null);
    setCompareB(null);
    setKillOpen(false);
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
  const accentColor = selectedTools[0] ? getCategoryColor(selectedTools[0].category) : "#7c6bff";

  const graduatesTo = selected.graduates_to
    ? stacks.find((s) => s.id === selected.graduates_to)
    : null;

  const notInStackTools = (selected.not_in_stack ?? []).map((entry) => ({
    ...entry,
    tool: allTools.find((t) => t.id === entry.tool),
  }));

  return (
    <div className="flex h-full">
      {/* ── Sidebar — hidden on mobile ── */}
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
                  onClick={() => selectCluster(cluster.id)}
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

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Mobile: horizontal pill selector */}
        {isMobile && (
          <div
            className="flex-shrink-0 border-b"
            style={{ borderColor: "var(--border)", background: "var(--surface)" }}
          >
            <div className="flex gap-2 overflow-x-auto px-3 py-2 no-scrollbar">
              {stacks.map((s) => {
                const isSelected = selected.id === s.id;
                const ft = allTools.find((t) => t.id === s.tools[0]);
                const c = ft ? getCategoryColor(ft.category) : "#7c6bff";
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
            {/* Selected stack info bar */}
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
        )}

        {/* Stack detail header — hidden on mobile (shown via bottom sheet) */}
        <div
          className="hidden sm:block flex-shrink-0 border-b overflow-y-auto"
          style={{
            borderColor: "var(--border)",
            background: "var(--surface-2)",
            padding: "20px 24px 16px",
            maxHeight: "55%",
          }}
        >
          {/* Mission Brief */}
          {selected.mission && (
            <div
              className="rounded-lg px-3 py-2.5 mb-3"
              style={{ background: accentColor + "0a", border: `1px solid ${accentColor}22` }}
            >
              <div
                className="text-[9px] font-bold uppercase tracking-widest mb-1"
                style={{ color: accentColor + "99" }}
              >
                The Situation
              </div>
              <p
                className="text-[12px] leading-relaxed font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                {selected.mission}
              </p>
            </div>
          )}

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
              data-tour="stacks-builder-cta"
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
                style={{ background: "#1c1c28", border: "1px solid #2a2a3a", color: "#6666aa" }}
              >
                {selected.monthly_cost}/mo
              </span>
            )}
            {selected.tags?.map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-2 py-0.5 rounded-full"
                style={{ background: "#1c1c28", border: "1px solid #2a2a3a", color: "#555577" }}
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

          {/* Not In This Stack */}
          {notInStackTools.length > 0 && (
            <div
              className="rounded-lg px-3 py-2 mb-3"
              style={{ background: "#ff6b6b06", border: "1px solid #ff6b6b18" }}
            >
              <div
                className="text-[9px] font-bold uppercase tracking-widest mb-1.5"
                style={{ color: "#ff6b6b88" }}
              >
                Not in this stack
              </div>
              <div className="flex flex-col gap-1">
                {notInStackTools.map(({ tool, reason }) => {
                  const color = tool ? getCategoryColor(tool.category) : "#555577";
                  return (
                    <div key={reason} className="flex items-baseline gap-2">
                      <span className="text-[10px] flex-shrink-0" style={{ color: "#ff6b6b66" }}>
                        ✗
                      </span>
                      {tool ? (
                        <Link
                          href={`/explore?tool=${tool.id}`}
                          className="text-[11px] font-semibold flex-shrink-0 hover:underline"
                          style={{ color }}
                        >
                          {tool.name}
                        </Link>
                      ) : (
                        <span
                          className="text-[11px] font-semibold flex-shrink-0"
                          style={{ color: "#555577" }}
                        >
                          {reason}
                        </span>
                      )}
                      <span
                        className="text-[11px] leading-snug"
                        style={{ color: "var(--text-muted)" }}
                      >
                        — {reason}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Kill Conditions */}
          {(selected.kill_conditions?.length ?? 0) > 0 && (
            <div className="mb-3">
              <button
                onClick={() => setKillOpen((v) => !v)}
                className="flex items-center gap-2 w-full text-left"
              >
                <div
                  className="text-[9px] font-bold uppercase tracking-widest"
                  style={{ color: "#fdcb6e88" }}
                >
                  When to move on
                </div>
                <span className="text-[9px]" style={{ color: "#fdcb6e66" }}>
                  {killOpen ? "▲" : "▼"}
                </span>
              </button>
              {killOpen && (
                <div
                  className="mt-1.5 rounded-lg px-3 py-2"
                  style={{ background: "#fdcb6e06", border: "1px solid #fdcb6e18" }}
                >
                  <div className="flex flex-col gap-1 mb-2">
                    {selected.kill_conditions!.map((condition, i) => (
                      <div key={i} className="flex items-baseline gap-2">
                        <span className="text-[10px] flex-shrink-0" style={{ color: "#fdcb6e66" }}>
                          •
                        </span>
                        <span
                          className="text-[11px] leading-snug"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {condition}
                        </span>
                      </div>
                    ))}
                  </div>
                  {graduatesTo && (
                    <button
                      onClick={() => {
                        selectCluster(graduatesTo.cluster);
                        selectStack(graduatesTo);
                      }}
                      className="flex items-center gap-1.5 text-[11px] font-medium transition-colors hover:opacity-100"
                      style={{ color: "#fdcb6e", opacity: 0.8 }}
                    >
                      <span>→ Graduate to:</span>
                      <span className="font-semibold">{graduatesTo.name}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tool chips */}
          <div className="flex flex-wrap gap-1.5 items-center">
            {selectedTools.map((t) => {
              const c = getCategoryColor(t.category);
              const isCompareA = compareA?.id === t.id;
              const isCompareB = compareB?.id === t.id;
              const isCompared = isCompareA || isCompareB;
              const currentS = searchParams.get("s") ?? "";
              const stackIds = currentS.split(",").filter(Boolean);
              const inStack = stackIds.includes(t.id);
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
                  <button
                    onClick={() => handleAddToStack(t)}
                    title={inStack ? `Remove ${t.name} from My Stack` : `Add ${t.name} to My Stack`}
                    className={`absolute -top-1 -left-1 w-4 h-4 rounded-full flex items-center justify-center transition-all ${inStack ? "opacity-100" : "opacity-0 group-hover/chip:opacity-100"}`}
                    style={{
                      background: inStack ? "#00d4aa" : "#0e0e18",
                      border: `1px solid ${inStack ? "#00d4aa" : "var(--border)"}`,
                      color: inStack ? "#0a0a0f" : "var(--text-muted)",
                      fontSize: 9,
                      fontWeight: 700,
                    }}
                  >
                    {inStack ? "✓" : "+"}
                  </button>
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
        <div data-tour="stacks-graph" className="flex-1 overflow-hidden">
          <ReactFlowProvider key={selected.id}>
            <StackGraph stack={selected} />
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
                className="text-[9px] font-bold uppercase tracking-widest mb-1"
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
                style={{ background: "#1c1c28", border: "1px solid #2a2a3a", color: "#6666aa" }}
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

      {/* Mobile: stack picker overlay */}
      {mobilePickerOpen && (
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
              onClick={() => setMobilePickerOpen(false)}
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
                    const isSelected = selected.id === s.id;
                    const firstTool = allTools.find((t) => t.id === s.tools[0]);
                    const color = firstTool ? getCategoryColor(firstTool.category) : "#7c6bff";
                    return (
                      <button
                        key={s.id}
                        onClick={() => {
                          selectStack(s);
                          if (s.cluster !== activeCluster) selectCluster(s.cluster);
                          setMobilePickerOpen(false);
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
