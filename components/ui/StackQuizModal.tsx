"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { scoreStacks, QuizAnswers, StackMatch } from "@/lib/quizScoring";
import stacksData from "@/data/stacks.json";
import { Stack } from "@/lib/types";

const stacks = stacksData as Stack[];

// ─── Quiz content ──────────────────────────────────────────────────────────────

const QUESTIONS: {
  id: keyof QuizAnswers;
  question: string;
  hint: string;
  options: { value: string; label: string; sub?: string }[];
}[] = [
  {
    id: "what",
    question: "What are you building?",
    hint: "Pick the closest fit — you can always explore other stacks after.",
    options: [
      { value: "product", label: "A product or SaaS app", sub: "web app, API, full-stack" },
      { value: "rag", label: "RAG / knowledge base", sub: "Q&A, search, document chat" },
      { value: "coding", label: "AI coding agent or automation", sub: "dev tooling, SWE agents" },
      { value: "infra", label: "LLM infrastructure", sub: "model routing, observability" },
      { value: "design", label: "Design-to-code pipeline", sub: "UI gen, Figma handoff" },
      { value: "quality", label: "Eval & testing", sub: "prompt regression, quality gates" },
    ],
  },
  {
    id: "who",
    question: "Who's this for?",
    hint: "This shapes complexity and team-size assumptions.",
    options: [
      { value: "exploring", label: "Just me — learning and exploring" },
      { value: "solo", label: "Solo developer / indie project" },
      { value: "team", label: "Small team or startup", sub: "2–20 people" },
      { value: "enterprise", label: "Large team / enterprise", sub: "compliance, scale, process" },
    ],
  },
  {
    id: "priority",
    question: "What matters most to you?",
    hint: "If you had to pick one thing to optimise for.",
    options: [
      {
        value: "speed",
        label: "Ship fast, iterate later",
        sub: "low overhead, fast feedback loop",
      },
      {
        value: "oss",
        label: "Open source & self-hosted",
        sub: "privacy, data residency, no lock-in",
      },
      {
        value: "reliability",
        label: "Reliability & observability",
        sub: "evals, tracing, production-grade",
      },
      { value: "flexibility", label: "No vendor lock-in", sub: "swap models, provider-agnostic" },
    ],
  },
  {
    id: "budget",
    question: "Monthly budget comfort?",
    hint: "Managed services vs. self-hosted shapes the recommendation significantly.",
    options: [
      { value: "free", label: "Free only", sub: "OSS + self-hosted" },
      { value: "low", label: "Under $100/mo", sub: "lean and scrappy" },
      { value: "medium", label: "$100–500/mo", sub: "growing product or team" },
      { value: "high", label: "$500+/mo or enterprise", sub: "no budget constraint" },
    ],
  },
];

const LABEL_COLOR: Record<string, string> = {
  "Perfect fit": "var(--success)",
  "Strong match": "var(--accent-2)",
  "Good match": "var(--accent)",
  "Decent fit": "#fd9644",
  "Partial match": "#8888aa",
};

const COMPLEXITY_COLOR: Record<string, string> = {
  beginner: "var(--success)",
  intermediate: "#fd9644",
  advanced: "var(--danger)",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProgressDots({ total, current }: { total: number; current: number }) {
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          style={{
            width: i < current ? 20 : 6,
            height: 6,
            borderRadius: 3,
            background:
              i < current ? "var(--accent)" : i === current ? "#7c6bff88" : "var(--btn-border)",
            transition: "all 220ms ease",
          }}
        />
      ))}
    </div>
  );
}

function OptionButton({
  option,
  selected,
  onClick,
}: {
  option: { value: string; label: string; sub?: string };
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "11px 14px",
        borderRadius: 9,
        background: selected ? "#7c6bff18" : "var(--btn)",
        border: `1px solid ${selected ? "#7c6bff66" : "var(--btn-border)"}`,
        color: selected ? "#f0f0f8" : "#8888aa",
        fontSize: 13,
        fontWeight: selected ? 500 : 400,
        cursor: "pointer",
        textAlign: "left",
        width: "100%",
        transition: "background 120ms, border-color 120ms, color 120ms",
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
      }}
      onMouseEnter={(e) => {
        if (!selected) {
          e.currentTarget.style.borderColor = "#3a3a4a";
          e.currentTarget.style.color = "#c0c0d8";
        }
      }}
      onMouseLeave={(e) => {
        if (!selected) {
          e.currentTarget.style.borderColor = "var(--btn-border)";
          e.currentTarget.style.color = "#8888aa";
        }
      }}
    >
      {/* Selection indicator */}
      <div
        style={{
          width: 16,
          height: 16,
          borderRadius: "50%",
          border: `1.5px solid ${selected ? "var(--accent)" : "#3a3a4a"}`,
          background: selected ? "var(--accent)" : "transparent",
          flexShrink: 0,
          marginTop: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 120ms",
        }}
      >
        {selected && (
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#fff",
            }}
          />
        )}
      </div>
      <div>
        <div style={{ lineHeight: 1.3 }}>{option.label}</div>
        {option.sub && (
          <div style={{ fontSize: 11, color: "#555577", marginTop: 2, lineHeight: 1.3 }}>
            {option.sub}
          </div>
        )}
      </div>
    </button>
  );
}

