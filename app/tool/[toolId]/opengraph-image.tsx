import { ImageResponse } from "next/og";
import toolsData from "@/data/tools.json";
import { getCategoryColor, CATEGORIES } from "@/lib/types";
import type { Tool } from "@/lib/types";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ toolId: string }> }) {
  const { toolId } = await params;
  const tool = (toolsData as Tool[]).find((t) => t.id === toolId);

  // Fallback for unknown tool IDs
  if (!tool) {
    return new ImageResponse(
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
        <span style={{ fontSize: 32, color: "#44446a" }}>AIchitect — AI Tool Directory</span>
      </div>,
      { ...size }
    );
  }

  const color = getCategoryColor(tool.category);
  const catLabel = CATEGORIES.find((c) => c.id === tool.category)?.label ?? tool.category;

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
          backgroundImage: `radial-gradient(ellipse 60% 55% at -5% -5%, ${color}22 0%, transparent 60%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          backgroundImage: `radial-gradient(ellipse 45% 40% at 110% 110%, ${color}12 0%, transparent 55%)`,
        }}
      />

      {/* Left accent bar */}
      <div
        style={{
          position: "absolute",
          top: 60,
          left: 0,
          width: 5,
          height: 510,
          background: color,
          borderRadius: "0 4px 4px 0",
        }}
      />

      {/* Content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "52px 72px 52px 80px",
          flex: 1,
          position: "relative",
        }}
      >
        {/* Top: brand */}
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
          </div>
          {/* Category pill */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "8px 20px",
              borderRadius: 999,
              background: color + "18",
              borderWidth: 1,
              borderStyle: "solid",
              borderColor: color + "44",
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 600, color, letterSpacing: 0.3 }}>
              {catLabel}
            </span>
          </div>
        </div>

        {/* Middle: tool name + tagline */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 72,
              fontWeight: 900,
              color: "#f0f0f8",
              letterSpacing: -3,
              lineHeight: 1,
              marginBottom: 20,
            }}
          >
            {tool.name}
          </div>
          <div
            style={{
              fontSize: 22,
              color: "#5a5a8a",
              letterSpacing: 0.1,
              lineHeight: 1.4,
              maxWidth: 760,
            }}
          >
            {tool.tagline}
          </div>

          {/* Badges */}
          <div style={{ display: "flex", gap: 12, marginTop: 28 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                padding: "6px 16px",
                borderRadius: 8,
                background: tool.type === "oss" ? "#26de8118" : "#4ecdc418",
                borderWidth: 1,
                borderStyle: "solid",
                borderColor: tool.type === "oss" ? "#26de8144" : "#4ecdc444",
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: tool.type === "oss" ? "#26de81" : "#4ecdc4",
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                }}
              >
                {tool.type === "oss" ? "◆ Open Source" : "Commercial"}
              </span>
            </div>
            {tool.pricing.free_tier && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "6px 16px",
                  borderRadius: 8,
                  background: "#00d4aa18",
                  borderWidth: 1,
                  borderStyle: "solid",
                  borderColor: "#00d4aa44",
                }}
              >
                <span
                  style={{ fontSize: 13, fontWeight: 700, color: "#00d4aa", letterSpacing: 0.5 }}
                >
                  ✦ Free Tier
                </span>
              </div>
            )}
            {tool.github_stars && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "6px 16px",
                  borderRadius: 8,
                  background: "#ffffff08",
                  borderWidth: 1,
                  borderStyle: "solid",
                  borderColor: "#ffffff14",
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 600, color: "#6666aa" }}>
                  ⭐ {tool.github_stars.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom: URL */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 14, color: "#2a2a44" }}>aichitect.dev/tool/{toolId}</span>
          <span style={{ fontSize: 14, color: "#2a2a44" }}>cut the noise. pick your AI stack.</span>
        </div>
      </div>
    </div>,
    { ...size }
  );
}
