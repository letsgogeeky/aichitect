"use client";

import { useState } from "react";
import { GenomeReport } from "@/lib/genomeAnalysis";
import { getCategoryColor, Tool } from "@/lib/types";
import { SlotRiskBadge } from "@/components/panels/SlotRiskBadge";
import { TrajectorySparkline } from "@/components/panels/TrajectorySparkline";
import ComparisonPanel from "@/components/panels/ComparisonPanel";
import type { ToolRiskSignal } from "@/app/api/pulse/events/route";

interface Props {
  report: GenomeReport;
  signals: Record<string, ToolRiskSignal>;
  allTools: Tool[];
}

export function WatchSlotGrid({ report, signals, allTools }: Props) {
  const [compareA, setCompareA] = useState<Tool | null>(null);
  const [compareB, setCompareB] = useState<Tool | null>(null);

  function openAlternatives(tool: Tool) {
    // Find other tools sharing the same slot, sorted by health (non-stale first, then by score)
    const alternatives = allTools
      .filter((t) => t.slot === tool.slot && t.id !== tool.id)
      .sort((a, b) => {
        const aStale = a.is_stale ? 1 : 0;
        const bStale = b.is_stale ? 1 : 0;
        if (aStale !== bStale) return aStale - bStale;
        return (b.health_score ?? 0) - (a.health_score ?? 0);
      });

    const best = alternatives[0];
    if (best) {
      setCompareA(tool);
      setCompareB(best);
    }
  }

  function closeComparison() {
    setCompareA(null);
    setCompareB(null);
  }

  if (report.filledSlots.length === 0) return null;

  return (
    <>
      <div>
        <p
          className="text-[10px] font-bold uppercase tracking-widest mb-4"
          style={{ color: "#555577" }}
        >
          Stack slots — {report.filledSlots.length} tool
          {report.filledSlots.length !== 1 ? "s" : ""}
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          {report.filledSlots.map((slot) => {
            const color = getCategoryColor(slot.tool.category);
            const signal = signals[slot.tool.id];
            const hasGithub = !!slot.tool.github_url;

            return (
              <div
                key={slot.slotId}
                className="rounded-xl p-4"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
              >
                {/* Slot label */}
                <p
                  className="text-[10px] uppercase tracking-wider mb-2"
                  style={{ color: "var(--text-muted)" }}
                >
                  {slot.slotName}
                </p>

                {/* Tool name row */}
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: color }}
                    />
                    <span className="text-sm font-semibold truncate" style={{ color }}>
                      {slot.tool.name}
                    </span>
                    {slot.tool.type === "oss" && (
                      <span
                        className="text-[10px] font-medium flex-shrink-0"
                        style={{ color: "#26de81" }}
                      >
                        OSS
                      </span>
                    )}
                  </div>
                </div>

                {/* Risk badge */}
                {signal?.signal && (
                  <div className="mb-3">
                    <SlotRiskBadge
                      signal={signal}
                      onSeeAlternatives={() => openAlternatives(slot.tool)}
                    />
                  </div>
                )}

                {/* Trajectory sparkline */}
                {hasGithub && <TrajectorySparkline toolId={slot.tool.id} categoryColor={color} />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Comparison panel overlay */}
      {compareA && compareB && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <div
            onClick={closeComparison}
            style={{ position: "absolute", inset: 0, background: "#00000055" }}
          />
          <div style={{ position: "relative", height: "100%", overflowY: "auto", zIndex: 1 }}>
            <ComparisonPanel
              toolA={compareA}
              toolB={compareB}
              onClose={closeComparison}
              onSwap={() => {
                setCompareA(compareB);
                setCompareB(compareA);
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
