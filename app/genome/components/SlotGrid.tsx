"use client";

import { useGenomeData } from "../GenomeContext";
import { PRIORITY_COLOR } from "../genomeConstants";
import { GenomeReport } from "@/lib/genomeAnalysis";
import { getCategoryColor } from "@/lib/types";

export function SlotGrid({ report }: { report: GenomeReport }) {
  const { allSlots } = useGenomeData();
  const filled = new Map(report.filledSlots.map((f) => [f.slotId, f]));

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(175px, 1fr))",
        gap: 7,
      }}
    >
      {allSlots.map((slot) => {
        const f = filled.get(slot.id);
        const color = f ? getCategoryColor(f.tool.category) : PRIORITY_COLOR[slot.priority];

        return (
          <div
            key={slot.id}
            style={{
              borderRadius: 8,
              padding: "10px 12px",
              background: f ? color + "12" : "var(--surface)",
              border: `1px solid ${f ? color + "33" : "#1e1e2e"}`,
              opacity: !f && slot.priority === "optional" ? 0.45 : 1,
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
                {slot.id.replace(/-/g, " ")}
              </span>
            </div>
            {f ? (
              <p style={{ fontSize: 12, fontWeight: 500, color, margin: 0 }}>{f.tool.name}</p>
            ) : (
              <p style={{ fontSize: 11, color: "#444466", margin: 0, fontStyle: "italic" }}>
                empty
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
