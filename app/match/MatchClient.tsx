"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { scoreStacks, QuizAnswers, StackMatch } from "@/lib/quizScoring";
import stacksData from "@/data/stacks.json";
import { Stack } from "@/lib/types";

const stacks = stacksData as Stack[];

// ─── Quiz content (mirrors StackQuizModal — single source will be extracted if a 3rd consumer appears) ─

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

// ─── Sub-components ────────────────────────────────────────────────────────────

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
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />
        )}
      </div>
      <div>
        <div style={{ lineHeight: 1.3 }}>{option.label}</div>
        {option.sub && (
          <div style={{ fontSize: 12, color: "#555577", marginTop: 2, lineHeight: 1.3 }}>
            {option.sub}
          </div>
        )}
      </div>
    </button>
  );
}

function PrimaryMatchCard({ match, stack }: { match: StackMatch; stack: Stack }) {
  const labelColor = LABEL_COLOR[match.label] ?? "#8888aa";
  const complexityColor = COMPLEXITY_COLOR[stack.complexity ?? "beginner"] ?? "#8888aa";
  const builderUrl = `/builder?s=${stack.tools.join(",")}`;
  const stacksUrl = `/stacks?stack=${stack.id}`;

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
      <div
        style={{ height: 2, background: "linear-gradient(90deg, var(--accent), var(--accent-2))" }}
      />

      <div style={{ padding: "20px 22px 22px" }}>
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
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "#f0f0f8", margin: 0 }}>
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
        <p style={{ fontSize: 13, color: "#8888aa", lineHeight: 1.55, margin: "0 0 6px" }}>
          {stack.description}
        </p>
        {stack.target && (
          <p
            style={{
              fontSize: 12,
              color: "#555577",
              lineHeight: 1.4,
              margin: "0 0 14px",
              fontStyle: "italic",
            }}
          >
            Best for: {stack.target}
          </p>
        )}

        {/* Tools */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 16 }}>
          {stack.tools.slice(0, 7).map((id) => (
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
          {stack.tools.length > 7 && (
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
              +{stack.tools.length - 7} more
            </span>
          )}
        </div>

        {/* Kill conditions */}
        {stack.kill_conditions && stack.kill_conditions.length > 0 && (
          <div
            style={{
              marginBottom: 16,
              padding: "10px 12px",
              borderRadius: 8,
              background: "#ff6b6b08",
              border: "1px solid #ff6b6b22",
            }}
          >
            <p
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "#ff6b6b88",
                margin: "0 0 6px",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Kill conditions — when to move on
            </p>
            <ul
              style={{
                margin: 0,
                padding: 0,
                listStyle: "none",
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              {stack.kill_conditions.slice(0, 2).map((cond, i) => (
                <li
                  key={i}
                  style={{
                    fontSize: 12,
                    color: "#8888aa",
                    lineHeight: 1.45,
                    display: "flex",
                    gap: 6,
                  }}
                >
                  <span style={{ color: "#ff6b6b66", flexShrink: 0 }}>✕</span>
                  {cond}
                </li>
              ))}
            </ul>
          </div>
        )}

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
            href={stacksUrl}
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
            View stack
          </Link>
        </div>
      </div>
    </div>
  );
}

function RunnerUpCard({ match, stack }: { match: StackMatch; stack: Stack }) {
  const labelColor = LABEL_COLOR[match.label] ?? "#8888aa";
  const builderUrl = `/builder?s=${stack.tools.join(",")}`;

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
            fontSize: 12,
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
          fontSize: 12,
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

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function MatchClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read answers from URL — if all 4 present, skip straight to results
  const urlAnswers: Partial<QuizAnswers> = {
    what: searchParams.get("what") ?? undefined,
    who: searchParams.get("who") ?? undefined,
    priority: searchParams.get("priority") ?? undefined,
    budget: searchParams.get("budget") ?? undefined,
  };
  const urlComplete =
    !!urlAnswers.what && !!urlAnswers.who && !!urlAnswers.priority && !!urlAnswers.budget;

  const [step, setStep] = useState(urlComplete ? QUESTIONS.length : 0);
  const [answers, setAnswers] = useState<Partial<QuizAnswers>>(
    urlComplete ? (urlAnswers as QuizAnswers) : {}
  );
  const [copied, setCopied] = useState(false);

  const isComplete = step >= QUESTIONS.length;
  const q = QUESTIONS[step];
  const currentAnswer = q ? answers[q.id] : undefined;

  const results = useMemo(
    () => (isComplete ? scoreStacks(answers as QuizAnswers) : null),
    [isComplete, answers]
  );

  const topMatches = results
    ? results
        .slice(0, 3)
        .map((m: StackMatch) => ({
          match: m,
          stack: stacks.find((s: Stack) => s.id === m.stackId),
        }))
        .filter((x): x is { match: StackMatch; stack: Stack } => !!x.stack)
    : [];

  function pick(value: string) {
    const next = { ...answers, [q.id]: value };
    setAnswers(next);
    setTimeout(() => {
      const nextStep = step + 1;
      setStep(nextStep);
      // On completion, push answers to URL for shareability
      if (nextStep >= QUESTIONS.length) {
        const params = new URLSearchParams({
          what: next.what ?? "",
          who: next.who ?? "",
          priority: next.priority ?? "",
          budget: next.budget ?? "",
        });
        router.replace(`/match?${params.toString()}`, { scroll: false });
      }
    }, 160);
  }

  function reset() {
    setStep(0);
    setAnswers({});
    router.replace("/match", { scroll: false });
  }

  function copyShareUrl() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div
      style={{
        minHeight: "calc(100vh - 56px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        padding: "40px 16px 80px",
        background: "var(--bg)",
      }}
    >
      <div style={{ width: "100%", maxWidth: 560 }}>
        {/* Header */}
        <div style={{ marginBottom: 32, textAlign: "center" }}>
          <p
            style={{
              fontSize: 12,
              color: "var(--accent)",
              margin: "0 0 10px",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              fontWeight: 700,
            }}
          >
            Stack Matcher
          </p>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: "#f0f0f8",
              margin: "0 0 8px",
              letterSpacing: -0.5,
            }}
          >
            {isComplete ? "Here's where you should start" : "Find your AI stack"}
          </h1>
          <p style={{ fontSize: 13, color: "#555577", margin: 0, lineHeight: 1.5 }}>
            {isComplete
              ? "Matched to your role, use case, budget, and priorities."
              : "4 questions. Opinionated recommendations. No fluff."}
          </p>
        </div>

        {/* Quiz */}
        {!isComplete && q && (
          <div
            style={{
              background: "#111118",
              border: "1px solid var(--btn-border)",
              borderRadius: 16,
              padding: "24px",
            }}
          >
            {/* Progress */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 20,
              }}
            >
              <ProgressDots total={QUESTIONS.length} current={step} />
              <span style={{ fontSize: 12, color: "#555577" }}>
                {step + 1} / {QUESTIONS.length}
              </span>
            </div>

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

            {step > 0 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                style={{
                  marginTop: 16,
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
            )}
          </div>
        )}

        {/* Results */}
        {isComplete && topMatches.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <PrimaryMatchCard match={topMatches[0].match} stack={topMatches[0].stack} />

            {topMatches.length > 1 && (
              <div>
                <p
                  style={{
                    fontSize: 10,
                    color: "#555577",
                    margin: "4px 0 8px",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    fontWeight: 600,
                  }}
                >
                  Also worth considering
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {topMatches.slice(1).map(({ match, stack }) => (
                    <RunnerUpCard key={stack.id} match={match} stack={stack} />
                  ))}
                </div>
              </div>
            )}

            {/* Share + reset */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: 4,
                paddingTop: 12,
                borderTop: "1px solid #1e1e2e",
              }}
            >
              <button
                onClick={reset}
                style={{
                  background: "none",
                  border: "none",
                  color: "#555577",
                  fontSize: 12,
                  cursor: "pointer",
                  textDecoration: "underline",
                  textUnderlineOffset: 3,
                  padding: 0,
                }}
              >
                Retake the quiz
              </button>
              <button
                onClick={copyShareUrl}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 14px",
                  borderRadius: 8,
                  background: copied ? "#00d4aa18" : "var(--btn)",
                  border: `1px solid ${copied ? "#00d4aa44" : "var(--btn-border)"}`,
                  color: copied ? "var(--accent-2)" : "#8888aa",
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 150ms",
                }}
              >
                {copied ? "✓ Copied!" : "Share results →"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
