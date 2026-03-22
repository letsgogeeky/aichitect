"use client";

import type { MouseEvent } from "react";
import { Slot, Tool, getCategoryColor } from "@/lib/types";
import { CloseButton } from "@/components/ui/CloseButton";
import { SLOT_AUTONOMY } from "@/lib/stackStory";
import StackHealthPanel from "@/components/panels/StackHealthPanel";

export function BuilderSlotList({
  slots,
  allTools,
  selected,
  selectedCount,
  collapsedSlots,
  compareA,
  compareB,
  onPickTool,
  onToggleSlot,
  onCompareClick,
  onClearCompare,
}: {
  slots: Slot[];
  allTools: Tool[];
  selected: Record<string, string>;
  selectedCount: number;
  collapsedSlots: Record<string, boolean>;
  compareA: Tool | null;
  compareB: Tool | null;
  onPickTool: (slotId: string, toolId: string) => void;
  onToggleSlot: (slotId: string) => void;
  onCompareClick: (tool: Tool, e: MouseEvent) => void;
  onClearCompare: () => void;
}) {
  return (
    <aside
      data-tour="builder-slots"
      className="hidden sm:block w-64 flex-shrink-0 border-r overflow-y-auto"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <div className="p-3 space-y-3">
        <div className="mb-1">
          <p className="text-xs font-semibold text-[var(--text-primary)] mb-1">
            Your stack, no bloat.
          </p>
          <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">
            Answer each question. We&apos;ll map how the tools wire together.
          </p>
        </div>
        {selectedCount > 0 && (
          <div
            className="text-[10px] px-2 py-1 rounded-md"
            style={{ background: "#7c6bff18", color: "#7c6bff" }}
          >
            {selectedCount} of {slots.length} slots filled
          </div>
        )}

        {compareA && !compareB && (
          <div
            className="flex items-center gap-1.5 text-[10px] px-2 py-1.5 rounded-md"
            style={{ background: "#7c6bff14", border: "1px solid #7c6bff33", color: "#7c6bff" }}
          >
            <div
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: getCategoryColor(compareA.category) }}
            />
            <span className="truncate font-medium">{compareA.name}</span>
            <span className="text-[#7c6bff66] flex-shrink-0">· pick one more</span>
            <CloseButton
              onClick={onClearCompare}
              variant="accent"
              className="ml-auto flex-shrink-0"
            />
          </div>
        )}

        <div data-tour="builder-health">
          <StackHealthPanel
            selected={selected}
            slots={slots}
            allTools={allTools}
            onAddTool={onPickTool}
          />
        </div>

        {slots.map((slot) => {
          const selectedId = selected[slot.id];
          const slotTools = slot.tools
            .map((id) => allTools.find((t) => t.id === id))
            .filter(Boolean) as Tool[];
          const isOpen = !collapsedSlots[slot.id];
          const selectedTool = slotTools.find((t) => t.id === selectedId);

          return (
            <div key={slot.id}>
              <button
                onClick={() => onToggleSlot(slot.id)}
                className="w-full flex items-start gap-2 mb-1 text-left group"
              >
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 10 10"
                  fill="none"
                  className="mt-0.5 flex-shrink-0 text-[var(--text-muted)]"
                  style={{
                    transform: isOpen ? "rotate(0deg)" : "rotate(-90deg)",
                    transition: "transform 180ms ease",
                  }}
                >
                  <path
                    d="M2 3.5L5 6.5L8 3.5"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-[var(--text-primary)] leading-tight">
                    {slot.name}
                  </p>
                  {SLOT_AUTONOMY[slot.id] && (
                    <span
                      className="text-[9px] font-medium"
                      style={{ color: SLOT_AUTONOMY[slot.id].color, opacity: 0.75 }}
                    >
                      {SLOT_AUTONOMY[slot.id].label}
                    </span>
                  )}
                  {!isOpen && selectedTool && (
                    <p
                      className="text-[10px] mt-0.5 truncate"
                      style={{ color: getCategoryColor(selectedTool.category) }}
                    >
                      {selectedTool.name}
                    </p>
                  )}
                  {!isOpen && !selectedTool && (
                    <p className="text-[10px] text-[var(--text-muted)] mt-0.5">not set</p>
                  )}
                </div>
              </button>

              {isOpen && (
                <>
                  <p className="text-[10px] text-[var(--text-muted)] mb-1.5 pl-4 leading-relaxed">
                    {slot.description}
                  </p>
                  <div className="space-y-0.5">
                    {slotTools.map((t) => {
                      const active = selectedId === t.id;
                      const color = getCategoryColor(t.category);
                      const isCompareA = compareA?.id === t.id;
                      const isCompareB = compareB?.id === t.id;
                      const isCompared = isCompareA || isCompareB;
                      return (
                        <div key={t.id} className="flex items-center gap-1 group/tool">
                          <button
                            onClick={() => onPickTool(slot.id, t.id)}
                            className="flex-1 flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-all"
                            style={{
                              background: active ? color + "22" : "var(--surface-2)",
                              border: active ? `1px solid ${color}66` : "1px solid var(--border)",
                            }}
                          >
                            <div
                              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                              style={{ background: color }}
                            />
                            <span
                              className="text-xs font-medium"
                              style={{ color: active ? color : "var(--text-primary)" }}
                            >
                              {t.name}
                            </span>
                            {t.type === "oss" && (
                              <span className="ml-auto text-[9px] text-[#26de81]">OSS</span>
                            )}
                          </button>
                          <button
                            onClick={(e) => onCompareClick(t, e)}
                            title={isCompareA ? "Staged for comparison" : `Compare ${t.name}`}
                            className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded transition-all"
                            style={{
                              opacity: isCompared ? 1 : undefined,
                              background: isCompared ? "#7c6bff22" : "transparent",
                              color: isCompared ? "#7c6bff" : "var(--text-muted)",
                            }}
                          >
                            <svg
                              width="11"
                              height="11"
                              viewBox="0 0 12 12"
                              fill="none"
                              className={
                                isCompared
                                  ? ""
                                  : "opacity-0 group-hover/tool:opacity-100 transition-opacity"
                              }
                            >
                              <rect
                                x="0.5"
                                y="0.5"
                                width="4"
                                height="11"
                                rx="1"
                                stroke="currentColor"
                                strokeWidth="1.2"
                              />
                              <rect
                                x="7.5"
                                y="0.5"
                                width="4"
                                height="11"
                                rx="1"
                                stroke="currentColor"
                                strokeWidth="1.2"
                              />
                            </svg>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
