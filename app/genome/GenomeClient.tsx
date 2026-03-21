"use client";

import { useState, useMemo, Suspense, createContext, useContext } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Tool, Slot, Relationship, getCategoryColor } from "@/lib/types";
import { detectTools, ProjectSnapshot } from "@/lib/parseStack";
import { analyzeGenome, GenomeReport, GenomeTier, TIER_COLORS } from "@/lib/genomeAnalysis";

interface GenomeData {
  allTools: Tool[];
  allSlots: Slot[];
  allRelationships: Relationship[];
}

const GenomeDataCtx = createContext<GenomeData>({
  allTools: [],
  allSlots: [],
  allRelationships: [],
});
function useGenomeData() {
  return useContext(GenomeDataCtx);
}

// ---------------------------------------------------------------------------
// Step 2 — curated workflow tool groups (undetectable from code)
// ---------------------------------------------------------------------------

const WORKFLOW_GROUPS: {
  label: string;
  toolIds: string[];
}[] = [
  {
    label: "Code editor",
    toolIds: ["cursor", "windsurf", "github-copilot", "zed", "jetbrains-ai", "continue", "cline"],
  },
  {
    label: "CLI agent",
    toolIds: ["claude-code", "aider", "goose", "plandex"],
  },
  {
    label: "Autonomous agent",
    toolIds: ["devin", "lovable", "openhands", "bolt-new", "gpt-pilot"],
  },
  {
    label: "DevOps & CI",
    toolIds: ["coderabbit", "sweep-ai", "qodo", "trunk", "sourcery", "graphite"],
  },
  {
    label: "Design to code",
    toolIds: ["v0", "framer-ai", "webflow-ai", "locofy", "galileo", "google-stitch"],
  },
  {
    label: "Docs",
    toolIds: ["mintlify", "notion-ai", "gitbook-ai", "swimm"],
  },
  {
    label: "Product",
    toolIds: ["linear-ai", "height-ai", "cycle", "kraftful"],
  },
];

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

type GenomeStep = "scan" | "workflow" | "results";

type InputTab = "package.json" | "requirements.txt" | "pyproject.toml" | ".env.example";

const INPUT_TABS: { id: InputTab; label: string; placeholder: string }[] = [
  {
    id: "package.json",
    label: "package.json",
    placeholder: `{\n  "dependencies": {\n    "openai": "^4.0.0",\n    "@langchain/core": "^0.1.0"\n  }\n}`,
  },
  {
    id: "requirements.txt",
    label: "requirements.txt",
    placeholder: "langchain>=0.1.0\nanthropicai\nlangfuse\n...",
  },
  {
    id: "pyproject.toml",
    label: "pyproject.toml",
    placeholder: '[project]\ndependencies = [\n  "anthropic>=0.25.0",\n  "langgraph",\n]\n...',
  },
  {
    id: ".env.example",
    label: ".env.example",
    placeholder: "ANTHROPIC_API_KEY=\nOPENAI_API_KEY=\nLANGFUSE_SECRET_KEY=\n...",
  },
];

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
            background: i < current ? "#7c6bff" : i === current ? "#7c6bff88" : "#2a2a3a",
            transition: "all 220ms ease",
          }}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 1 — Scan dependencies
// ---------------------------------------------------------------------------

