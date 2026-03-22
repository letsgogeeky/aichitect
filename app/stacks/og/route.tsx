import { ImageResponse } from "next/og";
import { type NextRequest } from "next/server";
import stacksData from "@/data/stacks.json";
import toolsData from "@/data/tools.json";
import { getCategoryColor, STACK_CLUSTERS } from "@/lib/types";
import type { Stack, Tool } from "@/lib/types";

export const runtime = "edge";

const W = 1200;
const H = 630;

export async function GET(request: NextRequest) {
  const stackId = new URL(request.url).searchParams.get("stack") ?? "";
  const stack = (stacksData as Stack[]).find((s) => s.id === stackId);

  if (!stack) {
    return new Response("Stack not found", { status: 404 });
  }

  const clusterMeta = STACK_CLUSTERS.find((c) => c.id === stack.cluster);
  const clusterLabel = clusterMeta?.label ?? stack.cluster;

  // Cluster accent color
  const CLUSTER_COLOR: Record<string, string> = {
    build: "#7c6bff",
    automate: "#ff6b6b",
    ship: "#26de81",
    comply: "#4ecdc4",
    understand: "#fdcb6e",
  };
  const accent = CLUSTER_COLOR[stack.cluster] ?? "#7c6bff";

  // Resolve first 6 tools
  const tools = stack.tools
    .map((id) => (toolsData as Tool[]).find((t) => t.id === id))
    .filter((t): t is Tool => Boolean(t))
    .slice(0, 6);

  return new ImageResponse(
    <div
      style={{
        width: W,
        height: H,
        background: "#0a0a0f",
        display: "flex",
        flexDirection: "column",
        fontFamily: "Inter, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Atmospheric gradient from cluster accent */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          backgroundImage: `radial-gradient(ellipse 60% 55% at -5% -5%, ${accent}1a 0%, transparent 60%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          backgroundImage: `radial-gradient(ellipse 45% 40% at 105% 110%, ${accent}0e 0%, transparent 55%)`,
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "44px 56px",
          flex: 1,
          position: "relative",
        }}
      >
        {/* ── TOP ── */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          {/* Brand + cluster badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 20,
            }}
          >
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
              <span
                style={{ fontSize: 26, fontWeight: 700, color: "#e8e8f4", letterSpacing: -0.5 }}
              >
                AIchitect
              </span>
            </div>

            {/* Cluster badge */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 20px",
                borderRadius: 999,
                background: accent + "14",
                borderWidth: 1,
                borderStyle: "solid",
                borderColor: accent + "44",
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: accent,
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 15, fontWeight: 600, color: accent, letterSpacing: 0.3 }}>
                {clusterLabel}
              </span>
            </div>
          </div>

          {/* Accent bar */}
          <div
            style={{
              height: 2,
              borderRadius: 2,
              background: `linear-gradient(to right, ${accent}cc, ${accent}44, transparent)`,
              marginBottom: 20,
            }}
          />

          {/* Stack name */}
          <div
            style={{
              fontSize: 50,
              fontWeight: 800,
              color: "#f0f0f8",
              letterSpacing: -1.5,
              lineHeight: 1.05,
              marginBottom: 10,
            }}
          >
            {stack.name}
          </div>

          {/* Target audience */}
          <div style={{ fontSize: 18, color: "#44446a", letterSpacing: 0.1 }}>{stack.target}</div>
        </div>

        {/* ── TOOL PILLS ── */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {tools.map((t) => {
            const c = getCategoryColor(t.category);
            return (
              <div
                key={t.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 16px",
                  borderRadius: 8,
                  background: c + "10",
                  borderWidth: 1,
                  borderStyle: "solid",
                  borderColor: c + "30",
                }}
              >
                <div
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: c,
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: 16, fontWeight: 600, color: "#d0d0e8" }}>{t.name}</span>
              </div>
            );
          })}
          {stack.tools.length > 6 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                padding: "8px 16px",
                borderRadius: 8,
                background: "#ffffff08",
                borderWidth: 1,
                borderStyle: "solid",
                borderColor: "#ffffff14",
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 500, color: "#555577" }}>
                +{stack.tools.length - 6} more
              </span>
            </div>
          )}
        </div>

        {/* ── FOOTER ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 14, color: "#2a2a44" }}>aichitect.dev</span>
          <span style={{ fontSize: 14, color: "#2a2a44" }}>cut the noise. pick your AI stack.</span>
        </div>
      </div>
    </div>,
    { width: W, height: H }
  );
}
