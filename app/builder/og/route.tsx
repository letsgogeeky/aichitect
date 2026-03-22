import { ImageResponse } from "next/og";
import { type NextRequest } from "next/server";
import toolsData from "@/data/tools.json";
import { getCategoryColor } from "@/lib/types";
import type { Tool } from "@/lib/types";

export const runtime = "edge";

const CATEGORY_LABEL: Record<string, string> = {
  "coding-assistants": "Coding",
  "autonomous-agents": "Agents",
  "agent-frameworks": "Frameworks",
  "pipelines-rag": "RAG / Pipelines",
  "llm-infra": "LLM Infra",
  design: "Design",
  devops: "DevOps",
  docs: "Docs",
  "product-mgmt": "Product",
  mcp: "MCP",
  "prompt-eval": "Eval",
  specifications: "Spec",
  "fine-tuning": "Fine-tuning",
  "voice-ai": "Voice AI",
  multimodal: "Multimodal",
  "browser-automation": "Browser",
};

const W = 1200;
const H = 630;
const COL_WIDTH = 260;
const CARD_GAP = 16;
const CARD_H = 88;
const COLS = 4;

export async function GET(request: NextRequest) {
  const s = new URL(request.url).searchParams.get("s") ?? "";
  const toolIds = s.split(",").filter(Boolean);
  const tools = toolIds
    .map((id) => (toolsData as Tool[]).find((t) => t.id === id))
    .filter((t): t is Tool => Boolean(t))
    .slice(0, 8);

  const hasTools = tools.length > 0;

  const bgColors: string[] = [];
  for (const t of tools) {
    const c = getCategoryColor(t.category);
    if (!bgColors.includes(c)) bgColors.push(c);
    if (bgColors.length >= 2) break;
  }
  const grad1 = bgColors[0] ?? "#7c6bff";
  const grad2 = bgColors[1] ?? "#00d4aa";

  const rows: Tool[][] = [];
  for (let i = 0; i < tools.length; i += COLS) {
    rows.push(tools.slice(i, i + COLS));
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
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          backgroundImage: `radial-gradient(ellipse 55% 50% at -8% -8%, ${grad1}1c 0%, transparent 58%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          backgroundImage: `radial-gradient(ellipse 50% 45% at 108% 112%, ${grad2}18 0%, transparent 55%)`,
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
        {/* ── TOP: brand + headline ── */}
        <div style={{ display: "flex", flexDirection: "column" }}>
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
                style={{
                  fontSize: 26,
                  fontWeight: 700,
                  color: "#e8e8f4",
                  letterSpacing: -0.5,
                }}
              >
                AIchitect
              </span>
            </div>

            {hasTools && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "8px 20px",
                  borderRadius: 999,
                  background: "#ffffff08",
                  borderWidth: 1,
                  borderStyle: "solid",
                  borderColor: "#ffffff14",
                }}
              >
                <span
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: "#6666aa",
                    letterSpacing: 0.3,
                  }}
                >
                  {tools.length} tool{tools.length !== 1 ? "s" : ""} selected
                </span>
              </div>
            )}
          </div>

          <div
            style={{
              height: 2,
              borderRadius: 2,
              background: `linear-gradient(to right, ${grad1}cc, ${grad2}99, transparent)`,
              marginBottom: 20,
            }}
          />

          <div
            style={{
              fontSize: 54,
              fontWeight: 800,
              color: "#f0f0f8",
              letterSpacing: -2,
              lineHeight: 1,
              marginBottom: 10,
            }}
          >
            My AI Stack
          </div>

          <div style={{ fontSize: 18, color: "#44446a", letterSpacing: 0.2 }}>
            {hasTools ? "Built with AIchitect · aichitect.dev" : "Build yours at aichitect.dev"}
          </div>
        </div>

        {/* ── MIDDLE: tool grid or empty state ── */}
        {hasTools ? (
          <div style={{ display: "flex", flexDirection: "column", gap: CARD_GAP }}>
            {rows.map((row, ri) => (
              <div key={ri} style={{ display: "flex", gap: CARD_GAP }}>
                {row.map((t) => {
                  const c = getCategoryColor(t.category);
                  return (
                    <div
                      key={t.id}
                      style={{
                        width: COL_WIDTH,
                        height: CARD_H,
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        paddingLeft: 20,
                        paddingRight: 16,
                        borderRadius: 12,
                        background: c + "0d",
                        borderTopWidth: 1,
                        borderTopStyle: "solid",
                        borderTopColor: c + "2a",
                        borderRightWidth: 1,
                        borderRightStyle: "solid",
                        borderRightColor: c + "2a",
                        borderBottomWidth: 1,
                        borderBottomStyle: "solid",
                        borderBottomColor: c + "2a",
                        borderLeftWidth: 3,
                        borderLeftStyle: "solid",
                        borderLeftColor: c,
                      }}
                    >
                      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                        <span
                          style={{
                            fontSize: 20,
                            fontWeight: 700,
                            color: "#f0f0f8",
                            lineHeight: 1,
                          }}
                        >
                          {t.name}
                        </span>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 500,
                            color: c,
                            lineHeight: 1,
                          }}
                        >
                          {CATEGORY_LABEL[t.category] ?? t.category}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontSize: 22, color: "#2a2a44", textAlign: "center" }}>
              Pick your tools and share your AI stack.
            </div>
          </div>
        )}

        {/* ── FOOTER ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: 14, color: "#2a2a44" }}>aichitect.dev</span>
          <span style={{ fontSize: 14, color: "#2a2a44" }}>cut the noise. pick your AI stack.</span>
        </div>
      </div>
    </div>,
    { width: W, height: H }
  );
}
