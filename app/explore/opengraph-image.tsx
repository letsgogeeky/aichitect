import { ImageResponse } from "next/og";
import toolsData from "@/data/tools.json";
import { getCategoryColor } from "@/lib/types";
import type { Tool } from "@/lib/types";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  searchParams,
}: {
  searchParams: Promise<{ compare?: string }>;
}) {
  const { compare } = await searchParams;
  const tools = toolsData as Tool[];

  const compared = compare
    ? compare
        .split(",")
        .map((id) => tools.find((t) => t.id === id))
        .filter((t): t is Tool => Boolean(t))
    : [];

  const [a, b] = compared;

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
      {/* Radial glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "radial-gradient(circle at 50% 50%, #7c6bff08 0%, transparent 70%)",
        }}
      />

      {/* Logo */}
      <div
        style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: a && b ? 40 : 24 }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: "linear-gradient(135deg, #7c6bff, #00d4aa)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24,
            fontWeight: 800,
            color: "#fff",
          }}
        >
          A
        </div>
        <span style={{ fontSize: 32, fontWeight: 700, color: "#f0f0f8", letterSpacing: -0.5 }}>
          AIchitect
        </span>
      </div>

      {a && b ? (
        <>
          <div
            style={{
              fontSize: 13,
              color: "#555577",
              letterSpacing: 2,
              textTransform: "uppercase",
              marginBottom: 32,
            }}
          >
            Tool Comparison
          </div>
          {/* VS row */}
          <div style={{ display: "flex", alignItems: "center", gap: 48, marginBottom: 48 }}>
            {/* Tool A */}
            <div
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "14px 28px",
                  borderRadius: 14,
                  background: getCategoryColor(a.category) + "18",
                  border: `1px solid ${getCategoryColor(a.category)}44`,
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: getCategoryColor(a.category),
                  }}
                />
                <span
                  style={{ fontSize: 28, fontWeight: 700, color: getCategoryColor(a.category) }}
                >
                  {a.name}
                </span>
              </div>
              <span style={{ fontSize: 13, color: "#555577", maxWidth: 280, textAlign: "center" }}>
                {a.tagline}
              </span>
            </div>

            {/* vs divider */}
            <span style={{ fontSize: 24, fontWeight: 800, color: "#2a2a3a" }}>vs</span>

            {/* Tool B */}
            <div
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "14px 28px",
                  borderRadius: 14,
                  background: getCategoryColor(b.category) + "18",
                  border: `1px solid ${getCategoryColor(b.category)}44`,
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: getCategoryColor(b.category),
                  }}
                />
                <span
                  style={{ fontSize: 28, fontWeight: 700, color: getCategoryColor(b.category) }}
                >
                  {b.name}
                </span>
              </div>
              <span style={{ fontSize: 13, color: "#555577", maxWidth: 280, textAlign: "center" }}>
                {b.tagline}
              </span>
            </div>
          </div>
        </>
      ) : (
        <div
          style={{
            fontSize: 20,
            color: "#8888aa",
            marginBottom: 48,
            textAlign: "center",
            maxWidth: 700,
            lineHeight: 1.5,
          }}
        >
          The full AI tools landscape — 111 tools across 11 categories, mapped and connected.
        </div>
      )}

      <div style={{ fontSize: 15, color: "#333355", letterSpacing: 0.3 }}>
        aichitect.dev · cut the noise. pick your AI stack.
      </div>
    </div>,
    { ...size }
  );
}
