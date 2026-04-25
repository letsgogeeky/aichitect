"use client";

import { useState } from "react";
import Link from "next/link";
import { getCategoryColor, CATEGORIES, type FeedEvent, type ToolEventType } from "@/lib/types";
import { formatRelativeTime } from "@/lib/format";

// ── Event meta helpers ─────────────────────────────────────────────────────

type EventMeta = Record<string, unknown>;

export function eventDescription(
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

// ── Expanded detail per event type ─────────────────────────────────────────

function ExpandedDetail({ type, metadata }: { type: ToolEventType; metadata: EventMeta }) {
  switch (type) {
    case "health_score_change": {
      const m = metadata as {
        old_score: number;
        new_score: number;
        delta: number;
        stars_delta?: number | null;
        days_since_commit?: number | null;
        was_stale?: boolean;
        is_stale?: boolean;
      };
      const up = m.delta > 0;
      const signalColor = up ? "#26de81" : "#ff6b6b";
      return (
        <div className="space-y-2">
          {/* Score bar */}
          <div className="flex items-center gap-3">
            <span className="text-xs" style={{ color: "var(--text-muted)", minWidth: 40 }}>
              Score
            </span>
            <div
              className="flex-1 h-1.5 rounded-full overflow-hidden"
              style={{ background: "var(--surface-2)" }}
            >
              <div
                className="h-full rounded-full"
                style={{ width: `${m.new_score}%`, background: signalColor }}
              />
            </div>
            <span className="text-xs font-semibold tabular-nums" style={{ color: signalColor }}>
              {m.old_score} → {m.new_score} ({m.delta > 0 ? "+" : ""}
              {m.delta})
            </span>
          </div>

          {/* Signals — only shown if enriched metadata is present */}
          {m.days_since_commit != null && (
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: "var(--text-muted)", minWidth: 120 }}>
                Last commit
              </span>
              <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                {m.days_since_commit === 0
                  ? "Today"
                  : m.days_since_commit === 1
                    ? "1 day ago"
                    : `${m.days_since_commit} days ago`}
              </span>
            </div>
          )}
          {m.stars_delta != null && (
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: "var(--text-muted)", minWidth: 120 }}>
                Star momentum
              </span>
              <span
                className="text-xs font-medium"
                style={{ color: m.stars_delta > 0 ? "#fdcb6e" : "var(--text-muted)" }}
              >
                {m.stars_delta > 0 ? "+" : ""}
                {m.stars_delta.toLocaleString()} vs 30d snapshot
              </span>
            </div>
          )}
          {m.was_stale != null && m.is_stale != null && (
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: "var(--text-muted)", minWidth: 120 }}>
                Stale status
              </span>
              <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                {m.was_stale ? "stale" : "active"} → {m.is_stale ? "stale" : "active"}
              </span>
            </div>
          )}

          <p className="text-[10px] pt-1" style={{ color: "var(--text-muted)" }}>
            Score = commit recency (40 pts) + star momentum (30 pts) + issue ratio (20 pts) + forks
            (10 pts)
          </p>
        </div>
      );
    }

    case "star_milestone": {
      const { milestone, stars } = metadata as { milestone: number; stars: number };
      return (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: "var(--text-muted)", minWidth: 120 }}>
              Milestone reached
            </span>
            <span className="text-xs font-semibold" style={{ color: "#fdcb6e" }}>
              {milestone.toLocaleString()} ⭐
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: "var(--text-muted)", minWidth: 120 }}>
              Stars at detection
            </span>
            <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
              {stars.toLocaleString()}
            </span>
          </div>
        </div>
      );
    }

    case "stale_transition": {
      const { days_since_commit, archived } = metadata as {
        days_since_commit: number;
        archived: boolean;
      };
      return (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: "var(--text-muted)", minWidth: 120 }}>
              Days without commit
            </span>
            <span className="text-xs font-medium" style={{ color: "#f39c12" }}>
              {days_since_commit} days
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: "var(--text-muted)", minWidth: 120 }}>
              GitHub status
            </span>
            <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
              {archived ? "Archived" : "Active but inactive"}
            </span>
          </div>
        </div>
      );
    }

    case "archived_detected":
      return (
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          This repository has been archived on GitHub — it is read-only and no longer accepting
          contributions. Consider migrating to an active alternative.
        </p>
      );

    case "pricing_change": {
      const m = metadata as {
        old_pricing: { free_tier: boolean; plans: { name: string; price: string }[] } | null;
        new_pricing: { free_tier: boolean; plans: { name: string; price: string }[] } | null;
      };
      if (!m.old_pricing || !m.new_pricing) {
        return (
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Pricing data was updated. View the tool page for current pricing.
          </p>
        );
      }
      return (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p
              className="text-[10px] font-semibold uppercase tracking-wider mb-1.5"
              style={{ color: "var(--text-muted)" }}
            >
              Before
            </p>
            <div className="space-y-1">
              {m.old_pricing.plans.map((p, i) => (
                <div key={i} className="flex justify-between text-xs">
                  <span style={{ color: "var(--text-secondary)" }}>{p.name}</span>
                  <span style={{ color: "var(--text-muted)" }}>{p.price}</span>
                </div>
              ))}
              {m.old_pricing.plans.length === 0 && (
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  No plans
                </span>
              )}
            </div>
          </div>
          <div>
            <p
              className="text-[10px] font-semibold uppercase tracking-wider mb-1.5"
              style={{ color: "#74b9ff" }}
            >
              After
            </p>
            <div className="space-y-1">
              {m.new_pricing.plans.map((p, i) => (
                <div key={i} className="flex justify-between text-xs">
                  <span style={{ color: "var(--text-secondary)" }}>{p.name}</span>
                  <span style={{ color: "#74b9ff" }}>{p.price}</span>
                </div>
              ))}
              {m.new_pricing.plans.length === 0 && (
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  No plans
                </span>
              )}
            </div>
          </div>
        </div>
      );
    }

    default:
      return null;
  }
}

