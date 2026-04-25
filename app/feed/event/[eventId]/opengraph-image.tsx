import { ImageResponse } from "next/og";
import { supabase } from "@/lib/db";
import { getCategoryColor, CATEGORIES, type CategoryId, type ToolEventType } from "@/lib/types";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Node.js runtime (not edge) — needed to query Supabase for event data.

type Props = { params: Promise<{ eventId: string }> };

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

type Meta = Record<string, unknown>;

function eventSummaryLine(type: ToolEventType, metadata: Meta): string {
  switch (type) {
    case "health_score_change":
      return `Score: ${metadata.old_score} → ${metadata.new_score} (${Number(metadata.delta) > 0 ? "+" : ""}${metadata.delta} pts)`;
    case "star_milestone":
      return `Crossed ${Number(metadata.milestone).toLocaleString()} stars ⭐`;
    case "stale_transition":
      return `No commits in ${metadata.days_since_commit} days`;
    case "archived_detected":
      return "Repository archived on GitHub";
    case "pricing_change":
      return "Pricing or cost model updated";
    default:
      return String(type);
  }
}

export default async function Image({ params }: Props) {
  const { eventId } = await params;

  const fallback = new ImageResponse(
    <div
      style={{
        width: 1200,
        height: 630,
        background: "#0a0a0f",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <span style={{ fontSize: 32, color: "#44446a" }}>AIchitect — Activity Feed</span>
    </div>,
    { ...size }
  );

  if (!supabase) return fallback;

  const { data, error } = await supabase
    .from("tool_events")
    .select("id, tool_id, type, detected_at, metadata, tools!inner(name, category)")
    .eq("id", eventId)
    .single();

  if (error || !data) return fallback;

  const toolRaw = data.tools as unknown as
    | { name: string; category: string }[]
    | { name: string; category: string };
  const tool = Array.isArray(toolRaw) ? toolRaw[0] : toolRaw;

  const type = data.type as ToolEventType;
  const metadata = (data.metadata ?? {}) as Meta;
  const category = tool.category as CategoryId;
  const catLabel = CATEGORIES.find((c) => c.id === category)?.label ?? category;
  const catColor = getCategoryColor(category);
  const eventColor = EVENT_TYPE_COLOR[type] ?? "#7c6bff";
  const eventLabel = EVENT_TYPE_LABEL[type] ?? type;
  const summaryLine = eventSummaryLine(type, metadata);

  const detectedDate = new Date(data.detected_at as string).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return new ImageResponse(
    <div
      style={{
        width: 1200,
        height: 630,
        background: "#0a0a0f",
        display: "flex",
        flexDirection: "column",
        fontFamily: "Inter, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Atmospheric gradients */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          backgroundImage: `radial-gradient(ellipse 60% 55% at -5% -5%, ${eventColor}1a 0%, transparent 58%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          backgroundImage: `radial-gradient(ellipse 45% 40% at 110% 110%, ${catColor}10 0%, transparent 55%)`,
        }}
      />

      {/* Top accent bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: eventColor,
        }}
      />

      {/* Content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "52px 72px",
          flex: 1,
          position: "relative",
        }}
      >
        {/* Top: brand + pills */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: "linear-gradient(135deg, #7c6bff, #00d4aa)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                fontWeight: 800,
                color: "#fff",
              }}
            >
              A
            </div>
            <span style={{ fontSize: 24, fontWeight: 700, color: "#e8e8f4", letterSpacing: -0.5 }}>
              AIchitect
            </span>
            <span style={{ fontSize: 16, color: "#44446a", marginLeft: 4 }}>/ Activity Feed</span>
          </div>

          {/* Event type pill */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "8px 20px",
              borderRadius: 999,
              background: eventColor + "18",
              borderWidth: 1,
              borderStyle: "solid",
              borderColor: eventColor + "44",
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 700, color: eventColor, letterSpacing: 0.3 }}>
              {eventLabel}
            </span>
          </div>
        </div>

        {/* Middle: tool name + event line */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          {/* Category pill */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "5px 14px",
              borderRadius: 999,
              background: catColor + "15",
              borderWidth: 1,
              borderStyle: "solid",
              borderColor: catColor + "33",
              marginBottom: 20,
              width: "fit-content",
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: catColor }}>{catLabel}</span>
          </div>

          {/* Tool name */}
          <div
            style={{
              fontSize: 72,
              fontWeight: 900,
              color: "#f0f0f8",
              letterSpacing: -3,
              lineHeight: 1,
              marginBottom: 18,
            }}
          >
            {tool.name}
          </div>

          {/* Event summary line */}
          <div
            style={{
              fontSize: 26,
              fontWeight: 600,
              color: eventColor,
              letterSpacing: -0.5,
            }}
          >
            {summaryLine}
          </div>
        </div>

        {/* Bottom */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 14, color: "#2a2a44" }}>
            Detected {detectedDate} · aichitect.dev
          </span>
          <span style={{ fontSize: 14, color: "#2a2a44" }}>cut the noise. pick your AI stack.</span>
        </div>
      </div>
    </div>,
    { ...size }
  );
}
