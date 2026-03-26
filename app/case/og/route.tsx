import { ImageResponse } from "next/og";
import { type NextRequest } from "next/server";
import toolsData from "@/data/tools.json";
import stacksData from "@/data/stacks.json";
import { getCategoryColor } from "@/lib/types";
import type { Tool, Stack } from "@/lib/types";

export const runtime = "edge";

const W = 1200;
const H = 630;
const ACCENT = "#fdcb6e"; // amber — "Make a case" brand color

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const s = url.searchParams.get("s") ?? "";
  const stackId = url.searchParams.get("stack") ?? "";

  const allTools = toolsData as Tool[];
  const allStacks = stacksData as Stack[];

  let stackName = "Custom Stack";
  let subtitle = "";
  let tools: Tool[] = [];
  let rejectedCount = 0;
  let killCount = 0;

  if (stackId) {
    const stack = allStacks.find((st) => st.id === stackId);
    if (stack) {
      stackName = stack.name;
      subtitle = stack.target;
      tools = stack.tools
        .map((id) => allTools.find((t) => t.id === id))
        .filter((t): t is Tool => Boolean(t))
        .slice(0, 7);
      rejectedCount = stack.not_in_stack?.length ?? 0;
      killCount = stack.kill_conditions?.length ?? 0;
    }
  } else if (s) {
    const toolIds = s.split(",").filter(Boolean);
    tools = toolIds
      .map((id) => allTools.find((t) => t.id === id))
      .filter((t): t is Tool => Boolean(t))
      .slice(0, 7);
    subtitle = `${tools.length} tool${tools.length !== 1 ? "s" : ""}`;
  }

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
      {/* Atmospheric gradients — amber top-left, dim bottom-right */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `radial-gradient(ellipse 60% 55% at -5% -5%, ${ACCENT}18 0%, transparent 60%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `radial-gradient(ellipse 45% 40% at 108% 112%, ${ACCENT}0a 0%, transparent 55%)`,
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
        {/* ── TOP: brand + badge ── */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 20,
            }}
          >
            {/* Brand */}
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

            {/* "STACK DECISION BRIEF" badge */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 20px",
                borderRadius: 999,
                background: ACCENT + "14",
                borderWidth: 1,
                borderStyle: "solid",
                borderColor: ACCENT + "44",
              }}
            >
              <div
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: ACCENT,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: ACCENT,
                  letterSpacing: 1.2,
                  textTransform: "uppercase",
                }}
              >
                Stack Decision Brief
              </span>
            </div>
          </div>

          {/* Amber accent bar */}
          <div
            style={{
              height: 2,
              borderRadius: 2,
              background: `linear-gradient(to right, ${ACCENT}cc, ${ACCENT}44, transparent)`,
              marginBottom: 22,
            }}
          />

          {/* Headline */}
          <div
            style={{
              fontSize: 17,
              fontWeight: 600,
              color: ACCENT + "99",
              letterSpacing: 0.3,
              marginBottom: 8,
            }}
          >
            Make a case for
          </div>
          <div
            style={{
              fontSize: stackName.length > 30 ? 42 : 50,
              fontWeight: 800,
              color: "#f0f0f8",
              letterSpacing: -1.5,
              lineHeight: 1.05,
              marginBottom: 10,
            }}
          >
            {stackName}
          </div>
          {subtitle && (
            <div style={{ fontSize: 17, color: "#44446a", letterSpacing: 0.1 }}>{subtitle}</div>
          )}
        </div>

        {/* ── TOOL PILLS ── */}
        {tools.length > 0 && (
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
          </div>
        )}

        {/* ── FOOTER ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <span style={{ fontSize: 14, color: "#2a2a44" }}>aichitect.dev</span>
            {rejectedCount > 0 && (
              <span style={{ fontSize: 13, color: "#3a3a55" }}>
                {rejectedCount} tool{rejectedCount !== 1 ? "s" : ""} rejected
              </span>
            )}
            {killCount > 0 && (
              <span style={{ fontSize: 13, color: "#3a3a55" }}>
                {killCount} exit condition{killCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <span style={{ fontSize: 14, color: "#2a2a44" }}>cut the noise. pick your AI stack.</span>
        </div>
      </div>
    </div>,
    { width: W, height: H }
  );
}