function MatchCard({
  match,
  stack,
  primary,
}: {
  match: StackMatch;
  stack: Stack;
  primary: boolean;
}) {
  const labelColor = LABEL_COLOR[match.label] ?? "#8888aa";
  const complexityColor = COMPLEXITY_COLOR[stack.complexity ?? "beginner"] ?? "#8888aa";
  const builderUrl = `/builder?s=${stack.tools.join(",")}`;

  if (!primary) {
    return (
      <div
        style={{
          padding: "14px 16px",
          borderRadius: 10,
          background: "var(--surface)",
          border: "1px solid #1e1e2e",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#f0f0f8" }}>{stack.name}</span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: labelColor,
                background: labelColor + "18",
                border: `1px solid ${labelColor}33`,
                padding: "1px 7px",
                borderRadius: 10,
                flexShrink: 0,
              }}
            >
              {match.label}
            </span>
          </div>
          <p
            style={{
              fontSize: 11,
              color: "#555577",
              margin: 0,
              lineHeight: 1.4,
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 1,
              WebkitBoxOrient: "vertical",
            }}
          >
            {stack.description}
          </p>
        </div>
        <Link
          href={builderUrl}
          style={{
            flexShrink: 0,
            fontSize: 11,
            fontWeight: 500,
            padding: "5px 12px",
            borderRadius: 6,
            background: "var(--btn)",
            border: "1px solid var(--btn-border)",
            color: "#8888aa",
            textDecoration: "none",
          }}
        >
          Try it →
        </Link>
      </div>
    );
  }

  return (
    <div
      style={{
        borderRadius: 12,
        background: "var(--surface)",
        border: "1px solid #7c6bff44",
        overflow: "hidden",
        boxShadow: "0 0 40px #7c6bff0a",
      }}
    >
      {/* Top accent */}
      <div
        style={{ height: 2, background: "linear-gradient(90deg, var(--accent), var(--accent-2))" }}
      />

      <div style={{ padding: "18px 20px 20px" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 10,
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: labelColor,
                  background: labelColor + "18",
                  border: `1px solid ${labelColor}33`,
                  padding: "2px 8px",
                  borderRadius: 10,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {match.label}
              </span>
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#f0f0f8", margin: 0 }}>
              {stack.name}
            </h3>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: 4,
              flexShrink: 0,
            }}
          >
            {stack.complexity && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: complexityColor,
                  background: complexityColor + "18",
                  padding: "2px 8px",
                  borderRadius: 10,
                  border: `1px solid ${complexityColor}33`,
                  textTransform: "capitalize",
                }}
              >
                {stack.complexity}
              </span>
            )}
            {stack.monthly_cost && (
              <span style={{ fontSize: 10, color: "#555577" }}>{stack.monthly_cost}/mo</span>
            )}
          </div>
        </div>

        {/* Description */}
        <p
          style={{
            fontSize: 12,
            color: "#8888aa",
            lineHeight: 1.55,
            margin: "0 0 12px",
          }}
        >
          {stack.description}
        </p>

        {/* Target */}
        {stack.target && (
          <p
            style={{
              fontSize: 11,
              color: "#555577",
              lineHeight: 1.4,
              margin: "0 0 14px",
              fontStyle: "italic",
            }}
          >
            Best for: {stack.target}
          </p>
        )}

        {/* Tool pills */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 16 }}>
          {stack.tools.slice(0, 6).map((id) => (
            <span
              key={id}
              style={{
                fontSize: 10,
                padding: "2px 8px",
                borderRadius: 10,
                background: "var(--btn)",
                border: "1px solid var(--btn-border)",
                color: "#6666aa",
                fontFamily: "monospace",
              }}
            >
              {id}
            </span>
          ))}
          {stack.tools.length > 6 && (
            <span
              style={{
                fontSize: 10,
                padding: "2px 8px",
                borderRadius: 10,
                background: "var(--btn)",
                border: "1px solid var(--btn-border)",
                color: "#444466",
              }}
            >
              +{stack.tools.length - 6} more
            </span>
          )}
        </div>

        {/* CTAs */}
        <div style={{ display: "flex", gap: 8 }}>
          <Link
            href={builderUrl}
            style={{
              flex: 1,
              padding: "9px 16px",
              borderRadius: 8,
              background: "var(--accent)",
              color: "#fff",
              fontSize: 12,
              fontWeight: 600,
              textDecoration: "none",
              textAlign: "center",
            }}
          >
            Open in Builder →
          </Link>
          <Link
            href="/stacks"
            style={{
              padding: "9px 14px",
              borderRadius: 8,
              background: "var(--btn)",
              border: "1px solid var(--btn-border)",
              color: "#8888aa",
              fontSize: 12,
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            View all stacks
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────

interface Props {
  onClose: () => void;
}

export function StackQuizModal({ onClose }: Props) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<QuizAnswers>>({});

  const q = QUESTIONS[step];
  const currentAnswer = q ? answers[q.id] : undefined;
  const isComplete = step >= QUESTIONS.length;

  const results = useMemo(
    () => (isComplete ? scoreStacks(answers as QuizAnswers) : null),
    [isComplete, answers]
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function pick(value: string) {
    const next = { ...answers, [q.id]: value };
    setAnswers(next);
    // Auto-advance after a short delay so user sees their selection land
    setTimeout(() => {
      setStep((s) => s + 1);
    }, 160);
  }

  function reset() {
    setStep(0);
    setAnswers({});
  }

  const topMatches = results
    ? results
        .slice(0, 2)
        .map((m: StackMatch) => ({
          match: m,
          stack: stacks.find((s: Stack) => s.id === m.stackId),
        }))
        .filter((x): x is { match: StackMatch; stack: Stack } => !!x.stack)
    : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          maxHeight: "90vh",
          background: "#111118",
          border: "1px solid var(--btn-border)",
          borderRadius: 16,
          boxShadow: "0 32px 80px rgba(0,0,0,0.7)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "18px 20px 16px",
            borderBottom: "1px solid #1e1e2e",
            flexShrink: 0,
          }}
        >
          <div>
            <p
              style={{
                fontSize: 11,
                color: "#555577",
                margin: "0 0 4px",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontWeight: 600,
              }}
            >
              {isComplete ? "Your match" : `Question ${step + 1} of ${QUESTIONS.length}`}
            </p>
            {!isComplete && <ProgressDots total={QUESTIONS.length} current={step} />}
            {isComplete && (
              <p style={{ fontSize: 13, fontWeight: 600, color: "#f0f0f8", margin: 0 }}>
                Here&apos;s where you should start
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#555577",
              fontSize: 18,
              cursor: "pointer",
              padding: 4,
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY: "auto", flex: 1, padding: "20px" }}>
          {!isComplete && q && (
            <div>
              <h2
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: "#f0f0f8",
                  margin: "0 0 6px",
                  letterSpacing: -0.3,
                }}
              >
                {q.question}
              </h2>
              <p style={{ fontSize: 12, color: "#555577", margin: "0 0 18px", lineHeight: 1.5 }}>
                {q.hint}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {q.options.map((opt) => (
                  <OptionButton
                    key={opt.value}
                    option={opt}
                    selected={currentAnswer === opt.value}
                    onClick={() => pick(opt.value)}
                  />
                ))}
              </div>
            </div>
          )}

          {isComplete && topMatches.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <MatchCard match={topMatches[0].match} stack={topMatches[0].stack} primary />

              {topMatches[1] && (
                <div>
                  <p
                    style={{
                      fontSize: 10,
                      color: "#555577",
                      margin: "0 0 8px",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      fontWeight: 600,
                    }}
                  >
                    Runner-up
                  </p>
                  <MatchCard
                    match={topMatches[1].match}
                    stack={topMatches[1].stack}
                    primary={false}
                  />
                </div>
              )}

              <button
                onClick={reset}
                style={{
                  marginTop: 4,
                  padding: "8px",
                  background: "none",
                  border: "none",
                  color: "#555577",
                  fontSize: 11,
                  cursor: "pointer",
                  textDecoration: "underline",
                  textUnderlineOffset: 3,
                }}
              >
                Retake the quiz
              </button>
            </div>
          )}
        </div>

        {/* Footer — back nav */}
        {!isComplete && step > 0 && (
          <div
            style={{
              borderTop: "1px solid #1e1e2e",
              padding: "12px 20px",
              flexShrink: 0,
            }}
          >
            <button
              onClick={() => setStep((s) => s - 1)}
              style={{
                background: "none",
                border: "none",
                color: "#555577",
                fontSize: 12,
                cursor: "pointer",
                padding: 0,
              }}
            >
              ← Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Trigger button (used in landing page) ────────────────────────────────────

export function FindMyStackButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "0 28px",
          height: 46,
          borderRadius: 10,
          background: "var(--accent)",
          color: "#fff",
          fontSize: 14,
          fontWeight: 600,
          border: "none",
          cursor: "pointer",
        }}
      >
        Find my stack
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </button>

      {open && <StackQuizModal onClose={() => setOpen(false)} />}
    </>
  );
}
