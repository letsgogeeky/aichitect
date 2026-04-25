import { notFound } from "next/navigation";
import Link from "next/link";
import { cache } from "react";
import { supabase } from "@/lib/db";
import {
  getCategoryColor,
  CATEGORIES,
  type CategoryId,
  type ToolEventType,
  type ToolEventMetadata,
} from "@/lib/types";
import { pageMeta } from "@/lib/metadata";
import { formatRelativeTime } from "@/lib/format";
import { SITE_URL } from "@/lib/constants";

// ── Data fetching ─────────────────────────────────────────────────────────

interface EventDetail {
  id: string;
  tool_id: string;
  tool_name: string;
  tool_category: CategoryId;
  type: ToolEventType;
  metadata: ToolEventMetadata;
  detected_at: string;
  old_hash: string | null;
  new_hash: string | null;
}

const getEvent = cache(async (eventId: string): Promise<EventDetail | null> => {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("tool_events")
    .select(
      "id, tool_id, type, detected_at, old_hash, new_hash, metadata, tools!inner(name, category)"
    )
    .eq("id", eventId)
    .single();
  if (error || !data) return null;

  const toolRaw = data.tools as unknown as
    | { name: string; category: string }[]
    | { name: string; category: string };
  const tool = Array.isArray(toolRaw) ? toolRaw[0] : toolRaw;

  return {
    id: data.id as string,
    tool_id: data.tool_id as string,
    tool_name: tool.name,
    tool_category: tool.category as CategoryId,
    type: data.type as ToolEventType,
    metadata: (data.metadata ?? {}) as ToolEventMetadata,
    detected_at: data.detected_at as string,
    old_hash: data.old_hash as string | null,
    new_hash: data.new_hash as string | null,
  };
});

// ── Title / description generators ────────────────────────────────────────

type Meta = Record<string, unknown>;

function eventTitle(event: EventDetail): string {
  const m = event.metadata as Meta;
  switch (event.type) {
    case "health_score_change":
      return `${event.tool_name} health score: ${m.old_score} → ${m.new_score}`;
    case "star_milestone":
      return `${event.tool_name} crossed ${Number(m.milestone).toLocaleString()} stars`;
    case "pricing_change":
      return `${event.tool_name} pricing updated`;
    case "stale_transition":
      return `${event.tool_name} flagged stale — ${m.days_since_commit} days without a commit`;
    case "archived_detected":
      return `${event.tool_name} archived on GitHub`;
    default:
      return `${event.tool_name} — activity update`;
  }
}

function eventSummary(event: EventDetail): string {
  const m = event.metadata as Meta;
  switch (event.type) {
    case "health_score_change": {
      const delta = Number(m.delta);
      return `${event.tool_name}'s health score ${delta > 0 ? "improved" : "dropped"} from ${m.old_score} to ${m.new_score} (${delta > 0 ? "+" : ""}${delta} pts). Scored nightly from commit recency, star momentum, issue ratio, and fork count.`;
    }
    case "star_milestone":
      return `${event.tool_name} crossed the ${Number(m.milestone).toLocaleString()} star milestone on GitHub, reaching ${Number(m.stars).toLocaleString()} total stars.`;
    case "pricing_change":
      return `${event.tool_name}'s pricing or cost model was updated. Check the tool page for current plan details.`;
    case "stale_transition":
      return `${event.tool_name} was flagged as stale after ${m.days_since_commit} days without a commit. ${m.archived ? "The repository is also archived on GitHub." : ""}`;
    case "archived_detected":
      return `${event.tool_name}'s GitHub repository has been archived. It is now read-only and no longer accepting contributions.`;
    default:
      return `Activity event detected for ${event.tool_name}.`;
  }
}

// ── Tab lookup ─────────────────────────────────────────────────────────────

