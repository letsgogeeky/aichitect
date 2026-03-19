"use client";

import { useMemo } from "react";
import { Slot, Tool, getCategoryColor } from "@/lib/types";

interface Props {
  selected: Record<string, string>; // slotId → toolId
  slots: Slot[];
  allTools: Tool[];
  onAddTool: (slotId: string, toolId: string) => void;
}

interface SlotHealth {
  slot: Slot;
  filled: boolean;
  tool: Tool | null;
  suggestedTool: Tool | null;
}

export default function StackHealthPanel({ selected, slots, allTools, onAddTool }: Props) {
  const health = useMemo<SlotHealth[]>(() => {
    return slots.map((slot) => {
      const toolId = selected[slot.id];
      const tool = toolId ? (allTools.find((t) => t.id === toolId) ?? null) : null;
      const suggestedTool =
        !tool && slot.suggest ? (allTools.find((t) => t.id === slot.suggest) ?? null) : null;
      return { slot, filled: !!tool, tool, suggestedTool };
    });
  }, [selected, slots, allTools]);

  const required = health.filter((h) => h.slot.priority === "required");
  const recommended = health.filter((h) => h.slot.priority === "recommended");

  const requiredFilled = required.filter((h) => h.filled).length;
  const recommendedFilled = recommended.filter((h) => h.filled).length;
  const totalEssentials = required.length + recommended.length;
  const totalFilled = requiredFilled + recommendedFilled;

  const missingRequired = required.filter((h) => !h.filled);
  const missingRecommended = recommended.filter((h) => !h.filled);

  // Don't render if everything essential is filled
  if (missingRequired.length === 0 && missingRecommended.length === 0) {
    return (
      <div
        className="rounded-lg px-3 py-2.5 text-center"
        style={{ background: "#26de8110", border: "1px solid #26de8122" }}
      >
        <p className="text-[10px] font-semibold" style={{ color: "#26de81" }}>
          Stack looks solid
        </p>
        <p className="text-[9px] mt-0.5" style={{ color: "#26de8188" }}>
          All essentials covered
        </p>
      </div>
    );
  }

  const pct = totalEssentials > 0 ? Math.round((totalFilled / totalEssentials) * 100) : 0;

  return (
    <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)" }}>
      {/* Header */}
      <div
        className="px-3 py-2 flex items-center justify-between"
        style={{ background: "var(--surface-2)" }}
      >
        <p className="text-[10px] font-semibold text-[var(--text-primary)]">Stack health</p>
        <div className="flex items-center gap-1.5">
          {/* mini progress bar */}
          <div
            className="w-16 h-1 rounded-full overflow-hidden"
            style={{ background: "var(--border)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${pct}%`,
                background: pct === 100 ? "#26de81" : pct >= 60 ? "#fd9644" : "#ff6b6b",
              }}
            />
          </div>
          <span className="text-[9px] font-medium" style={{ color: "var(--text-muted)" }}>
            {totalFilled}/{totalEssentials}
          </span>
        </div>
      </div>

      {/* Rows */}
      <div className="divide-y" style={{ borderColor: "var(--border)" }}>
        {missingRequired.map(({ slot, suggestedTool }) => (
          <HealthRow
            key={slot.id}
            slot={slot}
            suggestedTool={suggestedTool}
            variant="required"
            onAdd={onAddTool}
          />
        ))}
        {missingRecommended.map(({ slot, suggestedTool }) => (
          <HealthRow
            key={slot.id}
            slot={slot}
            suggestedTool={suggestedTool}
            variant="recommended"
            onAdd={onAddTool}
          />
        ))}
      </div>
    </div>
  );
}

function HealthRow({
  slot,
  suggestedTool,
  variant,
  onAdd,
}: {
  slot: Slot;
  suggestedTool: Tool | null;
  variant: "required" | "recommended";
  onAdd: (slotId: string, toolId: string) => void;
}) {
  const isRequired = variant === "required";
  const accentColor = isRequired ? "#ff6b6b" : "#fd9644";
  const label = isRequired ? "required" : "recommended";

  return (
    <div className="px-3 py-2.5" style={{ background: "var(--surface)" }}>
      {/* Slot label + priority badge */}
      <div className="flex items-center gap-1.5 mb-1">
        <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: accentColor }} />
        <span className="text-[10px] font-medium text-[var(--text-primary)] truncate leading-tight">
          {slot.name}
        </span>
        <span
          className="ml-auto text-[8px] font-semibold uppercase tracking-wide flex-shrink-0"
          style={{ color: accentColor + "cc" }}
        >
          {label}
        </span>
      </div>

      {/* Suggestion */}
      {suggestedTool ? (
        <div className="flex items-start gap-2 mt-1.5">
          <div
            className="w-1 h-1 rounded-full flex-shrink-0 mt-1"
            style={{ background: getCategoryColor(suggestedTool.category) }}
          />
          <div className="flex-1 min-w-0">
            <p
              className="text-[10px] font-medium leading-tight"
              style={{ color: getCategoryColor(suggestedTool.category) }}
            >
              {suggestedTool.name}
            </p>
            {slot.suggest_reason && (
              <p className="text-[9px] text-[var(--text-muted)] leading-relaxed mt-0.5">
                {slot.suggest_reason}
              </p>
            )}
          </div>
          <button
            onClick={() => onAdd(slot.id, suggestedTool.id)}
            className="flex-shrink-0 text-[9px] font-semibold px-1.5 py-0.5 rounded transition-colors"
            style={{
              background: getCategoryColor(suggestedTool.category) + "18",
              color: getCategoryColor(suggestedTool.category),
              border: `1px solid ${getCategoryColor(suggestedTool.category)}33`,
            }}
          >
            Add
          </button>
        </div>
      ) : (
        <p className="text-[9px] text-[var(--text-muted)] pl-2.5">Not set</p>
      )}
    </div>
  );
}
