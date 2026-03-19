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
  searchParams: Promise<{ s?: string }>;
}) {
  const { s } = await searchParams;
  const toolIds = (s ?? "").split(",").filter(Boolean);
  const tools = toolIds
    .map((id) => (toolsData as Tool[]).find((t) => t.id === id))
    .filter((t): t is Tool => Boolean(t))
    .slice(0, 8);

  const hasTools = tools.length > 0;

  return new ImageResponse(
    (
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
          gap: 0,
        }}
      >
        {/* Subtle grid backdrop */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(circle at 50% 50%, #7c6bff08 0%, transparent 70%)",
          }}
        />

        {/* Logo row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginBottom: hasTools ? 48 : 24,
          }}
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
          <span
            style={{ fontSize: 32, fontWeight: 700, color: "#f0f0f8", letterSpacing: -0.5 }}
          >
            AIchitect
          </span>
        </div>

        {hasTools ? (
          <>
            {/* Label */}
            <div
              style={{
                fontSize: 14,
                color: "#555577",
                letterSpacing: 2,
                textTransform: "uppercase",
                marginBottom: 24,
              }}
            >
              Custom AI Stack
            </div>

            {/* Tool pills */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 12,
                justifyContent: "center",
                maxWidth: 960,
                marginBottom: 52,
              }}
            >
              {tools.map((t) => {
                const c = getCategoryColor(t.category);
                return (
                  <div
                    key={t.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 20px",
                      borderRadius: 10,
                      background: c + "18",
                      border: `1px solid ${c}44`,
                    }}
                  >
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: c,
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{ fontSize: 20, fontWeight: 600, color: "#f0f0f8" }}
                    >
                      {t.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div
            style={{
              fontSize: 22,
              color: "#8888aa",
              marginBottom: 52,
              textAlign: "center",
              maxWidth: 700,
              lineHeight: 1.5,
            }}
          >
            Build your AI stack — pick one tool per slot and see how they wire together.
          </div>
        )}

        {/* Footer tagline */}
        <div
          style={{
            fontSize: 16,
            color: "#333355",
            letterSpacing: 0.3,
          }}
        >
          aichitect.dev · pick the right stack, without the noise
        </div>
      </div>
    ),
    { ...size }
  );
}