const EVENT_TAB: Partial<Record<ToolEventType, string>> = {
  health_score_change: "health",
  star_milestone: "stars",
  stale_transition: "stale",
  archived_detected: "archived",
  pricing_change: "pricing",
};

// ── Metadata ──────────────────────────────────────────────────────────────

type Props = { params: Promise<{ eventId: string }> };

export async function generateMetadata({ params }: Props) {
  const { eventId } = await params;
  const event = await getEvent(eventId);
  if (!event) return {};

  const title = eventTitle(event);
  const description = eventSummary(event);

  return pageMeta({
    title: `${title} | AIchitect Activity`,
    description,
    path: `/feed/event/${eventId}`,
    ogImage: `/feed/event/${eventId}/opengraph-image`,
    ogImageAlt: title,
  });
}

// ── Detail sections ───────────────────────────────────────────────────────

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div
      className="flex items-start gap-4 py-2.5"
      style={{ borderBottom: "1px solid var(--border)" }}
    >
      <span className="text-xs w-36 flex-shrink-0 pt-0.5" style={{ color: "var(--text-muted)" }}>
        {label}
      </span>
      <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
        {value}
      </span>
    </div>
  );
}

function EventDetailSection({ event }: { event: EventDetail }) {
  const m = event.metadata as Meta;

  switch (event.type) {
    case "health_score_change": {
      const delta = Number(m.delta);
      const signalColor = delta > 0 ? "#26de81" : "#ff6b6b";
      return (
        <div>
          {/* Score bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                Health score
              </span>
              <span className="text-sm font-bold tabular-nums" style={{ color: signalColor }}>
                {String(m.old_score)} → {String(m.new_score)}{" "}
                <span className="text-xs font-normal">
                  ({delta > 0 ? "+" : ""}
                  {delta} pts)
                </span>
              </span>
            </div>
            <div
              className="relative h-2 rounded-full overflow-hidden"
              style={{ background: "var(--surface-2)" }}
            >
              <div
                className="absolute left-0 top-0 h-full rounded-full opacity-30"
                style={{ width: `${m.old_score}%`, background: signalColor }}
              />
              <div
                className="absolute left-0 top-0 h-full rounded-full"
                style={{ width: `${m.new_score}%`, background: signalColor }}
              />
            </div>
          </div>

          <div style={{ borderTop: "1px solid var(--border)" }}>
            <p
              className="text-xs font-semibold uppercase tracking-wider pt-4 mb-1"
              style={{ color: "var(--text-muted)" }}
            >
              Signals
            </p>
            {m.days_since_commit != null && (
              <DetailRow
                label="Commit recency"
                value={
                  m.days_since_commit === 0
                    ? "Today"
                    : m.days_since_commit === 1
                      ? "1 day ago"
                      : `${m.days_since_commit} days ago`
                }
              />
            )}
            {m.stars_delta != null && (
              <DetailRow
                label="Star momentum"
                value={
                  <span
                    style={{ color: Number(m.stars_delta) > 0 ? "#fdcb6e" : "var(--text-muted)" }}
                  >
                    {Number(m.stars_delta) > 0 ? "+" : ""}
                    {Number(m.stars_delta).toLocaleString()} vs 30d snapshot
                  </span>
                }
              />
            )}
            {m.was_stale != null && m.is_stale != null && (
              <DetailRow
                label="Stale status"
                value={`${m.was_stale ? "stale" : "active"} → ${m.is_stale ? "stale" : "active"}`}
              />
            )}
            <div className="pt-4 pb-2">
              <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
                The health score is computed nightly from four GitHub signals: commit recency (40
                pts), star momentum vs 30-day snapshot (30 pts), open issues-to-stars ratio (20
                pts), and fork count (10 pts). A score of 0 means the repository is archived.
              </p>
            </div>
          </div>
        </div>
      );
    }

    case "star_milestone":
      return (
        <div style={{ borderTop: "1px solid var(--border)" }}>
          <DetailRow
            label="Milestone crossed"
            value={
              <span style={{ color: "#fdcb6e" }}>{Number(m.milestone).toLocaleString()} ⭐</span>
            }
          />
          <DetailRow label="Stars at detection" value={Number(m.stars).toLocaleString()} />
        </div>
      );

    case "stale_transition":
      return (
        <div style={{ borderTop: "1px solid var(--border)" }}>
          <DetailRow
            label="Days without commit"
            value={<span style={{ color: "#f39c12" }}>{String(m.days_since_commit)} days</span>}
          />
          <DetailRow
            label="GitHub status"
            value={m.archived ? "Archived" : "Active but inactive"}
          />
          <div className="pt-4 pb-2">
            <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
              A tool is marked stale when its GitHub repository has had no commits in 90+ days, or
              when the repository has been archived. Stale tools are flagged in the Explore graph
              and Builder to help you identify maintenance risk.
            </p>
          </div>
        </div>
      );

    case "archived_detected":
      return (
        <div className="pt-4">
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            This repository has been archived on GitHub. It is read-only — no new commits, pull
            requests, or issues will be accepted. The project is effectively unmaintained.
          </p>
          <p className="text-xs mt-3 leading-relaxed" style={{ color: "var(--text-muted)" }}>
            Consider migrating to an active alternative. Use the Explore graph to discover
            comparable tools in the same category.
          </p>
        </div>
      );

    case "pricing_change": {
      const old_p = m.old_pricing as {
        free_tier: boolean;
        plans: { name: string; price: string }[];
      } | null;
      const new_p = m.new_pricing as {
        free_tier: boolean;
        plans: { name: string; price: string }[];
      } | null;
      if (!old_p || !new_p) {
        return (
          <div className="pt-4">
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Pricing data was updated. View the tool page for current plan details.
            </p>
          </div>
        );
      }
      return (
        <div className="grid grid-cols-2 gap-6 pt-4">
          <div>
            <p
              className="text-[10px] font-semibold uppercase tracking-wider mb-3"
              style={{ color: "var(--text-muted)" }}
            >
              Before
            </p>
            {old_p.free_tier && (
              <div
                className="text-xs mb-2 px-2 py-1 rounded"
                style={{ background: "#00d4aa0d", color: "#00d4aa" }}
              >
                ✦ Free tier
              </div>
            )}
            <div className="space-y-1.5">
              {old_p.plans.map((p, i) => (
                <div
                  key={i}
                  className="flex justify-between text-xs py-1.5"
                  style={{ borderBottom: "1px solid var(--border)" }}
                >
                  <span style={{ color: "var(--text-secondary)" }}>{p.name}</span>
                  <span style={{ color: "var(--text-muted)" }}>{p.price}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p
              className="text-[10px] font-semibold uppercase tracking-wider mb-3"
              style={{ color: "#74b9ff" }}
            >
              After
            </p>
            {new_p.free_tier && (
              <div
                className="text-xs mb-2 px-2 py-1 rounded"
                style={{ background: "#00d4aa0d", color: "#00d4aa" }}
              >
                ✦ Free tier
              </div>
            )}
            <div className="space-y-1.5">
              {new_p.plans.map((p, i) => (
                <div
                  key={i}
                  className="flex justify-between text-xs py-1.5"
                  style={{ borderBottom: "1px solid var(--border)" }}
                >
                  <span style={{ color: "var(--text-secondary)" }}>{p.name}</span>
                  <span style={{ color: "#74b9ff" }}>{p.price}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    default:
      return null;
  }
}

// ── Page ──────────────────────────────────────────────────────────────────

export default async function EventPage({ params }: Props) {
  const { eventId } = await params;
  const event = await getEvent(eventId);
  if (!event) notFound();

  const color = getCategoryColor(event.tool_category);
  const catLabel =
    CATEGORIES.find((c) => c.id === event.tool_category)?.label ?? event.tool_category;
  const title = eventTitle(event);
  const summary = eventSummary(event);
  const tabSlug = EVENT_TAB[event.type];

  const EVENT_TYPE_LABEL: Record<ToolEventType, string> = {
    health_score_change: "Health Score",
    star_milestone: "Star Milestone",
    stale_transition: "Stale Transition",
    archived_detected: "Archived",
    pricing_change: "Pricing Change",
  };

  const EVENT_TYPE_COLOR: Record<ToolEventType, string> = {
    health_score_change: "#26de81",
    star_milestone: "#fdcb6e",
    stale_transition: "#f39c12",
    archived_detected: "#ff6b6b",
    pricing_change: "#74b9ff",
  };

  const eventColor = EVENT_TYPE_COLOR[event.type] ?? "var(--text-muted)";
  const eventTypeLabel = EVENT_TYPE_LABEL[event.type] ?? event.type;

  // JSON-LD
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: title,
    datePublished: event.detected_at,
    description: summary,
    url: `${SITE_URL}/feed/event/${event.id}`,
    about: {
      "@type": "SoftwareApplication",
      name: event.tool_name,
    },
    publisher: {
      "@type": "Organization",
      name: "AIchitect",
      url: SITE_URL,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <nav
          className="flex items-center gap-1.5 text-xs mb-6"
          style={{ color: "var(--text-muted)" }}
        >
          <Link href="/" className="hover:underline">
            AIchitect
          </Link>
          <span>/</span>
          <Link href="/feed" className="hover:underline">
            Activity
          </Link>
          <span>/</span>
          {tabSlug && (
            <>
              <Link href={`/feed/${tabSlug}`} className="hover:underline capitalize">
                {eventTypeLabel}
              </Link>
              <span>/</span>
            </>
          )}
          <span style={{ color: "var(--text-secondary)" }}>{event.tool_name}</span>
        </nav>

        {/* Card */}
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderTop: `3px solid ${eventColor}`,
          }}
        >
          {/* Header */}
          <div className="px-6 pt-5 pb-4">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider"
                  style={{
                    background: eventColor + "18",
                    color: eventColor,
                    border: `1px solid ${eventColor}44`,
                  }}
                >
                  {eventTypeLabel}
                </span>
                <span
                  className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                  style={{ background: color + "18", color, border: `1px solid ${color}33` }}
                >
                  {catLabel}
                </span>
              </div>
              <span
                className="text-[11px] flex-shrink-0"
                style={{ color: "var(--text-muted)" }}
                title={event.detected_at}
              >
                {formatRelativeTime(event.detected_at)}
              </span>
            </div>

            <h1
              className="text-xl font-bold mb-2 leading-snug"
              style={{ color: "var(--text-primary)" }}
            >
              {title}
            </h1>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
              {summary}
            </p>
          </div>

          {/* Detail section */}
          <div className="px-6 pb-6" style={{ borderTop: "1px solid var(--border)" }}>
            <p
              className="text-[10px] font-semibold uppercase tracking-wider pt-4 mb-2"
              style={{ color: "var(--text-muted)" }}
            >
              Event detail
            </p>
            <EventDetailSection event={event} />
          </div>
        </div>

        {/* Footer links */}
        <div
          className="mt-4 rounded-xl px-5 py-4 flex items-center justify-between gap-4"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <div>
            <p className="text-sm font-semibold mb-0.5" style={{ color: "var(--text-primary)" }}>
              {event.tool_name}
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {catLabel} · {event.tool_id}
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Link
              href={`/tool/${event.tool_id}`}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
              style={{ background: color, color: "#fff" }}
            >
              View tool →
            </Link>
            <Link
              href={tabSlug ? `/feed/${tabSlug}` : "/feed"}
              className="text-xs px-3 py-1.5 rounded-lg transition-colors"
              style={{
                background: "var(--surface-2)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border)",
              }}
            >
              ← Feed
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
