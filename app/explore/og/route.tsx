import { ImageResponse } from "next/og";
import { type NextRequest } from "next/server";
import toolsData from "@/data/tools.json";
import relationshipsData from "@/data/relationships.json";
import { getCategoryColor } from "@/lib/types";
import type { Tool, Relationship } from "@/lib/types";

export const runtime = "edge";

const W = 1200;
const H = 630;

const CATEGORY_LABEL: Record<string, string> = {
  "coding-assistants": "Coding Assistant",
  "autonomous-agents": "Autonomous Agent",
  "agent-frameworks": "Agent Framework",
  "llm-providers": "LLM Provider",
  observability: "Observability",
  "vector-databases": "Vector Database",
  deployment: "Deployment",
  mcp: "MCP",
  design: "Design",
  "data-auth": "Data & Auth",
  "prompt-eval": "Prompt Eval",
  specifications: "Specifications",
  "fine-tuning": "Fine-tuning",
  "voice-ai": "Voice AI",
  multimodal: "Multimodal",
  "browser-automation": "Browser Automation",
};

export async function GET(request: NextRequest) {
  const toolId = new URL(request.url).searchParams.get("tool") ?? "";
  const tool = (toolsData as Tool[]).find((t) => t.id === toolId);

  if (!tool) {
    return new Response("Not found", { status: 404 });
  }

  const accent = getCategoryColor(tool.category);
  const categoryLabel = CATEGORY_LABEL[tool.category] ?? tool.category;

  // Count connections for this tool
  const connections = (relationshipsData as Relationship[]).filter(
    (r) => r.source === tool.id || r.target === tool.id
  );
  const integrations = connections.filter((r) => r.type === "integrates-with").length;
  const paired = connections.filter((r) => r.type === "commonly-paired-with").length;

  // Find connected tools (up to 6) to show as pills
  const connectedIds = new Set<string>();
  for (const r of connections) {
    if (r.source === tool.id) connectedIds.add(r.target);
    else connectedIds.add(r.source);
  }
  const connectedTools = [...connectedIds]
    .map((id) => (toolsData as Tool[]).find((t) => t.id === id))
    .filter((t): t is Tool => Boolean(t))
    .slice(0, 6);

  const stats = [
    { label: "Integrations", value: integrations },
    { label: "Often paired", value: paired },
    ...(tool.github_stars != null
      ? [
          {
            label: "GitHub stars",
            value:
              tool.github_stars >= 1000
                ? `${(tool.github_stars / 1000).toFixed(1)}k`
                : String(tool.github_stars),
          },
        ]
      : []),
  ];

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
      {/* Background gradients */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          backgroundImage: `radial-gradient(ellipse 60% 55% at -5% -5%, ${accent}1a 0%, transparent 55%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          backgroundImage: `radial-gradient(ellipse 40% 35% at 110% 110%, ${accent}0d 0%, transparent 55%)`,
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
        {/* ── TOP ROW ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
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
            <span style={{ fontSize: 26, fontWeight: 700, color: "#e8e8f4", letterSpacing: -0.5 }}>
              AIchitect
            </span>
          </div>

          {/* Category badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "8px 20px",
              borderRadius: 999,
              background: accent + "14",
              borderWidth: 1,
              borderStyle: "solid",
              borderColor: accent + "44",
            }}
          >
            <span style={{ fontSize: 15, fontWeight: 600, color: accent, letterSpacing: 0.3 }}>
              {categoryLabel}
            </span>
          </div>
        </div>

        {/* ── ACCENT BAR ── */}
        <div
          style={{
            height: 2,
            borderRadius: 2,
            background: `linear-gradient(to right, ${accent}cc, #7c6bff44, transparent)`,
            marginTop: 20,
          }}
        />

        {/* ── MIDDLE: tool name + tagline + stats ── */}
        <div style={{ display: "flex", flexDirection: "column", marginTop: 28, flex: 1 }}>
          <div
            style={{
              fontSize: tool.name.length > 16 ? 58 : 72,
              fontWeight: 800,
              color: "#f0f0f8",
              letterSpacing: -2.5,
              lineHeight: 1,
              marginBottom: 16,
            }}
          >
            {tool.name}
          </div>
          <div
            style={{
              fontSize: 22,
              color: "#6666aa",
              letterSpacing: 0.1,
              lineHeight: 1.4,
              maxWidth: 700,
            }}
          >
            {tool.tagline}
          </div>

          {/* Stats row */}
          <div style={{ display: "flex", gap: 32, marginTop: 36 }}>
            {stats.map((s) => (
              <div key={s.label} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontSize: 32, fontWeight: 800, color: accent, letterSpacing: -1 }}>
                  {s.value}
                </span>
                <span style={{ fontSize: 13, color: "#44446a", fontWeight: 500 }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── BOTTOM: connected tools + footer ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {connectedTools.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ fontSize: 12, color: "#33334a", fontWeight: 500 }}>connects with</span>
              {connectedTools.map((ct) => {
                const c = getCategoryColor(ct.category);
                return (
                  <div
                    key={ct.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "5px 14px",
                      borderRadius: 999,
                      background: c + "0d",
                      borderWidth: 1,
                      borderStyle: "solid",
                      borderColor: c + "33",
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 600, color: c }}>{ct.name}</span>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 14, color: "#2a2a44" }}>aichitect.dev/explore</span>
            <span style={{ fontSize: 14, color: "#2a2a44" }}>
              cut the noise. pick your AI stack.
            </span>
          </div>
        </div>
      </div>
    </div>,
    { width: W, height: H }
  );
}
