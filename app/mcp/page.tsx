import type { Metadata } from "next";
import { pageMeta } from "@/lib/metadata";
import { SITE_URL } from "@/lib/constants";
import { CopyButton } from "./components/CopyButton";

export const metadata: Metadata = pageMeta({
  title: "MCP Server — AIchitect",
  description:
    "Add AIchitect as an MCP server. Get personalised stack recommendations, roast, and challenge choices directly inside Claude Code or Cursor — without burning tokens on ecosystem research.",
  path: "/mcp",
});

const MCP_URL = `${SITE_URL}/api/mcp`;

const TOOLS = [
  {
    name: "get_stack_questions",
    color: "#a29bfe",
    description:
      "Returns the AIchitect questionnaire as structured JSON. Present each question to the user in order before calling recommend_stack.",
    input: "None",
    output: `{ questions: [{ id, text, hint, options: [{ id, label, description }] }] }`,
    examplePrompt: "What AI stack should I use?",
  },
  {
    name: "recommend_stack",
    color: "#7c6bff",
    description:
      "Takes answers to the questionnaire and returns a slot-by-slot recommendation using AIchitect's scoring system and live tool health data.",
    input: `{ answers: [{ question_id, option_id }] }`,
    output: `{ recommended_stack_id, recommendations: [{ slot, priority, tool }], fitness_score, tier, archetype }`,
    examplePrompt: null,
  },
  {
    name: "roast_stack",
    color: "#ff6b6b",
    description:
      "Roasts your AI stack with grounded wit. Pass tool names as you know them — no internal IDs needed.",
    input: `{ tools: string[], roastness_level?: 1–5 }`,
    output: `{ lines: string[], tier, fitness_score, skipped: string[] }`,
    examplePrompt: "Roast my stack: Cursor, LangGraph, Supabase",
  },
  {
    name: "challenge_stack",
    color: "#fdcb6e",
    description:
      "Argues adversarially against your tool choices. Returns a grounded architectural challenge per tool with an actionable recommendation.",
    input: `{ tools: string[] }`,
    output: `{ challenges: [{ tool, challenge, recommendation }], skipped: string[] }`,
    examplePrompt: "Challenge my stack: Cursor, LangGraph, Supabase",
  },
];

const EXAMPLE_PROMPTS = [
  "What AI stack should I use for a RAG app with a small team?",
  "Roast my stack: Cursor, Claude Code, LangGraph, Supabase",
  "Challenge my stack: Cursor, LangGraph, Supabase",
  "I'm building an AI coding agent. What stack should I use?",
];

const CLAUDE_CODE_CONFIG = `{
  "mcpServers": {
    "aichitect": {
      "type": "http",
      "url": "${MCP_URL}"
    }
  }
}`;

// ─── Sub-components ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: 11,
        fontWeight: 700,
        color: "var(--accent)",
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        margin: "0 0 10px",
      }}
    >
      {children}
    </p>
  );
}

