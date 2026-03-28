import { useState, useMemo, useCallback, type MouseEvent } from "react";
import { useSearchParams } from "next/navigation";
import { Slot, Tool } from "@/lib/types";
import { generateStackStory } from "@/lib/stackStory";
import { detectArchetype } from "@/lib/genomeAnalysis";

function syncUrl(param: string) {
  const url = new URL(window.location.href);
  if (param) {
    url.searchParams.set("s", param);
  } else {
    url.searchParams.delete("s");
  }
  window.history.replaceState(null, "", url.pathname + url.search);
}

export function useBuilderState(slots: Slot[], allTools: Tool[]) {
  const searchParams = useSearchParams();

  // Local state is the source of truth for the UI — initialized from URL on mount.
  // URL is synced via window.history.replaceState (no router round-trip = no lag).
  const [toolIds, setToolIds] = useState<string[]>(() => {
    const param = searchParams.get("s") ?? "";
    return param.split(",").filter(Boolean);
  });

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [compareA, setCompareA] = useState<Tool | null>(null);
  const [compareB, setCompareB] = useState<Tool | null>(null);
  const [collapsedSlots, setCollapsedSlots] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(slots.map((s) => [s.id, true]))
  );
  const [mobileSlotPickerOpen, setMobileSlotPickerOpen] = useState(false);

  // Slot-constrained selection for the sidebar — first occurrence per slot wins
  const selected = useMemo<Record<string, string>>(() => {
    const result: Record<string, string> = {};
    for (const toolId of toolIds) {
      const slot = slots.find((s) => s.tools.includes(toolId));
      if (slot && !result[slot.id]) result[slot.id] = toolId;
    }
    return result;
  }, [toolIds, slots]);

  const selectedCount = Object.values(selected).filter(Boolean).length;

  const selectedTools = useMemo(
    () => toolIds.map((id) => allTools.find((t) => t.id === id)).filter(Boolean) as Tool[],
    [toolIds, allTools]
  );

  const story = useMemo(() => generateStackStory(selectedTools), [selectedTools]);

  const archetype = useMemo(() => detectArchetype(toolIds, allTools), [toolIds, allTools]);

  // stackParam for badge/share URLs — derived from local state, not URL
  const stackParam = toolIds.join(",");

  const pickTool = useCallback(
    (slotId: string, toolId: string) => {
      const next = {
        ...selected,
        [slotId]: selected[slotId] === toolId ? "" : toolId,
      };
      const param = Object.values(next).filter(Boolean).join(",");
      const nextIds = param.split(",").filter(Boolean);
      setToolIds(nextIds);
      syncUrl(param);
    },
    [selected]
  );

  const removeTool = useCallback(
    (toolId: string) => {
      const next = toolIds.filter((id) => id !== toolId);
      const param = next.join(",");
      setToolIds(next);
      syncUrl(param);
      if (expandedId === toolId) setExpandedId(null);
    },
    [toolIds, expandedId]
  );

  function handleCompareClick(tool: Tool, e: MouseEvent) {
    e.stopPropagation();
    if (compareA && compareB) {
      if (tool.id === compareA.id || tool.id === compareB.id) {
        setCompareA(null);
        setCompareB(null);
      } else {
        setCompareB(tool);
      }
      return;
    }
    if (!compareA) {
      setCompareA(tool);
      return;
    }
    if (compareA.id === tool.id) {
      setCompareA(null);
      return;
    }
    setCompareB(tool);
  }

  function toggleSlot(slotId: string) {
    setCollapsedSlots((prev) => ({ ...prev, [slotId]: !prev[slotId] }));
  }

  function clearCompare() {
    setCompareA(null);
    setCompareB(null);
  }

  function setStack(ids: string[]) {
    const param = ids.filter(Boolean).join(",");
    setToolIds(ids.filter(Boolean));
    syncUrl(param);
  }

  return {
    urlToolIds: toolIds,
    selected,
    selectedCount,
    selectedTools,
    story,
    archetype,
    stackParam,
    expandedId,
    setExpandedId,
    compareA,
    setCompareA,
    compareB,
    setCompareB,
    collapsedSlots,
    mobileSlotPickerOpen,
    setMobileSlotPickerOpen,
    pickTool,
    removeTool,
    setStack,
    handleCompareClick,
    toggleSlot,
    clearCompare,
  };
}
