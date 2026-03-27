"use client";

import { useState, useMemo } from "react";
import { useGenomeData } from "../GenomeContext";
import { Tool, getCategoryColor, CATEGORIES } from "@/lib/types";
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

export function WorkflowStep({ onNext }: { onNext: (workflowIds: string[]) => void }) {
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

  const groups = useMemo(() => {
    const workflowTools = allTools.filter(
      (t) => t.use_context === "dev-productivity" || t.use_context === "both"
    );
    return CATEGORIES.flatMap((cat) => {
      const tools = workflowTools.filter((t) => t.category === cat.id);
      if (tools.length === 0) return [];
      return [{ label: cat.label, tools }];
    });
  }, [allTools]);

  return (
    <div
      className="flex flex-col items-center justify-start flex-1"
      style={{ padding: "40px 24px 32px", minHeight: 0, overflowY: "auto" }}
    >
      {/* Header */}
      <div className="text-center mb-8" style={{ maxWidth: 620, width: "100%" }}>
        <div className="flex justify-center mb-4">
          <ProgressDots total={2} current={0} />
        </div>
        <p
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "#555577",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 10,
          }}
        >
          Step 1 of 2 — Workflow tools
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
          These tools don&apos;t always show up in dependency files. Select everything you use.
        </p>
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
        {groups.map((group) => (
          <div key={group.label}>
            <p
              style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#555577",
                margin: "0 0 10px",
              }}
            >
              {group.label}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {group.tools.map((t) => (
                <ToolChip
                  key={t.id}
                  tool={t}
                  active={selected.has(t.id)}
                  onToggle={() => toggle(t.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer nav */}
      <div
        style={{
          width: "100%",
          maxWidth: 620,
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 10,
        }}
      >
        {selected.size > 0 && (
          <span style={{ fontSize: 12, color: "var(--accent)" }}>{selected.size} selected</span>
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
          {selected.size > 0 ? "Next →" : "Skip →"}
        </button>
      </div>
    </div>
  );
}
