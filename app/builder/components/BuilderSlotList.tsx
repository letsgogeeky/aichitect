"use client";

import type { MouseEvent } from "react";
import { useState, useEffect } from "react";
import { Slot, Tool, StackArchetype, getCategoryColor } from "@/lib/types";
import { CloseButton } from "@/components/ui/CloseButton";
import { SLOT_AUTONOMY } from "@/lib/stackStory";
import StackHealthPanel from "@/components/panels/StackHealthPanel";
import { SlotRiskBadge } from "@/components/panels/SlotRiskBadge";
import type { ToolRiskSignal } from "@/app/api/pulse/events/route";
import Link from "next/link";
import { ToolUsageButton } from "@/components/ui/ToolUsageButton";
import { useUser } from "@/hooks/useUser";

export function BuilderSlotList({
  slots,
  allTools,
  selected,
  selectedCount,
  stackParam,
  collapsedSlots,
  archetype,
  compareA,
  compareB,
  onPickTool,
  onToggleSlot,
  onCompareClick,
  onClearCompare,
  onOpenQuiz,
  onSeeAlternatives,
}: {
  slots: Slot[];
  allTools: Tool[];
  selected: Record<string, string>;
  selectedCount: number;
  stackParam: string;
  collapsedSlots: Record<string, boolean>;
  archetype: StackArchetype;
  compareA: Tool | null;
  compareB: Tool | null;
  onPickTool: (slotId: string, toolId: string) => void;
  onToggleSlot: (slotId: string) => void;
  onCompareClick: (tool: Tool, e: MouseEvent) => void;
  onClearCompare: () => void;
  onOpenQuiz: () => void;
  onSeeAlternatives?: (slotId: string, selectedToolId: string) => void;
}) {
  const [showNotApplicable, setShowNotApplicable] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveName, setSaveName] = useState("");
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [signals, setSignals] = useState<Record<string, ToolRiskSignal>>({});
  const { user, refreshSavedStacks } = useUser();

  useEffect(() => {
    const toolIds = Object.values(selected).filter(Boolean);
    if (toolIds.length === 0) {
      setSignals({});
      return;
    }
    const timer = setTimeout(() => {
      fetch("/api/pulse/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool_ids: toolIds }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (!data?.signals) return;
          const map: Record<string, ToolRiskSignal> = {};
          for (const sig of data.signals as ToolRiskSignal[]) {
            if (sig.signal) map[sig.tool_id] = sig;
          }
          setSignals(map);
        })
        .catch(() => {});
    }, 400);
    return () => clearTimeout(timer);
  }, [selected]);

  async function saveStack() {
    if (!saveName.trim()) return;
    setSaveState("saving");
    const toolIds = Object.values(selected).filter(Boolean);
    try {
      const res = await fetch("/api/stacks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: saveName.trim(), tool_ids: toolIds }),
      });
      if (!res.ok) throw new Error();
      setSaveState("saved");
      refreshSavedStacks();
      setTimeout(() => {
        setShowSaveForm(false);
        setSaveName("");
        setSaveState("idle");
      }, 1500);
    } catch {
      setSaveState("error");
    }
  }

  const applicableSlots = slots.filter((s) => s.priority[archetype] !== "not-applicable");

  const notApplicableSlots = slots.filter((s) => s.priority[archetype] === "not-applicable");
  const applicableSelectedCount = applicableSlots.filter((s) => !!selected[s.id]).length;

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
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Answer each question. We&apos;ll map how the tools wire together.
          </p>
        </div>
        {selectedCount === 0 && (
          <div
            className="rounded-lg px-3 py-2.5 space-y-2"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
          >
            <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">
              Not sure where to start?
            </p>
            <div className="flex gap-1.5">
              <button
                onClick={onOpenQuiz}
                className="flex-1 text-[10px] font-medium py-1.5 px-2 rounded-md transition-colors"
                style={{
                  background: "#7c6bff18",
                  border: "1px solid #7c6bff33",
                  color: "var(--accent)",
                }}
              >
                Find my stack →
              </button>
              <Link
                href="/stacks"
                className="flex-1 text-[10px] font-medium py-1.5 px-2 rounded-md text-center transition-colors"
                style={{
                  background: "var(--btn)",
                  border: "1px solid var(--btn-border)",
                  color: "var(--text-secondary)",
                }}
              >
                Browse stacks →
              </Link>
            </div>
          </div>
        )}

        {selectedCount > 0 && (
          <div
            className="text-[10px] px-2 py-1 rounded-md"
            style={{ background: "#7c6bff18", color: "var(--accent)" }}
          >
            {applicableSelectedCount} of {applicableSlots.length} slots filled
          </div>
        )}

        {compareA && !compareB && (
          <div
            className="flex items-center gap-1.5 text-[10px] px-2 py-1.5 rounded-md"
            style={{
              background: "#7c6bff14",
              border: "1px solid #7c6bff33",
              color: "var(--accent)",
            }}
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

        {selectedCount > 0 && user && (
          <div>
            {!showSaveForm ? (
              <button
                onClick={() => setShowSaveForm(true)}
                className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg text-[10px] font-medium transition-colors"
                style={{
                  background: "#7c6bff18",
                  border: "1px solid #7c6bff33",
                  color: "var(--accent)",
                }}
              >
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M2 1h6.5L10 2.5V10a1 1 0 01-1 1H3a1 1 0 01-1-1V2a1 1 0 011-1z"
                    stroke="currentColor"
                    strokeWidth="1.2"
                  />
                  <path d="M4 1v3.5h4V1" stroke="currentColor" strokeWidth="1.2" />
                </svg>
                Save stack
              </button>
            ) : (
              <div className="space-y-1.5">
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="Stack name…"
                  autoFocus
                  className="w-full px-2.5 py-1.5 rounded-lg text-[10px]"
                  style={{
                    background: "var(--surface-2)",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                    outline: "none",
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveStack();
                    if (e.key === "Escape") {
                      setShowSaveForm(false);
                      setSaveName("");
                    }
                  }}
                />
                <div className="flex gap-1.5">
                  <button
                    onClick={saveStack}
                    disabled={!saveName.trim() || saveState === "saving"}
                    className="flex-1 py-1.5 rounded-lg text-[10px] font-medium transition-all"
                    style={{
                      background: saveState === "saved" ? "#26de8122" : "#7c6bff18",
                      border: `1px solid ${saveState === "saved" ? "#26de8144" : "#7c6bff33"}`,
                      color: saveState === "saved" ? "var(--success)" : "var(--accent)",
                      opacity: !saveName.trim() || saveState === "saving" ? 0.5 : 1,
                    }}
                  >
                    {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved!" : "Save"}
                  </button>
                  <button
                    onClick={() => {
                      setShowSaveForm(false);
                      setSaveName("");
                      setSaveState("idle");
                    }}
                    className="px-2 py-1.5 rounded-lg text-[10px] transition-colors"
                    style={{
                      background: "var(--surface-2)",
                      border: "1px solid var(--border)",
                      color: "var(--text-muted)",
                    }}
                  >
                    Cancel
                  </button>
                </div>
                {saveState === "error" && (
                  <p className="text-[10px]" style={{ color: "var(--danger, #ff6b6b)" }}>
                    Failed to save. Try again.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {applicableSlots.map((slot) => {
          const selectedId = selected[slot.id];
          const slotTools = slot.tools
            .map((id) => allTools.find((t) => t.id === id))
            .filter(Boolean) as Tool[];
          const isOpen = !collapsedSlots[slot.id];
          const selectedTool = slotTools.find((t) => t.id === selectedId);
          const selectedSignal = selectedTool ? signals[selectedTool.id] : undefined;

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
                  <p className="text-xs font-semibold text-[var(--text-primary)] leading-tight">
                    {slot.name}
                  </p>
                  {SLOT_AUTONOMY[slot.id] && (
                    <span
                      className="text-[10px] font-medium"
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

              {/* Risk badge — collapsed state, outside toggle button to avoid propagation */}
              {!isOpen && selectedTool && selectedSignal?.signal && (
                <div className="pl-4 mb-1">
                  <SlotRiskBadge
                    signal={selectedSignal}
                    onSeeAlternatives={
                      onSeeAlternatives
                        ? () => onSeeAlternatives(slot.id, selectedTool.id)
                        : undefined
                    }
                  />
                </div>
              )}

              {isOpen && (
                <>
                  <p className="text-xs text-[var(--text-muted)] mb-1.5 pl-4 leading-relaxed">
                    {slot.description}
                  </p>
                  <div className="space-y-0.5">
                    {slotTools.map((t) => {
                      const active = selectedId === t.id;
                      const color = getCategoryColor(t.category);
                      const isCompareA = compareA?.id === t.id;
                      const isCompareB = compareB?.id === t.id;
                      const isCompared = isCompareA || isCompareB;
                      const toolSignal = active ? signals[t.id] : undefined;
                      return (
                        <div key={t.id}>
                          <div className="flex items-center gap-1 group/tool">
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
                                <span className="ml-auto text-[10px] text-[var(--success)]">
                                  OSS
                                </span>
                              )}
                            </button>
                            {active && <ToolUsageButton toolId={t.id} color={color} compact />}
                            <button
                              onClick={(e) => onCompareClick(t, e)}
                              title={isCompareA ? "Staged for comparison" : `Compare ${t.name}`}
                              className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded transition-all"
                              style={{
                                opacity: isCompared ? 1 : undefined,
                                background: isCompared ? "#7c6bff22" : "transparent",
                                color: isCompared ? "var(--accent)" : "var(--text-muted)",
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
                          {/* Risk badge — open state, shown below the active tool row */}
                          {toolSignal?.signal && (
                            <div className="pl-2 mt-0.5 mb-0.5">
                              <SlotRiskBadge
                                signal={toolSignal}
                                onSeeAlternatives={
                                  onSeeAlternatives
                                    ? () => onSeeAlternatives(slot.id, t.id)
                                    : undefined
                                }
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          );
        })}

        {notApplicableSlots.length > 0 && (
          <div>
            <button
              onClick={() => setShowNotApplicable((v) => !v)}
              className="w-full flex items-center gap-1.5 text-left py-1"
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 10 10"
                fill="none"
                className="flex-shrink-0 text-[var(--text-muted)]"
                style={{
                  transform: showNotApplicable ? "rotate(0deg)" : "rotate(-90deg)",
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
              <span className="text-[10px] text-[var(--text-muted)]">
                {showNotApplicable ? "Hide" : "Show"} {notApplicableSlots.length} slots not relevant
                to your stack
              </span>
            </button>
            {showNotApplicable && (
              <div className="mt-1 space-y-3 opacity-50">
                {notApplicableSlots.map((slot) => {
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
                          <p className="text-xs font-semibold text-[var(--text-primary)] leading-tight">
                            {slot.name}
                          </p>
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
                              return (
                                <button
                                  key={t.id}
                                  onClick={() => onPickTool(slot.id, t.id)}
                                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-all"
                                  style={{
                                    background: active ? color + "22" : "var(--surface-2)",
                                    border: active
                                      ? `1px solid ${color}66`
                                      : "1px solid var(--border)",
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
                                    <span className="ml-auto text-[10px] text-[var(--success)]">
                                      OSS
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {selectedCount > 0 && (
          <Link
            href={`/explore?s=${stackParam}`}
            className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg text-[10px] font-medium transition-colors"
            style={{
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
            }}
          >
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
              <circle cx="3" cy="6" r="2" stroke="currentColor" strokeWidth="1.3" />
              <circle cx="9" cy="3" r="2" stroke="currentColor" strokeWidth="1.3" />
              <circle cx="9" cy="9" r="2" stroke="currentColor" strokeWidth="1.3" />
              <line x1="5" y1="5.2" x2="7.2" y2="3.8" stroke="currentColor" strokeWidth="1.1" />
              <line x1="5" y1="6.8" x2="7.2" y2="8.2" stroke="currentColor" strokeWidth="1.1" />
            </svg>
            See in graph
          </Link>
        )}
      </div>
    </aside>
  );
}
