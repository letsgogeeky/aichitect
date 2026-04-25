"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { FeedEvent, FeedResponse, ToolEventType } from "@/lib/types";
import { getCategoryColor } from "@/lib/types";
import { useUser } from "@/hooks/useUser";
import { FILTER_TABS } from "./tabs";
import { FeedCard } from "./components/FeedCard";
import toolsData from "@/data/tools.json";

type ToolEntry = { id: string; name: string; category: string };
const allTools = toolsData as ToolEntry[];
const toolIndex = new Map(allTools.map((t) => [t.id, t.name]));

// ── Tool picker ────────────────────────────────────────────────────────────

function ToolPicker({
  activeIds,
  onToggle,
  onClose,
}: {
  activeIds: string[];
  onToggle: (id: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [onClose]);

  const results = query.trim()
    ? allTools.filter((t) => t.name.toLowerCase().includes(query.toLowerCase())).slice(0, 12)
    : allTools
        .filter((t) => activeIds.includes(t.id))
        .concat(allTools.filter((t) => !activeIds.includes(t.id)).slice(0, 12 - activeIds.length));

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      {/* Trigger / input */}
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        placeholder="Search tools…"
        className="text-xs px-3 py-1.5 rounded-full outline-none"
        style={{
          background: "var(--surface-2)",
          border: "1px solid var(--accent)",
          color: "var(--text-primary)",
          width: 160,
        }}
      />

      {/* Dropdown */}
      <div
        className="absolute left-0 top-full mt-1.5 rounded-xl overflow-hidden z-50"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          width: 240,
          maxHeight: 280,
          overflowY: "auto",
          boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
        }}
      >
        {results.length === 0 ? (
          <p className="text-xs px-3 py-3" style={{ color: "var(--text-muted)" }}>
            No tools found.
          </p>
        ) : (
          results.map((t) => {
            const active = activeIds.includes(t.id);
            const color = getCategoryColor(t.category as Parameters<typeof getCategoryColor>[0]);
            return (
              <button
                key={t.id}
                onClick={() => onToggle(t.id)}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors"
                style={{
                  background: active ? "#7c6bff10" : "transparent",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: color }}
                />
                <span
                  className="flex-1 text-xs truncate"
                  style={{ color: active ? "var(--accent)" : "var(--text-secondary)" }}
                >
                  {t.name}
                </span>
                {active && (
                  <span className="text-[10px]" style={{ color: "var(--accent)" }}>
                    ✓
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function FeedClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const segment = pathname.split("/").pop() ?? "all";
  const activeTab = FILTER_TABS.some((t) => t.id === segment) ? segment : "all";

  const toolParam = searchParams.get("tool") ?? "";
  const activeToolIds = toolParam ? toolParam.split(",").filter(Boolean) : [];

  const [savedOnly, setSavedOnly] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const { user } = useUser();

  const fetchFeed = useCallback(
    async (cursor: string | null, replace: boolean) => {
      if (replace) setLoading(true);
      else setLoadingMore(true);

      const tab = FILTER_TABS.find((t) => t.id === activeTab);
      const params = new URLSearchParams();
      if (cursor) params.set("cursor", cursor);
      if (tab?.types) params.set("types", (tab.types as ToolEventType[]).join(","));
      if (toolParam) params.set("tools", toolParam);
      if (savedOnly && !toolParam) params.set("saved_only", "true");

      try {
        const res = await fetch(`/api/feed?${params}`);
        const data: FeedResponse = res.ok ? await res.json() : { events: [], next_cursor: null };
        if (replace) setEvents(data.events);
        else setEvents((prev) => [...prev, ...data.events]);
        setNextCursor(data.next_cursor);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [activeTab, savedOnly, toolParam]
  );

  useEffect(() => {
    fetchFeed(null, true);
  }, [fetchFeed]);

  function feedUrl(tabId: string, tools: string[]) {
    const base = tabId === "all" ? "/feed" : `/feed/${tabId}`;
    const q = tools.length > 0 ? `?tool=${tools.join(",")}` : "";
    return `${base}${q}`;
  }

  function handleTabClick(tabId: string) {
    router.push(feedUrl(tabId, activeToolIds));
  }

  function toggleTool(toolId: string) {
    const next = activeToolIds.includes(toolId)
      ? activeToolIds.filter((id) => id !== toolId)
      : [...activeToolIds, toolId];
    router.push(feedUrl(activeTab, next));
  }

  function removeTool(toolId: string) {
    router.push(
      feedUrl(
        activeTab,
        activeToolIds.filter((id) => id !== toolId)
      )
    );
  }

  function clearTools() {
    router.push(feedUrl(activeTab, []));
    setPickerOpen(false);
  }

  const hasToolFilter = activeToolIds.length > 0;

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>
          Activity Feed
        </h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          What changed in the AI tools ecosystem — updated nightly.
        </p>
      </div>

      {/* Event type tabs */}
      <div className="flex items-center gap-1.5 mb-3 flex-wrap">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className="text-xs px-3 py-1.5 rounded-full transition-colors"
            style={
              activeTab === tab.id
                ? { background: "#7c6bff22", color: "var(--accent)", border: "1px solid #7c6bff44" }
                : {
                    background: "var(--surface-2)",
                    color: "var(--text-muted)",
                    border: "1px solid var(--border)",
                  }
            }
          >
            {tab.label}
          </button>
        ))}

        {user && !hasToolFilter && (
          <button
            onClick={() => setSavedOnly((v) => !v)}
            className="text-xs px-3 py-1.5 rounded-full transition-colors ml-auto"
            style={
              savedOnly
                ? {
                    background: "#00d4aa18",
                    color: "var(--accent-2)",
                    border: "1px solid #00d4aa33",
                  }
                : {
                    background: "var(--surface-2)",
                    color: "var(--text-muted)",
                    border: "1px solid var(--border)",
                  }
            }
          >
            {savedOnly ? "● My stacks" : "My stacks"}
          </button>
        )}
      </div>

      {/* Tool filter row */}
      <div className="flex items-center gap-1.5 mb-4 flex-wrap">
        {activeToolIds.map((toolId) => (
          <span
            key={toolId}
            className="flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-full"
            style={{
              background: "#7c6bff18",
              color: "var(--accent)",
              border: "1px solid #7c6bff33",
            }}
          >
            <Link
              href={`/tool/${toolId}`}
              className="hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {toolIndex.get(toolId) ?? toolId}
            </Link>
            <button
              onClick={() => removeTool(toolId)}
              className="leading-none opacity-60 hover:opacity-100 transition-opacity"
              aria-label={`Remove ${toolIndex.get(toolId) ?? toolId} filter`}
            >
              ×
            </button>
          </span>
        ))}

        {/* Clear all */}
        {activeToolIds.length > 1 && (
          <button
            onClick={clearTools}
            className="text-[11px] px-2 py-1 rounded-full transition-colors"
            style={{ color: "var(--text-muted)", border: "1px solid var(--border)" }}
          >
            Clear all
          </button>
        )}

        {/* Picker toggle / input */}
        {pickerOpen ? (
          <ToolPicker
            activeIds={activeToolIds}
            onToggle={toggleTool}
            onClose={() => setPickerOpen(false)}
          />
        ) : (
          <button
            onClick={() => setPickerOpen(true)}
            className="text-[11px] px-2.5 py-1 rounded-full transition-colors"
            style={{
              background: hasToolFilter ? "transparent" : "var(--surface-2)",
              color: "var(--text-muted)",
              border: "1px solid var(--border)",
            }}
          >
            {hasToolFilter ? "+ Add tool" : "+ Filter by tool"}
          </button>
        )}
      </div>

      {/* Feed */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="rounded-xl h-16 animate-pulse"
              style={{ background: "var(--surface)" }}
            />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div
          className="rounded-xl p-10 text-center"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {hasToolFilter
              ? "No activity yet for this selection — check back after the next nightly sync."
              : "No activity yet — check back after the first nightly sync."}
          </p>
          {hasToolFilter && (
            <button
              onClick={clearTools}
              className="mt-3 text-xs hover:underline"
              style={{ color: "var(--accent)" }}
            >
              Clear filter and view all activity →
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {events.map((event) => (
            <FeedCard key={event.id} event={event} />
          ))}
          {nextCursor && (
            <button
              onClick={() => fetchFeed(nextCursor, false)}
              disabled={loadingMore}
              className="w-full py-2.5 rounded-xl text-xs font-medium transition-colors mt-2"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                color: loadingMore ? "var(--text-muted)" : "var(--text-secondary)",
              }}
            >
              {loadingMore ? "Loading…" : "Load more"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
