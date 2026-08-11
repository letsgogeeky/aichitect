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
    case "benchmark_drift": {
      const m = metadata as {
        ttft_delta_pct: number | null;
        throughput_delta_pct: number | null;
      };
      const thr = m.throughput_delta_pct;
      const ttft = m.ttft_delta_pct;
      if (thr != null && Math.abs(thr) >= Math.abs(ttft ?? 0)) {
        const better = thr > 0; // higher throughput = faster
        return {
          text: `Throughput ${better ? "↑" : "↓"} ${thr > 0 ? "+" : ""}${thr.toFixed(0)}% WoW`,
          color: better ? "#26de81" : "#ff6b6b",
        };
      }
      if (ttft != null) {
        const better = ttft < 0; // lower TTFT = faster
        return {
          text: `TTFT ${better ? "↓" : "↑"} ${ttft > 0 ? "+" : ""}${ttft.toFixed(0)}% WoW`,
          color: better ? "#26de81" : "#ff6b6b",
        };
      }
      return { text: "Benchmark drift", color: "var(--text-muted)" };
    }
    case "star_milestone": {
      const { milestone, stars } = metadata as { milestone: number; stars: number };
      return {
        text: `Crossed ${milestone.toLocaleString()} stars ⭐ (now ${stars.toLocaleString()})`,
        color: "#fdcb6e",
      };
    }
    case "incident_started": {
      const m = metadata as { severity: string; title: string };
      return {
        text: `${m.severity === "critical" ? "Critical" : "Major"} incident: ${m.title}`,
        color: m.severity === "critical" ? "#ff4757" : "#ff6b6b",
      };
    }
    case "incident_resolved": {
      const m = metadata as { duration_minutes?: number; title: string };
      const dur = m.duration_minutes;
      const durStr = dur == null ? "" : dur < 60 ? `${dur}min` : `${(dur / 60).toFixed(1)}h`;
      return {
        text: `Resolved: ${m.title}${durStr ? ` (${durStr})` : ""}`,
        color: "#26de81",
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

          <p className="text-[11px] pt-1" style={{ color: "var(--text-muted)" }}>
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
        diff?: Record<string, { old: unknown; new: unknown; delta_pct?: number }>;
      };

      // Prefer the structured diff (banked alongside tool_pricing_history) — it
      // gives us per-field deltas with delta_pct for free. Falls back to the
      // plan-list comparison for events written before that field existed.
      if (m.diff && Object.keys(m.diff).length > 0) {
        const entries = Object.entries(m.diff);
        return (
          <div className="space-y-1.5">
            {entries.map(([field, change]) => {
              const cleanField = field.replace(/^cost_model\./, "").replace(/^pricing\./, "");
              const isNumericDrop = typeof change.delta_pct === "number" && change.delta_pct < 0;
              const isNumericRise = typeof change.delta_pct === "number" && change.delta_pct > 0;
              return (
                <div key={field} className="flex items-baseline gap-2 text-xs">
                  <span
                    className="font-mono"
                    style={{ color: "var(--text-muted)", minWidth: 0, flexShrink: 0 }}
                  >
                    {cleanField}
                  </span>
                  <span style={{ color: "var(--text-secondary)" }}>
                    {formatDiffValue(change.old)} → {formatDiffValue(change.new)}
                  </span>
                  {typeof change.delta_pct === "number" && (
                    <span
                      style={{
                        color: isNumericDrop
                          ? "var(--success)"
                          : isNumericRise
                            ? "var(--danger)"
                            : "var(--text-muted)",
                        fontWeight: 500,
                      }}
                    >
                      {change.delta_pct > 0 ? "+" : ""}
                      {change.delta_pct.toFixed(1)}%
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        );
      }

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
            <p className="type-overline mb-1.5" style={{ color: "var(--text-muted)" }}>
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
            <p className="type-overline mb-1.5" style={{ color: "#74b9ff" }}>
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

    case "incident_started":
    case "incident_resolved": {
      const m = metadata as {
        severity: string;
        title: string;
        scope: string[];
        url: string;
        started_at: string;
        ended_at?: string;
        duration_minutes?: number;
      };
      const isResolved = type === "incident_resolved";
      return (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span style={{ color: "var(--text-muted)", fontSize: 12, minWidth: 100 }}>
              Severity
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: 0.4,
                color:
                  m.severity === "critical"
                    ? "#ff4757"
                    : m.severity === "major"
                      ? "#ff6b6b"
                      : "var(--text-secondary)",
              }}
            >
              {m.severity}
            </span>
          </div>
          {m.scope.length > 0 && (
            <div className="flex items-baseline gap-2">
              <span style={{ color: "var(--text-muted)", fontSize: 12, minWidth: 100 }}>Scope</span>
              <span style={{ color: "var(--text-secondary)", fontSize: 12 }}>
                {m.scope.join(", ")}
              </span>
            </div>
          )}
          {isResolved && m.duration_minutes != null && (
            <div className="flex items-center gap-2">
              <span style={{ color: "var(--text-muted)", fontSize: 12, minWidth: 100 }}>
                Duration
              </span>
              <span style={{ color: "var(--text-primary)", fontSize: 12, fontWeight: 500 }}>
                {m.duration_minutes < 60
                  ? `${m.duration_minutes} min`
                  : `${(m.duration_minutes / 60).toFixed(1)} h`}
              </span>
            </div>
          )}
          {m.url && (
            <a
              href={m.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs underline"
              style={{ color: "var(--accent-2)" }}
            >
              View status page →
            </a>
          )}
        </div>
      );
    }

    case "benchmark_drift": {
      const m = metadata as {
        ttft_delta_pct: number | null;
        throughput_delta_pct: number | null;
        old_ttft_ms: number | null;
        new_ttft_ms: number | null;
        old_throughput: number | null;
        new_throughput: number | null;
        model_slug?: string | null;
      };
      const rows = [
        {
          label: "Throughput",
          old: m.old_throughput,
          new: m.new_throughput,
          delta: m.throughput_delta_pct,
          unit: " tok/s",
          improved: (d: number) => d > 0,
        },
        {
          label: "TTFT",
          old: m.old_ttft_ms,
          new: m.new_ttft_ms,
          delta: m.ttft_delta_pct,
          unit: " ms",
          improved: (d: number) => d < 0,
        },
      ].filter((r) => r.delta != null);

      return (
        <div className="space-y-1.5">
          {rows.map((r) => {
            const better = r.delta != null && r.improved(r.delta);
            return (
              <div key={r.label} className="flex items-center gap-3 text-xs">
                <span style={{ color: "var(--text-muted)", minWidth: 100 }}>{r.label}</span>
                <span style={{ color: "var(--text-secondary)" }}>
                  {r.old ?? "—"}
                  {r.unit} → {r.new ?? "—"}
                  {r.unit}
                </span>
                <span
                  style={{
                    color: better ? "var(--success)" : "var(--danger)",
                    fontWeight: 500,
                  }}
                >
                  {r.delta != null && r.delta > 0 ? "+" : ""}
                  {r.delta?.toFixed(1)}%
                </span>
              </div>
            );
          })}
          {m.model_slug && (
            <p className="text-[11px] pt-1" style={{ color: "var(--text-muted)" }}>
              Sourced from Artificial Analysis · model slug{" "}
              <span className="font-mono">{m.model_slug}</span>
            </p>
          )}
        </div>
      );
    }

    default:
      return null;
  }
}

function formatDiffValue(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "boolean") return v ? "yes" : "no";
  if (typeof v === "number") {
    if (v >= 1) return v.toLocaleString("en-US", { maximumFractionDigits: 2 });
    return v.toFixed(Math.min(6, Math.max(2, -Math.floor(Math.log10(Math.abs(v))) + 2)));
  }
  if (typeof v === "string") return v;
  return JSON.stringify(v);
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
              className="text-[11px] font-medium px-1.5 py-0.5 rounded-full"
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
            className="text-[11px]"
            style={{ color: "var(--text-muted)" }}
            title={event.detected_at}
          >
            {formatRelativeTime(event.detected_at)}
          </span>

          {/* Share link — navigates to per-event page */}
          <Link
            href={`/feed/event/${event.id}`}
            onClick={(e) => e.stopPropagation()}
            className="text-[11px] px-1.5 py-0.5 rounded transition-colors"
            style={{ color: "var(--text-muted)", border: "1px solid var(--border)" }}
            title="View event page"
          >
            ↗
          </Link>

          {/* Chevron */}
          <span
            className="text-[11px] transition-transform"
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
