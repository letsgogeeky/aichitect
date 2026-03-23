"use client";

import { useState, useMemo } from "react";
import { useGenomeData } from "../GenomeContext";
import { WORKFLOW_GROUPS } from "../genomeConstants";
import { Tool, getCategoryColor } from "@/lib/types";
import { ProgressDots } from "./ProgressDots";

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
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  const toolById = useMemo(() => new Map(allTools.map((t) => [t.id, t])), [allTools]);
  const detectedTools = useMemo(
    () => detectedIds.map((id) => toolById.get(id)).filter(Boolean) as Tool[],
    [detectedIds, toolById]
  );

  return (
    <div
      className="flex flex-col items-center justify-start flex-1"
      style={{ padding: "40px 24px 32px", minHeight: 0, overflowY: "auto" }}
    >
      {/* Header */}
      <div className="text-center mb-8" style={{ maxWidth: 560, width: "100%" }}>
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
          These tools don&apos;t show up in dependency files.
          {detectedCount === 0 && (
            <> Select everything you use — nothing is wrong with skipping code scanning.</>
          )}
        </p>
        {detectedTools.length > 0 && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 5,
              padding: "8px 12px",
              borderRadius: 8,
              background: "#ffffff06",
              border: "1px solid #1e1e2e",
            }}
          >
            <span style={{ fontSize: 10, color: "#555577", flexShrink: 0, marginRight: 2 }}>
              Already found:
            </span>
            {detectedTools.map((t) => (
              <span
                key={t.id}
                style={{
                  fontSize: 10,
                  fontWeight: 500,
                  color: "#555577",
                  background: "#ffffff0a",
                  border: "1px solid #2e2e4e",
                  borderRadius: 4,
                  padding: "2px 7px",
                }}
              >
                {t.name}
              </span>
            ))}
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
          gap: 20,
          marginBottom: 28,
        }}
      >
        {WORKFLOW_GROUPS.map((group) => {
          const tools = group.toolIds.map((id) => toolById.get(id)).filter((t): t is Tool => !!t);

          return (
            <div key={group.label}>
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "#555577",
                  margin: "0 0 8px",
                }}
              >
                {group.label}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                {tools.map((t) => {
                  const active = selected.has(t.id);
                  const color = getCategoryColor(t.category);
                  return (
                    <button
                      key={t.id}
                      onClick={() => toggle(t.id)}
                      style={{
                        padding: "6px 14px",
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: active ? 500 : 400,
                        background: active ? color + "20" : "var(--surface)",
                        border: `1px solid ${active ? color + "66" : "var(--btn-border)"}`,
                        color: active ? color : "#8888aa",
                        cursor: "pointer",
                        transition: "all 140ms",
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                      }}
                    >
                      {active && (
                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                          <polyline
                            points="2,6 5,9 10,3"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                      {t.name}
                    </button>
                  );
                })}
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
