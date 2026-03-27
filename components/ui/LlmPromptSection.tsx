"use client";

import { useState } from "react";

const PROMPT = `You are a senior AI engineer helping me evaluate my tech stack.

I'm building: [describe your product in 1–2 sentences]
My team: [solo / 2–5 / 10+ engineers]
Stage: [prototype / early users / scaling]
Budget: [bootstrapped / seed / Series A+]
OSS preference: [prefer open source / commercial is fine / indifferent]

For each tool I list below, tell me:
• Why it's the right choice for my context
• The top 2 alternatives I rejected — and what signal would make me switch
• Known failure modes / when I should replace it (kill conditions)
• What "graduating" from this tool looks like at 10× scale

My current stack:
• Code Editor:      [e.g. Cursor]
• LLM API:          [e.g. Claude API]
• Agent Framework:  [e.g. LangGraph]
• Vector DB:        [e.g. Pgvector]
• Observability:    [e.g. Langfuse]
• Eval Layer:       [e.g. none yet]
• Deployment:       [e.g. Vercel]

Also: flag any critical gaps — tool categories I haven't covered that I probably should.

Format as a structured decision brief I can share with my team.`;

const GAPS = [
  {
    icon: "⚡",
    label: "Live health signals",
    prompt: "Frozen at training cutoff",
    app: "Real-time stars, last commit, archive status",
    color: "#fdcb6e",
  },
  {
    icon: "👥",
    label: "Production signals",
    prompt: '"Commonly used" from training data',
    app: '"I use this" from actual builders — verified production usage',
    color: "#7c6bff",
  },
  {
    icon: "🗺️",
    label: "Visual dependency graph",
    prompt: "A text list of tools",
    app: "Interactive graph showing how your tools connect",
    color: "#00d4aa",
  },
  {
    icon: "🔗",
    label: "Shareable stack URL",
    prompt: "Copy-paste the chat transcript",
    app: "/builder?s=cursor,langgraph — one URL, shareable forever",
    color: "#26de81",
  },
  {
    icon: "🧬",
    label: "Fitness score",
    prompt: '"Your stack looks solid" (or doesn\'t)',
    app: "0–100 Genome score with slot coverage gaps and suggestions",
    color: "#ff6b6b",
  },
  {
    icon: "📚",
    label: "25+ curated stacks",
    prompt: "Hallucination risk on niche tools",
    app: "Community-vetted, with reasoning behind each pick",
    color: "#fd9644",
  },
];