function ScanStep({ onNext }: { onNext: (detectedIds: string[]) => void }) {
  const { allTools } = useGenomeData();
  const [activeTab, setActiveTab] = useState<InputTab>("package.json");
  const [inputs, setInputs] = useState<Record<InputTab, string>>({
    "package.json": "",
    "requirements.txt": "",
    "pyproject.toml": "",
    ".env.example": "",
  });

  function handleNext() {
    const snapshot: ProjectSnapshot = {
      packageJson: inputs["package.json"] || undefined,
      requirementsTxt: inputs["requirements.txt"] || undefined,
      pyprojectToml: inputs["pyproject.toml"] || undefined,
      envExample: inputs[".env.example"] || undefined,
    };
    const results = detectTools(snapshot, allTools);
    onNext(results.map((r) => r.toolId));
  }

  return (
    <div
      className="flex flex-col items-center justify-center flex-1"
      style={{ padding: "48px 24px", minHeight: 0 }}
    >
      {/* Header */}
      <div className="text-center mb-8" style={{ maxWidth: 500 }}>
        <div className="flex justify-center mb-4">
          <ProgressDots total={2} current={0} />
        </div>
        <p
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "#555577",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 10,
          }}
        >
          Step 1 of 2 — Scan your codebase
        </p>
        <h1
          style={{
            fontSize: 26,
            fontWeight: 700,
            color: "#f0f0f8",
            margin: "0 0 8px",
            letterSpacing: -0.3,
          }}
        >
          What does your project use?
        </h1>
        <p style={{ fontSize: 13, color: "#8888aa", lineHeight: 1.6, margin: 0 }}>
          Paste your dependency file to auto-detect your LLM providers, frameworks, vector DBs, and
          observability tools.
        </p>
      </div>

      {/* Input card */}
      <div
        style={{
          width: "100%",
          maxWidth: 560,
          background: "#0e0e18",
          border: "1px solid #1e1e2e",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        {/* Tabs */}
        <div className="flex border-b" style={{ borderColor: "#1e1e2e", background: "#111118" }}>
          {INPUT_TABS.map((tab) => {
            const active = activeTab === tab.id;
            const filled = !!inputs[tab.id].trim();
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: "10px 14px",
                  fontSize: 11,
                  fontWeight: active ? 500 : 400,
                  color: active ? "#f0f0f8" : filled ? "#00d4aa" : "#555577",
                  background: "transparent",
                  border: "none",
                  borderBottom: active ? "2px solid #7c6bff" : "2px solid transparent",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                {filled && !active && <span style={{ color: "#00d4aa", fontSize: 9 }}>✓</span>}
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Textarea */}
        <div style={{ padding: 16 }}>
          <textarea
            value={inputs[activeTab]}
            onChange={(e) => setInputs((p) => ({ ...p, [activeTab]: e.target.value }))}
            placeholder={INPUT_TABS.find((t) => t.id === activeTab)?.placeholder}
            spellCheck={false}
            style={{
              width: "100%",
              height: 180,
              resize: "none",
              background: "#0a0a0f",
              border: "1px solid #1e1e2e",
              borderRadius: 8,
              padding: "12px 14px",
              fontFamily: "monospace",
              fontSize: 12,
              lineHeight: 1.6,
              color: "#f0f0f8",
              outline: "none",
              boxSizing: "border-box",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#7c6bff66")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#1e1e2e")}
          />
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between border-t"
          style={{ borderColor: "#1e1e2e", padding: "12px 16px", background: "#111118" }}
        >
          <span style={{ fontSize: 11, color: "#555577" }}>
            Fill one or more tabs — more = better coverage
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={() => onNext([])}
              style={{
                background: "none",
                border: "none",
                fontSize: 11,
                color: "#555577",
                cursor: "pointer",
                textDecoration: "underline",
                textUnderlineOffset: 3,
                padding: 0,
              }}
            >
              Skip
            </button>
            <button
              onClick={handleNext}
              style={{
                padding: "0 20px",
                height: 34,
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 500,
                background: "#7c6bff",
                color: "#fff",
                border: "none",
                cursor: "pointer",
              }}
            >
              Next →
            </button>
          </div>
        </div>
      </div>

      <p style={{ marginTop: 20, fontSize: 11, color: "#333355" }}>
        All processing is client-side — nothing leaves your browser.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2 — Workflow tools (manual quick-add)
// ---------------------------------------------------------------------------

function WorkflowStep({
  detectedCount,
  onBack,
  onNext,
}: {
  detectedCount: number;
  onBack: () => void;
  onNext: (workflowIds: string[]) => void;
}) {
  const { allTools } = useGenomeData();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  // Build lookup once
  const toolById = useMemo(() => new Map(allTools.map((t) => [t.id, t])), [allTools]);

  return (
    <div
      className="flex flex-col items-center justify-start flex-1"
      style={{ padding: "40px 24px 32px", minHeight: 0, overflowY: "auto" }}
    >
      {/* Header */}
      <div className="text-center mb-8" style={{ maxWidth: 560, width: "100%" }}>
        <div className="flex justify-center mb-4">
          <ProgressDots total={2} current={1} />
        </div>
        <p
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "#555577",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 10,
          }}
        >
          Step 2 of 2 — Workflow tools
        </p>
        <h1
          style={{
            fontSize: 26,
            fontWeight: 700,
            color: "#f0f0f8",
            margin: "0 0 8px",
            letterSpacing: -0.3,
          }}
        >
          What&apos;s your dev workflow?
        </h1>
        <p style={{ fontSize: 13, color: "#8888aa", lineHeight: 1.6, margin: 0 }}>
          These tools don&apos;t show up in dependency files.
          {detectedCount > 0 && (
            <>
              {" "}
              We found <span style={{ color: "#f0f0f8" }}>{detectedCount} tools</span> in your code
              — now add the rest.
            </>
          )}
          {detectedCount === 0 && (
            <> Select everything you use — nothing is wrong with skipping code scanning.</>
          )}
        </p>
      </div>

      {/* Groups */}
      <div
        style={{
          width: "100%",
          maxWidth: 620,
          display: "flex",
          flexDirection: "column",
          gap: 20,
          marginBottom: 28,
        }}
      >
        {WORKFLOW_GROUPS.map((group) => {
          const tools = group.toolIds.map((id) => toolById.get(id)).filter((t): t is Tool => !!t);

          return (
            <div key={group.label}>
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "#555577",
                  margin: "0 0 8px",
                }}
              >
                {group.label}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                {tools.map((t) => {
                  const active = selected.has(t.id);
                  const color = getCategoryColor(t.category);
                  return (
                    <button
                      key={t.id}
                      onClick={() => toggle(t.id)}
                      style={{
                        padding: "6px 14px",
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: active ? 500 : 400,
                        background: active ? color + "20" : "#0e0e18",
                        border: `1px solid ${active ? color + "66" : "#2a2a3a"}`,
                        color: active ? color : "#8888aa",
                        cursor: "pointer",
                        transition: "all 140ms",
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                      }}
                    >
                      {active && (
                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                          <polyline
                            points="2,6 5,9 10,3"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                      {t.name}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer nav */}
      <div
        style={{
          width: "100%",
          maxWidth: 620,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <button
          onClick={onBack}
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
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {selected.size > 0 && (
            <span style={{ fontSize: 11, color: "#7c6bff" }}>{selected.size} selected</span>
          )}
          <button
            onClick={() => onNext(Array.from(selected))}
            style={{
              padding: "0 24px",
              height: 38,
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              background: "#7c6bff",
              color: "#fff",
              border: "none",
              cursor: "pointer",
            }}
          >
            {selected.size > 0 ? "See my genome →" : "Skip →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Results view
// ---------------------------------------------------------------------------

const PRIORITY_COLOR: Record<Slot["priority"], string> = {
  required: "#ff6b6b",
  recommended: "#fd9644",
  optional: "#555577",
};

function FitnessGauge({ score, tier }: { score: number; tier: GenomeTier }) {
  const color = TIER_COLORS[tier];
  const r = 44;
  const circumference = 2 * Math.PI * r;
  const dash = (score / 100) * circumference;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <div style={{ position: "relative", width: 104, height: 104 }}>
        <svg width="104" height="104" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="52" cy="52" r={r} fill="none" stroke="#1e1e2e" strokeWidth="8" />
          <circle
            cx="52"
            cy="52"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={`${dash} ${circumference}`}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 0.6s ease" }}
          />
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ fontSize: 26, fontWeight: 700, color: "#f0f0f8", lineHeight: 1 }}>
            {score}
          </span>
          <span style={{ fontSize: 9, color: "#8888aa", marginTop: 2 }}>/ 100</span>
        </div>
      </div>
      <div
        style={{
          padding: "2px 10px",
          borderRadius: 20,
          fontSize: 10,
          fontWeight: 600,
          background: color + "18",
          border: `1px solid ${color}44`,
          color,
        }}
      >
        {tier}
      </div>
    </div>
  );
}

function SlotGrid({ report }: { report: GenomeReport }) {
  const { allSlots } = useGenomeData();
  const filled = new Map(report.filledSlots.map((f) => [f.slotId, f]));

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(175px, 1fr))",
        gap: 7,
      }}
    >
      {allSlots.map((slot) => {
        const f = filled.get(slot.id);
        const color = f ? getCategoryColor(f.tool.category) : PRIORITY_COLOR[slot.priority];

        return (
          <div
            key={slot.id}
            style={{
              borderRadius: 8,
              padding: "10px 12px",
              background: f ? color + "12" : "#0e0e18",
              border: `1px solid ${f ? color + "33" : "#1e1e2e"}`,
              opacity: !f && slot.priority === "optional" ? 0.45 : 1,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <div
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: color,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 600,
                  color: "#555577",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                {slot.id.replace(/-/g, " ")}
              </span>
            </div>
            {f ? (
              <p style={{ fontSize: 12, fontWeight: 500, color, margin: 0 }}>{f.tool.name}</p>
            ) : (
              <p style={{ fontSize: 11, color: "#444466", margin: 0, fontStyle: "italic" }}>
                empty
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function MissingPanel({ report }: { report: GenomeReport }) {
  const visible = report.missingSlots.filter((m) => m.priority !== "optional");
  if (visible.length === 0) return null;

  return (
    <div>
      <p
        style={{
          fontSize: 10,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "#555577",
          margin: "0 0 8px",
        }}
      >
        Missing layers
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {visible.map((m) => {
          const color = PRIORITY_COLOR[m.priority];
          return (
            <div
              key={m.slotId}
              style={{
                borderRadius: 8,
                padding: "10px 12px",
                background: "#0e0e18",
                border: `1px solid ${color}33`,
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: color,
                  flexShrink: 0,
                  marginTop: 5,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
                  <span style={{ fontSize: 12, fontWeight: 500, color: "#f0f0f8" }}>
                    {m.slotName}
                  </span>
                  <span
                    style={{
                      fontSize: 8,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: color + "cc",
                      padding: "1px 5px",
                      borderRadius: 3,
                      background: color + "18",
                    }}
                  >
                    {m.priority}
                  </span>
                </div>
                {m.suggestTool && (
                  <p style={{ fontSize: 11, color: "#8888aa", margin: 0 }}>
                    Consider{" "}
                    <span
                      style={{ color: getCategoryColor(m.suggestTool.category), fontWeight: 500 }}
                    >
                      {m.suggestTool.name}
                    </span>
                    {m.suggestReason && ` — ${m.suggestReason}`}
                  </p>
                )}
              </div>
              {m.suggestTool && (
                <Link
                  href={`/builder?s=${m.suggestTool.id}`}
                  style={{
                    fontSize: 10,
                    fontWeight: 500,
                    color: "#7c6bff",
                    background: "#7c6bff18",
                    border: "1px solid #7c6bff33",
                    borderRadius: 6,
                    padding: "3px 8px",
                    textDecoration: "none",
                    flexShrink: 0,
                    whiteSpace: "nowrap",
                  }}
                >
                  Add →
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ResultsView({
  report,
  allIds,
  onReset,
}: {
  report: GenomeReport;
  allIds: string[];
  onReset: () => void;
}) {
  const { allSlots } = useGenomeData();
  const [copied, setCopied] = useState(false);

  function copyLink() {
    const url = `${window.location.origin}/genome?deps=${allIds.join(",")}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Results header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
          borderBottom: "1px solid #1e1e2e",
          padding: "11px 20px",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={onReset}
            style={{
              background: "none",
              border: "none",
              fontSize: 11,
              color: "#8888aa",
              cursor: "pointer",
              padding: 0,
            }}
          >
            ← Re-analyze
          </button>
          <span style={{ color: "#1e1e2e" }}>|</span>
          <span style={{ fontSize: 12, color: "#8888aa" }}>
            <span style={{ color: "#f0f0f8", fontWeight: 500 }}>{allIds.length}</span> tools in your
            genome
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Link
            href={`/builder?s=${allIds.join(",")}`}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "0 14px",
              height: 32,
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 500,
              background: "#7c6bff18",
              border: "1px solid #7c6bff44",
              color: "#7c6bff",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            Open in Builder →
          </Link>
          <button
            onClick={copyLink}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "0 14px",
              height: 32,
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 500,
              background: copied ? "#00d4aa30" : "#00d4aa18",
              border: `1px solid ${copied ? "#00d4aa88" : "#00d4aa44"}`,
              color: "#00d4aa",
              cursor: "pointer",
            }}
          >
            {copied ? "Copied!" : "Share genome"}
          </button>
        </div>
      </div>

      {/* Scrollable body */}
      <div
        style={{
          flex: 1,
          overflow: "auto",
          padding: "22px 24px",
          display: "flex",
          gap: 20,
          alignItems: "flex-start",
        }}
      >
        {/* Left sidebar */}
        <div
          style={{
            width: 210,
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            gap: 14,
            position: "sticky",
            top: 0,
          }}
        >
          {/* Score */}
          <div
            style={{
              background: "#0e0e18",
              border: "1px solid #1e1e2e",
              borderRadius: 12,
              padding: "20px 16px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            <FitnessGauge score={report.fitnessScore} tier={report.tier} />
            <div
              style={{
                width: "100%",
                borderTop: "1px solid #1e1e2e",
                paddingTop: 12,
                display: "flex",
                flexDirection: "column",
                gap: 7,
              }}
            >
              <Stat
                label="Slots covered"
                value={`${report.filledSlots.length} / ${allSlots.length}`}
              />
              <Stat
                label="Integration pairs"
                value={`${report.criticalPairsCovered} / ${report.criticalPairsTotal}`}
              />
            </div>
          </div>

          {/* Tool list */}
          <div
            style={{
              background: "#0e0e18",
              border: "1px solid #1e1e2e",
              borderRadius: 10,
              overflow: "hidden",
            }}
          >
            <div style={{ padding: "8px 12px", borderBottom: "1px solid #1e1e2e" }}>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: "#555577",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                Your tools
              </span>
            </div>
            <div
              style={{
                padding: "8px 12px",
                display: "flex",
                flexDirection: "column",
                gap: 5,
                maxHeight: 280,
                overflowY: "auto",
              }}
            >
              {report.detectedTools.map((t) => (
                <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <div
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: getCategoryColor(t.category),
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: 11, color: "#f0f0f8" }}>{t.name}</span>
                </div>
              ))}
              {report.detectedTools.length === 0 && (
                <p style={{ fontSize: 11, color: "#555577", margin: 0 }}>No tools detected</p>
              )}
            </div>
          </div>
        </div>

        {/* Main */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <p
              style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#555577",
                margin: "0 0 10px",
              }}
            >
              Stack genome — {report.filledSlots.length} of {allSlots.length} slots filled
            </p>
            <SlotGrid report={report} />
          </div>

          <MissingPanel report={report} />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <span style={{ fontSize: 10, color: "#555577" }}>{label}</span>
      <span style={{ fontSize: 11, fontWeight: 500, color: "#f0f0f8" }}>{value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Root — state machine
// ---------------------------------------------------------------------------

function GenomePageInner() {
  const { allTools, allSlots, allRelationships } = useGenomeData();
  const searchParams = useSearchParams();
  const router = useRouter();

  const urlDeps = useMemo(
    () =>
      (searchParams.get("deps") ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    [searchParams]
  );

  const [step, setStep] = useState<GenomeStep>(urlDeps.length > 0 ? "results" : "scan");
  const [detectedIds, setDetectedIds] = useState<string[]>(urlDeps);
  const [workflowIds, setWorkflowIds] = useState<string[]>([]);

  const allIds = useMemo(
    () => [...new Set([...detectedIds, ...workflowIds])],
    [detectedIds, workflowIds]
  );

  const report = useMemo(
    () => (step === "results" ? analyzeGenome(allIds, allTools, allSlots, allRelationships) : null),
    [step, allIds, allTools, allSlots, allRelationships]
  );

  function handleScanNext(ids: string[]) {
    setDetectedIds(ids);
    setStep("workflow");
  }

  function handleWorkflowNext(ids: string[]) {
    setWorkflowIds(ids);
    setStep("results");
    const all = [...new Set([...detectedIds, ...ids])];
    if (all.length > 0) {
      router.replace(`/genome?deps=${all.join(",")}`, { scroll: false });
    }
  }

  function handleReset() {
    setDetectedIds([]);
    setWorkflowIds([]);
    setStep("scan");
    router.replace("/genome", { scroll: false });
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        background: "#0a0a0f",
      }}
    >
      {step === "scan" && <ScanStep onNext={handleScanNext} />}

      {step === "workflow" && (
        <WorkflowStep
          detectedCount={detectedIds.length}
          onBack={() => setStep("scan")}
          onNext={handleWorkflowNext}
        />
      )}

      {step === "results" && report && (
        <ResultsView report={report} allIds={allIds} onReset={handleReset} />
      )}
    </div>
  );
}

export default function GenomeClient({
  tools,
  slots,
  relationships,
}: {
  tools: Tool[];
  slots: Slot[];
  relationships: Relationship[];
}) {
  return (
    <GenomeDataCtx.Provider
      value={{ allTools: tools, allSlots: slots, allRelationships: relationships }}
    >
      <Suspense
        fallback={
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "#555577",
              fontSize: 13,
            }}
          >
            Loading…
          </div>
        }
      >
        <GenomePageInner />
      </Suspense>
    </GenomeDataCtx.Provider>
  );
}
