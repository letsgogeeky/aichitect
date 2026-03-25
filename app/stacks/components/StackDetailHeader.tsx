"use client";

import { useState } from "react";
import Link from "next/link";
import { Stack, Tool, StackCluster, getCategoryColor } from "@/lib/types";
import { COMPLEXITY_META } from "../stacksConstants";
import { CloseButton } from "@/components/ui/CloseButton";
import { ProductionUsageSection } from "@/components/ui/ProductionUsageSection";

export function StackDetailHeader({
  selected,
  allTools,
  stacks,
  compareA,
  compareB,
  searchParams,
  builderUrl,
  onSelectCluster,
  onSelectStack,
  onAddToStack,
  onCompareClick,
  onClearCompare,
}: {
  selected: Stack;
  allTools: Tool[];
  stacks: Stack[];
  compareA: Tool | null;
  compareB: Tool | null;
  searchParams: URLSearchParams;
  builderUrl: string;
  onSelectCluster: (cluster: StackCluster) => void;
  onSelectStack: (s: Stack) => void;
  onAddToStack: (tool: Tool) => void;
  onCompareClick: (tool: Tool) => void;
  onClearCompare: () => void;
}) {
  const [killOpen, setKillOpen] = useState(false);

  const selectedTools = selected.tools
    .map((id) => allTools.find((t) => t.id === id))
    .filter(Boolean) as Tool[];
  const accentColor = selectedTools[0]
    ? getCategoryColor(selectedTools[0].category)
    : "var(--accent)";
  const complexity = selected.complexity ? COMPLEXITY_META[selected.complexity] : null;
  const graduatesTo = selected.graduates_to
    ? stacks.find((s) => s.id === selected.graduates_to)
    : null;
  const notInStackTools = (selected.not_in_stack ?? []).map((entry) => ({
    ...entry,
    tool: allTools.find((t) => t.id === entry.tool),
  }));

  return (
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

      {/* Top row: name + CTAs */}
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
        <div className="flex items-center gap-2 flex-shrink-0">
          <ProductionUsageSection stackId={selected.id} />
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
              background: "var(--btn)",
              border: "1px solid var(--btn-border)",
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
              background: "var(--btn)",
              border: "1px solid var(--btn-border)",
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
                  <span className="text-[11px] leading-snug" style={{ color: "var(--text-muted)" }}>
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
                    onSelectCluster(graduatesTo.cluster);
                    onSelectStack(graduatesTo);
                  }}
                  className="flex items-center gap-1.5 text-[11px] font-medium transition-colors hover:opacity-100"
                  style={{ color: "var(--warning)", opacity: 0.8 }}
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
                onClick={() => onAddToStack(t)}
                title={inStack ? `Remove ${t.name} from My Stack` : `Add ${t.name} to My Stack`}
                className={`absolute -top-1 -left-1 w-4 h-4 rounded-full flex items-center justify-center transition-all ${inStack ? "opacity-100" : "opacity-0 group-hover/chip:opacity-100"}`}
                style={{
                  background: inStack ? "var(--accent-2)" : "var(--surface)",
                  border: `1px solid ${inStack ? "var(--accent-2)" : "var(--border)"}`,
                  color: inStack ? "#0a0a0f" : "var(--text-muted)",
                  fontSize: 9,
                  fontWeight: 700,
                }}
              >
                {inStack ? "✓" : "+"}
              </button>
              <button
                onClick={() => onCompareClick(t)}
                title={isCompareA ? `${t.name} staged — pick one more` : `Compare ${t.name}`}
                className={`absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center transition-all ${isCompared ? "opacity-100" : "opacity-0 group-hover/chip:opacity-100"}`}
                style={{
                  background: isCompared ? "var(--accent)" : "var(--surface)",
                  border: `1px solid ${isCompared ? "var(--accent)" : "var(--border)"}`,
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
            style={{
              background: "#7c6bff14",
              border: "1px solid #7c6bff33",
              color: "var(--accent)",
            }}
          >
            <span className="font-medium">{compareA.name}</span>
            <span className="text-[#7c6bff66]">· pick one more</span>
            <CloseButton onClick={onClearCompare} variant="accent" className="leading-none" />
          </div>
        )}
      </div>
    </div>
  );
}
