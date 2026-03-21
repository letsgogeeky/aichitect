import { useState, useCallback, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Tool } from "@/lib/types";

type PanelMode = "compare" | "detail" | "compare-hint" | "none";

export function useComparisonMode(initialComparison: [Tool, Tool] | null) {
  const router = useRouter();
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [compareMode, setCompareMode] = useState(!!initialComparison);
  const [comparisonTools, setComparisonTools] = useState<[Tool, Tool] | null>(initialComparison);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (comparisonTools) {
      url.searchParams.set("compare", `${comparisonTools[0].id},${comparisonTools[1].id}`);
    } else {
      url.searchParams.delete("compare");
    }
    router.replace(url.pathname + url.search, { scroll: false });
  }, [comparisonTools, router]);

  const handleNodeSelect = useCallback(
    (tool: Tool) => {
      if (!compareMode) {
        setSelectedTool((prev) => (prev?.id === tool.id ? null : tool));
        return;
      }

      if (comparisonTools) {
        const [a, b] = comparisonTools;
        if (a.id === tool.id || b.id === tool.id) {
          setComparisonTools(null);
        } else {
          setComparisonTools([a, tool]);
        }
        return;
      }

      if (!selectedTool) {
        setSelectedTool(tool);
        return;
      }

      if (selectedTool.id === tool.id) {
        setSelectedTool(null);
        return;
      }

      setComparisonTools([selectedTool, tool]);
      setSelectedTool(null);
    },
    [compareMode, selectedTool, comparisonTools]
  );

  const highlightedIds = useMemo(() => {
    if (comparisonTools) return new Set([comparisonTools[0].id, comparisonTools[1].id]);
    if (selectedTool) return new Set([selectedTool.id]);
    return new Set<string>();
  }, [comparisonTools, selectedTool]);

  const panelMode: PanelMode = comparisonTools
    ? "compare"
    : !compareMode && selectedTool
      ? "detail"
      : compareMode
        ? "compare-hint"
        : "none";

  return {
    selectedTool,
    setSelectedTool,
    compareMode,
    setCompareMode,
    comparisonTools,
    setComparisonTools,
    handleNodeSelect,
    highlightedIds,
    panelMode,
  };
}
