"use client";

import { useState } from "react";
import { useGenomeData } from "../GenomeContext";
import { PRIORITY_COLOR } from "../genomeConstants";
import { GenomeReport } from "@/lib/genomeAnalysis";
import { getCategoryColor } from "@/lib/types";

export function SlotGrid({ report }: { report: GenomeReport }) {
  const { allSlots, allTools } = useGenomeData();
  const [showOptional, setShowOptional] = useState(false);

  const filled = new Map(report.filledSlots.map((f) => [f.slotId, f]));
  const missing = new Map(report.missingSlots.map((m) => [m.slotId, m]));

  const visibleSlots = showOptional
    ? allSlots
    : allSlots.filter((s) => filled.has(s.id) || s.priority !== "optional");

  const hiddenOptionalCount = allSlots.filter(
    (s) => !filled.has(s.id) && s.priority === "optional"
  ).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(175px, 1fr))",
          gap: 7,
        }}
      >
        {visibleSlots.map((slot) => {
          const f = filled.get(slot.id);
          const m = missing.get(slot.id);
          const color = f ? getCategoryColor(f.tool.category) : PRIORITY_COLOR[slot.priority];
          const suggestTool = m?.suggestTool
            ? allTools.find((t) => t.id === m.suggestTool!.id)
            : undefined;

          return (
            <div
              key={slot.id}
              style={{
                borderRadius: 8,
                padding: "10px 12px",
                background: f ? color + "12" : "var(--surface)",
                border: `1px solid ${f ? color + "33" : "#1e1e2e"}`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <div
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: color,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 600,
                    color: "#555577",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  {slot.name}
                </span>
              </div>
              {f ? (
                <p style={{ fontSize: 12, fontWeight: 500, color, margin: 0 }}>{f.tool.name}</p>
              ) : suggestTool ? (
                <p style={{ fontSize: 11, color: "#444466", margin: 0 }}>→ {suggestTool.name}</p>
              ) : (
                <p style={{ fontSize: 11, color: "#333355", margin: 0, fontStyle: "italic" }}>
                  empty
                </p>
              )}
            </div>
          );
        })}
      </div>

      {!showOptional && hiddenOptionalCount > 0 && (
        <button
          onClick={() => setShowOptional(true)}
          style={{
            alignSelf: "flex-start",
            background: "none",
            border: "none",
            fontSize: 11,
            color: "#555577",
            cursor: "pointer",
            textDecoration: "underline",
            textUnderlineOffset: 3,
            padding: 0,
          }}
        >
          Show {hiddenOptionalCount} optional slot{hiddenOptionalCount !== 1 ? "s" : ""}
        </button>
      )}
    </div>
  );
}