function CodeBlock({
  children,
  copyText,
  language,
}: {
  children: React.ReactNode;
  copyText: string;
  language?: string;
}) {
  return (
    <div style={{ position: "relative" }}>
      <pre
        style={{
          margin: 0,
          padding: "14px 16px",
          background: "#0d0d16",
          border: "1px solid #1e1e2e",
          borderRadius: 8,
          fontFamily: "monospace",
          fontSize: 13,
          color: "#c0c0d8",
          overflowX: "auto",
          lineHeight: 1.6,
        }}
      >
        {language && (
          <span
            style={{
              display: "block",
              fontSize: 10,
              color: "#555577",
              marginBottom: 8,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            {language}
          </span>
        )}
        <code>{children}</code>
      </pre>
      <div style={{ position: "absolute", top: 10, right: 10 }}>
        <CopyButton text={copyText} />
      </div>
    </div>
  );
}

function ToolCard({
  name,
  color,
  description,
  input,
  output,
  examplePrompt,
}: (typeof TOOLS)[number]) {
  return (
    <div
      style={{
        borderRadius: 10,
        background: "var(--surface, #111118)",
        border: "1px solid #1e1e2e",
        overflow: "hidden",
      }}
    >
      <div style={{ height: 2, background: color }} />
      <div style={{ padding: "16px 18px 18px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8,
            gap: 12,
          }}
        >
          <code
            style={{
              fontSize: 14,
              fontWeight: 600,
              color,
              fontFamily: "monospace",
            }}
          >
            {name}
          </code>
          {examplePrompt && <CopyButton text={examplePrompt} label="Copy prompt" />}
        </div>

        <p style={{ fontSize: 13, color: "#8888aa", margin: "0 0 14px", lineHeight: 1.55 }}>
          {description}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div>
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: "#555577",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Input
            </span>
            <pre
              style={{
                margin: "4px 0 0",
                padding: "8px 12px",
                background: "#0d0d16",
                border: "1px solid #1e1e2e",
                borderRadius: 6,
                fontFamily: "monospace",
                fontSize: 12,
                color: "#6666aa",
                overflowX: "auto",
              }}
            >
              {input}
            </pre>
          </div>
          <div>
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: "#555577",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Output
            </span>
            <pre
              style={{
                margin: "4px 0 0",
                padding: "8px 12px",
                background: "#0d0d16",
                border: "1px solid #1e1e2e",
                borderRadius: 6,
                fontFamily: "monospace",
                fontSize: 12,
                color: "#6666aa",
                overflowX: "auto",
              }}
            >
              {output}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function McpPage() {
  return (
    <div
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "48px 20px 100px",
        color: "#f0f0f8",
      }}
    >
      {/* ── Hero ── */}
      <div style={{ marginBottom: 56 }}>
        <SectionLabel>MCP Server</SectionLabel>
        <h1
          style={{
            fontSize: "clamp(28px, 5vw, 42px)",
            fontWeight: 800,
            letterSpacing: -1,
            lineHeight: 1.1,
            margin: "0 0 14px",
          }}
        >
          Stack intelligence,{" "}
          <span
            style={{
              background: "linear-gradient(135deg, #7c6bff, #00d4aa)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            inside your editor
          </span>
        </h1>
        <p
          style={{
            fontSize: 16,
            color: "#8888aa",
            lineHeight: 1.6,
            margin: "0 0 28px",
            maxWidth: 520,
          }}
        >
          Add AIchitect as a remote MCP server. Get personalised stack recommendations, roast, and
          challenge your choices — without leaving Cursor or Claude. Because asking your AI to
          research the entire ecosystem burns tokens. AIchitect already did that work.
        </p>

        {/* URL block */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 16px",
            background: "#0d0d16",
            border: "1px solid #7c6bff44",
            borderRadius: 10,
            boxShadow: "0 0 24px #7c6bff08",
          }}
        >
          <code
            style={{
              flex: 1,
              fontFamily: "monospace",
              fontSize: 14,
              color: "#a29bfe",
              overflowX: "auto",
              whiteSpace: "nowrap",
            }}
          >
            {MCP_URL}
          </code>
          <CopyButton text={MCP_URL} label="Copy URL" />
        </div>

        {/* Notes row */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "6px 16px",
            marginTop: 12,
          }}
        >
          {["No authentication required", "Stateless", "4 tools available", "Saves tokens"].map(
            (note) => (
              <span key={note} style={{ fontSize: 12, color: "#555577" }}>
                · {note}
              </span>
            )
          )}
        </div>
      </div>

      {/* ── Quick setup ── */}
      <div style={{ marginBottom: 56 }}>
        <SectionLabel>Quick setup</SectionLabel>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 20px", letterSpacing: -0.3 }}>
          Add to your AI editor
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Claude Code */}
          <div>
            <p
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#c0c0d8",
                margin: "0 0 8px",
              }}
            >
              Claude Code{" "}
              <span style={{ fontWeight: 400, color: "#555577" }}>
                — add to <code style={{ fontFamily: "monospace" }}>~/.claude/settings.json</code>
              </span>
            </p>
            <CodeBlock copyText={CLAUDE_CODE_CONFIG} language="json">
              {CLAUDE_CODE_CONFIG}
            </CodeBlock>
          </div>

          {/* Cursor */}
          <div>
            <p
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#c0c0d8",
                margin: "0 0 8px",
              }}
            >
              Cursor{" "}
              <span style={{ fontWeight: 400, color: "#555577" }}>
                — Settings → MCP → Add server
              </span>
            </p>
            <div
              style={{
                padding: "12px 16px",
                background: "#0d0d16",
                border: "1px solid #1e1e2e",
                borderRadius: 8,
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              {[
                { label: "Transport", value: "Streamable HTTP" },
                { label: "URL", value: MCP_URL },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <span
                    style={{
                      fontSize: 12,
                      color: "#555577",
                      minWidth: 72,
                      fontFamily: "monospace",
                    }}
                  >
                    {label}
                  </span>
                  <code style={{ fontSize: 13, color: "#c0c0d8", fontFamily: "monospace" }}>
                    {value}
                  </code>
                </div>
              ))}
            </div>
          </div>

          {/* Any client */}
          <p style={{ fontSize: 12, color: "#555577", margin: 0 }}>
            Works with any MCP-compatible client — Windsurf, Zed, or your own agent.
          </p>
        </div>
      </div>

      {/* ── Tool reference ── */}
      <div style={{ marginBottom: 56 }}>
        <SectionLabel>Tool reference</SectionLabel>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 20px", letterSpacing: -0.3 }}>
          Available tools
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {TOOLS.map((tool) => (
            <ToolCard key={tool.name} {...tool} />
          ))}
        </div>
      </div>

      {/* ── Example prompts ── */}
      <div style={{ marginBottom: 56 }}>
        <SectionLabel>Try it now</SectionLabel>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 8px", letterSpacing: -0.3 }}>
          Example prompts
        </h2>
        <p style={{ fontSize: 13, color: "#555577", margin: "0 0 20px" }}>
          Once the MCP server is added, paste any of these directly into your AI editor.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {EXAMPLE_PROMPTS.map((prompt) => (
            <div
              key={prompt}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                padding: "10px 14px",
                background: "#111118",
                border: "1px solid #1e1e2e",
                borderRadius: 8,
              }}
            >
              <code
                style={{
                  fontFamily: "monospace",
                  fontSize: 13,
                  color: "#c0c0d8",
                  flex: 1,
                  lineHeight: 1.4,
                }}
              >
                {prompt}
              </code>
              <CopyButton text={prompt} />
            </div>
          ))}
        </div>
      </div>

      {/* ── Footer note ── */}
      <div
        style={{
          padding: "16px 20px",
          background: "#111118",
          border: "1px solid #1e1e2e",
          borderRadius: 10,
          display: "flex",
          flexWrap: "wrap",
          gap: "6px 24px",
        }}
      >
        {[
          "No authentication required",
          "Stateless — nothing stored per session",
          "Saves tokens vs. asking Claude to research stacks from scratch",
          "Powered by AIchitect's live catalog + Gemini",
        ].map((note) => (
          <span key={note} style={{ fontSize: 12, color: "#555577" }}>
            {note}
          </span>
        ))}
      </div>
    </div>
  );
}
