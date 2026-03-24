"use client";

import { useState, useMemo } from "react";
import { useGenomeData } from "../GenomeContext";
import { WORKFLOW_GROUPS } from "../genomeConstants";
import { Tool, getCategoryColor } from "@/lib/types";
import { ProgressDots } from "./ProgressDots";

function ToolChip({
  tool,
  active,
  onToggle,
}: {
  tool: Tool;
  active: boolean;
  onToggle: () => void;
}) {
  const color = getCategoryColor(tool.category);
  return (
    <button
      onClick={onToggle}
      style={{
        width: 188,
        padding: "10px 12px",
        borderRadius: 10,
        background: active ? `${color}18` : "var(--surface)",
        border: `1px solid ${active ? color + "55" : "#1e1e2e"}`,
        cursor: "pointer",
        textAlign: "left",
        display: "flex",
        flexDirection: "column",
        gap: 3,
        transition: "border-color 140ms, background 140ms",
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: color,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: active ? color : "#f0f0f8",
            flex: 1,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {tool.name}
        </span>
        {active && (
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
            <polyline
              points="2,6 5,9 10,3"
              stroke={color}
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
      <span
        style={{
          fontSize: 10,
          color: "#555577",
          lineHeight: 1.4,
          paddingLeft: 12,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {tool.tagline}
      </span>
    </button>
  );
}

export function WorkflowStep({
  detectedCount,
  detectedIds,
  onBack,
  onNext,
}: {
  detectedCount: number;
  detectedIds: string[];
  onBack: () => void;
  onNext: (workflowIds: string[]) => void;
}) {
  const { allTools } = useGenomeData();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const detectedSet = useMemo(() => new Set(detectedIds), [detectedIds]);
  const toolById = useMemo(() => new Map(allTools.map((t) => [t.id, t])), [allTools]);

  const groups = useMemo(
    () =>
      WORKFLOW_GROUPS.map((g) => {
        const all = g.toolIds.map((id) => toolById.get(id)).filter((t): t is Tool => !!t);
        const available = all.filter((t) => !detectedSet.has(t.id));
        const coveredCount = all.length - available.length;
        return { label: g.label, available, coveredCount };
      }),
    [toolById, detectedSet]
  );

  const totalCovered = groups.reduce((sum, g) => sum + g.coveredCount, 0);

  return (
    <div
      className="flex flex-col items-center justify-start flex-1"
      style={{ padding: "40px 24px 32px", minHeight: 0, overflowY: "auto" }}
    >
      {/* Header */}
      <div className="text-center mb-8" style={{ maxWidth: 620, width: "100%" }}>
        <div className="flex justify-center mb-4">
          <ProgressDots total={2} current={1} />
        </div>
        <p
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "#555577",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 10,
          }}
        >
          Step 2 of 2 — Workflow tools
        </p>
        <h1
          style={{
            fontSize: 26,
            fontWeight: 700,
            color: "#f0f0f8",
            margin: "0 0 8px",
            letterSpacing: -0.3,
          }}
        >
          What&apos;s your dev workflow?
        </h1>
        <p style={{ fontSize: 13, color: "#8888aa", lineHeight: 1.6, margin: "0 0 12px" }}>
          These tools don&apos;t always show up in dependency files.{" "}
          {detectedCount === 0 && (
            <>Select everything you use — nothing is wrong with skipping code scanning.</>
          )}
        </p>
        {totalCovered > 0 && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 12px",
              borderRadius: 6,
              background: "#26de8110",
              border: "1px solid #26de8130",
              fontSize: 11,
              color: "#26de81",
            }}
          >
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
              <polyline
                points="2,6 5,9 10,3"
                stroke="#26de81"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {totalCovered} tool{totalCovered !== 1 ? "s" : ""} already detected from your files
          </div>
        )}
      </div>

      {/* Groups */}
      <div
        style={{
          width: "100%",
          maxWidth: 620,
          display: "flex",
          flexDirection: "column",
          gap: 24,
          marginBottom: 28,
        }}
      >
        {groups.map((group) => {
          if (group.available.length === 0) {
            if (group.coveredCount === 0) return null;
            return (
              <div key={group.label}>
                <p
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "#333355",
                    margin: "0 0 6px",
                  }}
                >
                  {group.label}
                </p>
                <p style={{ fontSize: 11, color: "#333355", margin: 0 }}>
                  ✓ All {group.coveredCount} tool{group.coveredCount !== 1 ? "s" : ""} already
                  detected
                </p>
              </div>
            );
          }

          return (
            <div key={group.label}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 10,
                }}
              >
                <p
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "#555577",
                    margin: 0,
                  }}
                >
                  {group.label}
                </p>
                {group.coveredCount > 0 && (
                  <span
                    style={{
                      fontSize: 9,
                      color: "#26de81",
                      background: "#26de8110",
                      border: "1px solid #26de8120",
                      borderRadius: 4,
                      padding: "1px 6px",
                    }}
                  >
                    +{group.coveredCount} detected
                  </span>
                )}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {group.available.map((t) => (
                  <ToolChip
                    key={t.id}
                    tool={t}
                    active={selected.has(t.id)}
                    onToggle={() => toggle(t.id)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer nav */}
      <div
        style={{
          width: "100%",
          maxWidth: 620,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: "none",
            border: "none",
            color: "#555577",
            fontSize: 12,
            cursor: "pointer",
            padding: 0,
          }}
        >
          ← Back
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {selected.size > 0 && (
            <span style={{ fontSize: 11, color: "var(--accent)" }}>{selected.size} selected</span>
          )}
          <button
            onClick={() => onNext(Array.from(selected))}
            style={{
              padding: "0 24px",
              height: 38,
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              background: "var(--accent)",
              color: "#fff",
              border: "none",
              cursor: "pointer",
            }}
          >
            {selected.size > 0 ? "See my genome →" : "Skip →"}
          </button>
        </div>
      </div>
    </div>
  );
}