// ── FeedCard ───────────────────────────────────────────────────────────────

export function FeedCard({ event }: { event: FeedEvent }) {
  const [expanded, setExpanded] = useState(false);

  const color = getCategoryColor(event.tool_category);
  const catLabel =
    CATEGORIES.find((c) => c.id === event.tool_category)?.label ?? event.tool_category;
  const { text, color: eventColor } = eventDescription(event.type, event.metadata as EventMeta);

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      {/* Main row — clickable to expand */}
      <button
        className="w-full text-left px-4 py-3.5 flex items-start gap-3"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        {/* Left accent */}
        <div
          className="w-0.5 self-stretch rounded-full flex-shrink-0 mt-0.5"
          style={{ background: eventColor, minHeight: 16 }}
        />

        <div className="flex-1 min-w-0">
          {/* Tool + category */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {event.tool_name}
            </span>
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

        {/* Right side: timestamp + share + chevron */}
        <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
          <span
            className="text-[10px]"
            style={{ color: "var(--text-muted)" }}
            title={event.detected_at}
          >
            {formatRelativeTime(event.detected_at)}
          </span>

          {/* Share link — navigates to per-event page */}
          <Link
            href={`/feed/event/${event.id}`}
            onClick={(e) => e.stopPropagation()}
            className="text-[10px] px-1.5 py-0.5 rounded transition-colors"
            style={{ color: "var(--text-muted)", border: "1px solid var(--border)" }}
            title="View event page"
          >
            ↗
          </Link>

          {/* Chevron */}
          <span
            className="text-[10px] transition-transform"
            style={{
              color: "var(--text-muted)",
              transform: expanded ? "rotate(180deg)" : "none",
              display: "inline-block",
            }}
          >
            ▾
          </span>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-3.5" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="pt-3">
            <ExpandedDetail type={event.type} metadata={event.metadata as EventMeta} />
          </div>
          <div
            className="flex items-center gap-3 mt-3 pt-2.5"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            <Link
              href={`/tool/${event.tool_id}`}
              className="text-[11px] font-medium hover:underline"
              style={{ color: "var(--accent)" }}
            >
              View {event.tool_name} →
            </Link>
            <Link
              href={`/feed/event/${event.id}`}
              className="text-[11px]"
              style={{ color: "var(--text-muted)" }}
            >
              Permalink ↗
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
