"use client";

import BottomSheet from "@/components/mobile/BottomSheet";
import { Slot, Tool, StackArchetype, getCategoryColor } from "@/lib/types";

export function MobileSlotPicker({
  open,
  slots,
  allTools,
  selected,
  selectedCount,
  archetype,
  onPickTool,
  onClose,
}: {
  open: boolean;
  slots: Slot[];
  allTools: Tool[];
  selected: Record<string, string>;
  selectedCount: number;
  archetype: StackArchetype;
  onPickTool: (slotId: string, toolId: string) => void;
  onClose: () => void;
}) {
  const applicableSlots = slots.filter((s) => s.priority[archetype] !== "not-applicable");

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={selectedCount > 0 ? `Choose Tools · ${selectedCount} selected` : "Choose Tools"}
      snapPoints={[75, 92]}
    >
      <div className="p-3 space-y-3">
        {applicableSlots.map((slot) => {
          const selectedId = selected[slot.id];
          const slotTools = slot.tools
            .map((id) => allTools.find((t) => t.id === id))
            .filter(Boolean) as Tool[];
          return (
            <div key={slot.id}>
              <div
                className="text-[11px] font-semibold mb-1.5 px-1"
                style={{ color: "var(--text-secondary)" }}
              >
                {slot.name}
              </div>
              <div className="space-y-1">
                {slotTools.map((tool) => {
                  const isActive = selectedId === tool.id;
                  const color = getCategoryColor(tool.category);
                  return (
                    <button
                      key={tool.id}
                      onClick={() => onPickTool(slot.id, tool.id)}
                      className="w-full flex items-center gap-2 px-3 py-3 rounded-lg"
                      style={{
                        background: isActive ? color + "22" : "var(--surface-2)",
                        border: `1px solid ${isActive ? color + "66" : "var(--border)"}`,
                      }}
                    >
                      <span
                        className="text-xs font-medium flex-1 text-left"
                        style={{ color: isActive ? color : "var(--text-primary)" }}
                      >
                        {tool.name}
                      </span>
                      {tool.type === "oss" && (
                        <span className="text-[9px]" style={{ color: "var(--success)" }}>
                          OSS
                        </span>
                      )}
                      {isActive && (
                        <span className="text-[10px]" style={{ color }}>
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
        <div className="pt-2 pb-2">
          <button
            className="w-full py-2.5 rounded-lg text-sm font-semibold"
            style={{ background: "var(--accent)", color: "#fff" }}
            onClick={onClose}
          >
            Build my stack
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
