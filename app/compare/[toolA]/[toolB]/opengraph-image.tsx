import { ImageResponse } from "next/og";
import toolsData from "@/data/tools.json";
import { getCategoryColor } from "@/lib/types";
import type { Tool } from "@/lib/types";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ toolA: string; toolB: string }>;
}) {
  const { toolA: aId, toolB: bId } = await params;
  const tools = toolsData as Tool[];
  const a = tools.find((t) => t.id === aId);
  const b = tools.find((t) => t.id === bId);

  return new ImageResponse(
    <div
      style={{
        width: 1200,
        height: 630,
        background: "#0a0a0f",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Inter, sans-serif",
        padding: "0 80px",
      }}
    >
      {/* Dual glow — one per tool */}
      {a && (
        <div
          style={{
            position: "absolute",
            left: -100,
            top: -100,
            width: 600,
            height: 600,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${getCategoryColor(a.category)}12 0%, transparent 70%)`,
          }}
        />
      )}
      {b && (
        <div
          style={{
            position: "absolute",
            right: -100,
            bottom: -100,
            width: 600,
            height: 600,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${getCategoryColor(b.category)}12 0%, transparent 70%)`,
          }}
        />
      )}

      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 48 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: "linear-gradient(135deg, #7c6bff, #00d4aa)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
            fontWeight: 800,
            color: "#fff",
          }}
        >
          A
        </div>
        <span style={{ fontSize: 26, fontWeight: 700, color: "#f0f0f8" }}>AIchitect</span>
      </div>

      {a && b ? (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
            {/* Tool A card */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 16,
                padding: "28px 40px",
                borderRadius: 20,
                background: getCategoryColor(a.category) + "18",
                border: `1px solid ${getCategoryColor(a.category)}44`,
                minWidth: 320,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    background: getCategoryColor(a.category),
                  }}
                />
                <span
                  style={{ fontSize: 32, fontWeight: 800, color: getCategoryColor(a.category) }}
                >
                  {a.name}
                </span>
              </div>
              <span style={{ fontSize: 13, color: "#666688", textAlign: "center", maxWidth: 260 }}>
                {a.tagline}
              </span>
            </div>

            {/* vs */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: "#2a2a3a" }}>vs</span>
            </div>

            {/* Tool B card */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 16,
                padding: "28px 40px",
                borderRadius: 20,
                background: getCategoryColor(b.category) + "18",
                border: `1px solid ${getCategoryColor(b.category)}44`,
                minWidth: 320,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    background: getCategoryColor(b.category),
                  }}
                />
                <span
                  style={{ fontSize: 32, fontWeight: 800, color: getCategoryColor(b.category) }}
                >
                  {b.name}
                </span>
              </div>
              <span style={{ fontSize: 13, color: "#666688", textAlign: "center", maxWidth: 260 }}>
                {b.tagline}
              </span>
            </div>
          </div>

          <div style={{ marginTop: 40, fontSize: 13, color: "#333355", letterSpacing: 0.3 }}>
            aichitect.dev · compare AI tools side by side
          </div>
        </>
      ) : (
        <div style={{ fontSize: 22, color: "#8888aa", textAlign: "center" }}>
          AI Tool Comparison — aichitect.dev
        </div>
      )}
    </div>,
    { ...size }
  );
}
