import { useState, useMemo, useCallback, type MouseEvent } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Slot, Tool } from "@/lib/types";
import { generateStackStory } from "@/lib/stackStory";
import { detectArchetype } from "@/lib/genomeAnalysis";

export function useBuilderState(slots: Slot[], allTools: Tool[]) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stackParam = searchParams.get("s") ?? "";

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [compareA, setCompareA] = useState<Tool | null>(null);
  const [compareB, setCompareB] = useState<Tool | null>(null);
  const [collapsedSlots, setCollapsedSlots] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(slots.map((s) => [s.id, true]))
  );
  const [mobileSlotPickerOpen, setMobileSlotPickerOpen] = useState(false);

  // All tool IDs from the URL — used directly by the graph (no slot constraint)
  const urlToolIds = useMemo(() => stackParam.split(",").filter(Boolean), [stackParam]);

  // Slot-constrained selection for the sidebar — first occurrence per slot wins
  const selected = useMemo<Record<string, string>>(() => {
    const result: Record<string, string> = {};
    for (const toolId of urlToolIds) {
      const slot = slots.find((s) => s.tools.includes(toolId));
      if (slot && !result[slot.id]) result[slot.id] = toolId;
    }
    return result;
  }, [urlToolIds, slots]);

  const selectedCount = Object.values(selected).filter(Boolean).length;

  const selectedTools = useMemo(
    () => urlToolIds.map((id) => allTools.find((t) => t.id === id)).filter(Boolean) as Tool[],
    [urlToolIds, allTools]
  );

  const story = useMemo(() => generateStackStory(selectedTools), [selectedTools]);

  const archetype = useMemo(() => detectArchetype(urlToolIds, allTools), [urlToolIds, allTools]);

  const pickTool = useCallback(
    (slotId: string, toolId: string) => {
      const next = {
        ...selected,
        [slotId]: selected[slotId] === toolId ? "" : toolId,
      };
      const param = Object.values(next).filter(Boolean).join(",");
      const url = new URL(window.location.href);
      if (param) {
        url.searchParams.set("s", param);
      } else {
        url.searchParams.delete("s");
      }
      router.replace(url.pathname + url.search, { scroll: false });
    },
    [selected, router]
  );

  const removeTool = useCallback(
    (toolId: string) => {
      const next = urlToolIds.filter((id) => id !== toolId);
      const url = new URL(window.location.href);
      if (next.length > 0) {
        url.searchParams.set("s", next.join(","));
      } else {
        url.searchParams.delete("s");
      }
      router.replace(url.pathname + url.search, { scroll: false });
      if (expandedId === toolId) setExpandedId(null);
    },
    [urlToolIds, router, expandedId]
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

  return {
    urlToolIds,
    selected,
    selectedCount,
    selectedTools,
    story,
    archetype,
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
    handleCompareClick,
    toggleSlot,
    clearCompare,
  };
}
