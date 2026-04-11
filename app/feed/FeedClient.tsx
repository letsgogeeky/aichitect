"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  getCategoryColor,
  CATEGORIES,
  type FeedEvent,
  type FeedResponse,
  type ToolEventType,
} from "@/lib/types";
import { formatRelativeTime } from "@/lib/format";
import { useUser } from "@/hooks/useUser";
import { FILTER_TABS } from "./tabs";

// ── Event description helpers ──────────────────────────────────────────────

type EventMeta = Record<string, unknown>;

function eventDescription(
  type: ToolEventType,
  metadata: EventMeta
): { text: string; color: string } {
  switch (type) {
    case "health_score_change": {
      const { old_score, new_score, delta } = metadata as {
        old_score: number;
        new_score: number;
        delta: number;
      };
      const up = (delta ?? 0) > 0;
      return {
        text: `Health ${up ? "↑" : "↓"} ${old_score} → ${new_score}`,
        color: up ? "#26de81" : "#ff6b6b",
      };
    }
    case "stale_transition": {
      const { days_since_commit } = metadata as { days_since_commit: number };
      return {
        text: `Went stale — no commits in ${days_since_commit}d`,
        color: "#f39c12",
      };
    }
    case "archived_detected":
      return { text: "Repository archived on GitHub", color: "#ff6b6b" };
    case "pricing_change":
      return { text: "Pricing updated", color: "#74b9ff" };
    case "star_milestone": {
      const { milestone, stars } = metadata as { milestone: number; stars: number };
      return {
        text: `Crossed ${milestone.toLocaleString()} stars ⭐ (now ${stars.toLocaleString()})`,
        color: "#fdcb6e",
      };
    }
    default:
      return { text: type, color: "var(--text-muted)" };
  }
}

// ── Feed card ──────────────────────────────────────────────────────────────

function FeedCard({ event }: { event: FeedEvent }) {
  const color = getCategoryColor(event.tool_category);
  const catLabel =
    CATEGORIES.find((c) => c.id === event.tool_category)?.label ?? event.tool_category;
  const { text, color: eventColor } = eventDescription(event.type, event.metadata as EventMeta);

  return (
    <div
      className="rounded-xl px-4 py-3.5 flex items-start gap-3"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      {/* Left accent */}
      <div
        className="w-0.5 self-stretch rounded-full flex-shrink-0 mt-0.5"
        style={{ background: eventColor, minHeight: 16 }}
      />

      <div className="flex-1 min-w-0">
        {/* Tool + category */}
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <Link
            href={`/tool/${event.tool_id}`}
            className="text-sm font-semibold hover:underline"
            style={{ color: "var(--text-primary)" }}
          >
            {event.tool_name}
          </Link>
          <span
            className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
            style={{ background: color + "18", color, border: `1px solid ${color}33` }}
          >
            {catLabel}
          </span>
        </div>

        {/* Event description */}
        <p className="text-xs font-medium" style={{ color: eventColor }}>
          {text}
        </p>
      </div>

      {/* Timestamp */}
      <span
        className="text-[10px] flex-shrink-0 mt-0.5"
        style={{ color: "var(--text-muted)" }}
        title={event.detected_at}
      >
        {formatRelativeTime(event.detected_at)}
      </span>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function FeedClient() {
  const router = useRouter();
  const pathname = usePathname();

  // Derive active tab from the URL path segment
  const segment = pathname.split("/").pop() ?? "all";
  const activeTab = FILTER_TABS.some((t) => t.id === segment) ? segment : "all";

  const [savedOnly, setSavedOnly] = useState(false);
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
      if (tab?.types) params.set("types", tab.types.join(","));
      if (savedOnly) params.set("saved_only", "true");

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
    [activeTab, savedOnly]
  );

  useEffect(() => {
    fetchFeed(null, true);
  }, [fetchFeed]);

  function handleTabClick(tabId: string) {
    router.push(tabId === "all" ? "/feed" : `/feed/${tabId}`);
  }

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

      {/* Filter tabs */}
      <div className="flex items-center gap-1.5 mb-4 flex-wrap">
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

        {/* My stack filter — authenticated users only */}
        {user && (
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
            No activity yet — check back after the first nightly sync.
          </p>
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