export function LlmPromptSection() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(PROMPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <section
      style={{
        margin: "0 0 80px",
        padding: "0 24px",
        position: "relative",
      }}
    >
      {/* Full-bleed background strip */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "#08080e",
          borderTop: "1px solid #14141f",
          borderBottom: "1px solid #14141f",
          zIndex: 0,
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 1100,
          margin: "0 auto",
          padding: "72px 0 60px",
        }}
      >
        {/* ── Top: two-column headline + prompt ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 56,
            alignItems: "start",
            marginBottom: 52,
          }}
        >
          {/* LEFT: copy */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            {/* Eyebrow */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                padding: "5px 12px",
                borderRadius: 20,
                background: "#ffffff06",
                border: "1px solid #252535",
                marginBottom: 22,
                alignSelf: "flex-start",
              }}
            >
              <span style={{ fontSize: 12 }}>🤫</span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#444466",
                  letterSpacing: "0.09em",
                  textTransform: "uppercase",
                }}
              >
                Honest take
              </span>
            </div>

            <h2
              style={{
                fontSize: "clamp(24px, 3.5vw, 38px)",
                fontWeight: 800,
                letterSpacing: -1,
                color: "#d8d8ee",
                marginBottom: 16,
                lineHeight: 1.1,
              }}
            >
              You could honestly
              <br />
              just use ChatGPT.
            </h2>

            <p
              style={{
                fontSize: 14,
                color: "#4a4a6a",
                lineHeight: 1.75,
                maxWidth: 400,
              }}
            >
              A solid prompt gets you 80% there — rejection reasoning, tradeoffs, kill conditions.
              We know. So we wrote the prompt. Take it. Use it.
            </p>
          </div>

          {/* RIGHT: terminal prompt block */}
          <div
            style={{
              borderRadius: 14,
              background: "#05050c",
              border: "1px solid #1a1a2a",
              overflow: "hidden",
              boxShadow: "0 0 0 1px #0d0d1a, 0 24px 48px #00000060",
            }}
          >
            {/* Terminal chrome */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "11px 16px",
                borderBottom: "1px solid #12121e",
                background: "#080810",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#ff5f57" }} />
                <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#febc2e" }} />
                <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#28c840" }} />
                <span
                  style={{
                    fontSize: 12,
                    color: "#2a2a44",
                    marginLeft: 10,
                    fontFamily: "'SF Mono', 'Fira Code', monospace",
                  }}
                >
                  stack-brief.prompt
                </span>
              </div>
              <button
                onClick={handleCopy}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "5px 14px",
                  borderRadius: 7,
                  background: copied ? "#26de8118" : "#ffffff08",
                  border: copied ? "1px solid #26de8138" : "1px solid #1e1e30",
                  color: copied ? "#26de81" : "#555577",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 160ms ease",
                  letterSpacing: "0.02em",
                }}
              >
                {copied ? "✓ Copied!" : "Copy prompt"}
              </button>
            </div>

            {/* Prompt content — capped height so gap cards are visible below */}
            <div style={{ position: "relative" }}>
              <pre
                style={{
                  margin: 0,
                  padding: "20px 22px 24px",
                  fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', monospace",
                  fontSize: 11.5,
                  lineHeight: 1.8,
                  color: "#6060a0",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  overflowY: "auto",
                  maxHeight: 260,
                }}
              >
                {PROMPT.split("\n").map((line, i) => {
                  const parts = line.split(/(\[.*?\])/g);
                  return (
                    <span key={i}>
                      {parts.map((part, j) =>
                        part.startsWith("[") ? (
                          <span
                            key={j}
                            style={{
                              color: "#fdcb6eaa",
                              background: "#fdcb6e08",
                              borderRadius: 3,
                              padding: "0 3px",
                            }}
                          >
                            {part}
                          </span>
                        ) : (
                          <span key={j}>{part}</span>
                        )
                      )}
                      {"\n"}
                    </span>
                  );
                })}
              </pre>
              {/* Scroll fade */}
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 36,
                  background: "linear-gradient(to bottom, transparent, #05050c)",
                  pointerEvents: "none",
                }}
              />
            </div>

            {/* Bottom bar */}
            <div
              style={{
                borderTop: "1px solid #0f0f1c",
                padding: "9px 18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#07070e",
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  color: "#252535",
                  fontFamily: "monospace",
                }}
              >
                works with ChatGPT · Claude · Gemini · Grok
              </span>
              <span style={{ fontSize: 10, color: "#1e1e2e" }}>free forever</span>
            </div>
          </div>
        </div>

        {/* ── Bottom: gap cards ── */}
        <div
          style={{
            borderTop: "1px solid #14141f",
            paddingTop: 36,
          }}
        >
          <p
            style={{
              fontSize: "clamp(16px, 2vw, 20px)",
              fontWeight: 700,
              color: "#6060a0",
              letterSpacing: -0.3,
              marginBottom: 20,
            }}
          >
            Here&apos;s the other 20%.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 12,
            }}
          >
            {GAPS.map(({ icon, label, prompt, app, color }) => (
              <div
                key={label}
                style={{
                  borderRadius: 10,
                  background: "#0c0c14",
                  border: "1px solid #1a1a28",
                  padding: "16px 18px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 14 }}>{icon}</span>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#b0b0cc",
                      letterSpacing: -0.1,
                    }}
                  >
                    {label}
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: "#252535",
                        flexShrink: 0,
                        marginTop: 2,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                      }}
                    >
                      Prompt
                    </span>
                    <span style={{ fontSize: 12, color: "#333350", lineHeight: 1.5 }}>
                      {prompt}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color,
                        flexShrink: 0,
                        marginTop: 2,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                      }}
                    >
                      Here
                    </span>
                    <span style={{ fontSize: 12, color: "#7070a0", lineHeight: 1.5 }}>{app}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
