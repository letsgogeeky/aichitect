import { ImageResponse } from "next/og";
import toolsData from "@/data/tools.json";
import { CATEGORIES, getCategoryColor, type CategoryId } from "@/lib/types";
import type { Tool } from "@/lib/types";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ categoryId: string }> }) {
  const { categoryId } = await params;
  const cat = CATEGORIES.find((c) => c.id === categoryId);

  if (!cat) {
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

  const color = getCategoryColor(categoryId as CategoryId);
  const tools = (toolsData as Tool[])
    .filter((t) => t.category === categoryId)
    .sort((a, b) => {
      if (a.prominent && !b.prominent) return -1;
      if (!a.prominent && b.prominent) return 1;
      return (b.github_stars ?? 0) - (a.github_stars ?? 0);
    })
    .slice(0, 6);

  const totalCount = (toolsData as Tool[]).filter((t) => t.category === categoryId).length;

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
        {/* Top: brand + category badge */}
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
              {totalCount} tools
            </span>
          </div>
        </div>

        {/* Middle: category name */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 68,
              fontWeight: 900,
              color: "#f0f0f8",
              letterSpacing: -3,
              lineHeight: 1,
              marginBottom: 16,
            }}
          >
            {cat.label}
          </div>
          <div style={{ fontSize: 20, color: "#44446a", letterSpacing: 0.1 }}>
            Top tools in this category
          </div>

          {/* Tool pills */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 24 }}>
            {tools.map((t) => (
              <div
                key={t.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "7px 14px",
                  borderRadius: 8,
                  background: color + "10",
                  borderWidth: 1,
                  borderStyle: "solid",
                  borderColor: color + "30",
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: color,
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: 15, fontWeight: 600, color: "#d0d0e8" }}>{t.name}</span>
              </div>
            ))}
            {totalCount > 6 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "7px 14px",
                  borderRadius: 8,
                  background: "#ffffff08",
                  borderWidth: 1,
                  borderStyle: "solid",
                  borderColor: "#ffffff14",
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 500, color: "#555577" }}>
                  +{totalCount - 6} more
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 14, color: "#2a2a44" }}>
            aichitect.dev/category/{categoryId}
          </span>
          <span style={{ fontSize: 14, color: "#2a2a44" }}>cut the noise. pick your AI stack.</span>
        </div>
      </div>
    </div>,
    { ...size }
  );
}
