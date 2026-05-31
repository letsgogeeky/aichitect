#!/usr/bin/env node
/**
 * PR 3 — Flagship E2E stacks + track/phases backfill.
 *
 *   1. Compute `phases` on every stack from its tools' lifecycle_phases.
 *   2. Reclassify `track` from "specialized" → "development" | "runtime"
 *      based on phase coverage:
 *        dev      = ≥2 dev-only phases AND ≤1 runtime-only phase
 *        runtime  = ≥3 runtime-only phases AND ≤1 dev-only phase
 *        else specialized
 *      Manual development marks from PR 1 (spec-driven-ai, async-coding-team)
 *      are preserved — never demoted.
 *   3. Append the two flagship stacks: AI Product End-to-End (dev track)
 *      and AI Product Runtime End-to-End (runtime track).
 *
 * Run via: node scripts/pr3-flagship-stacks.mjs
 * Idempotent: re-running produces no diff.
 */

import fs from "node:fs";
import path from "node:path";

const TOOLS_PATH = path.join("data", "tools.json");
const STACKS_PATH = path.join("data", "stacks.json");

const DEV_ONLY = new Set(["requirements", "specs", "design", "coding", "code-review"]);
const RUNTIME_ONLY = new Set([
  "providers",
  "orchestration",
  "retrieval-memory",
  "tools-mcp",
  "guardrails",
]);

const tools = JSON.parse(fs.readFileSync(TOOLS_PATH, "utf8"));
const stacks = JSON.parse(fs.readFileSync(STACKS_PATH, "utf8"));
const byId = new Map(tools.map((t) => [t.id, t]));

// ── 1. Compute phases per stack ───────────────────────────────────────────────

function computeStackPhases(stack) {
  const set = new Set();
  for (const id of stack.tools) {
    const t = byId.get(id);
    if (!t) continue;
    for (const p of t.lifecycle_phases) set.add(p);
  }
  // Stable canonical order matches LIFECYCLE_PHASES in lib/types.ts.
  const order = [
    "requirements",
    "specs",
    "design",
    "coding",
    "code-review",
    "providers",
    "orchestration",
    "retrieval-memory",
    "tools-mcp",
    "guardrails",
    "eval",
    "observability",
  ];
  return order.filter((p) => set.has(p));
}

function classifyTrack(phases) {
  const devCount = phases.filter((p) => DEV_ONLY.has(p)).length;
  const runtimeCount = phases.filter((p) => RUNTIME_ONLY.has(p)).length;
  if (devCount >= 2 && runtimeCount <= 1) return "development";
  if (runtimeCount >= 3 && devCount <= 1) return "runtime";
  return "specialized";
}

// ── 2. The two flagship stacks ────────────────────────────────────────────────

const FLAGSHIP_A = {
  id: "ai-product-e2e",
  name: "AI Product, End-to-End",
  description:
    "PRD through production observability with no gaps. The headline dev-workflow stack: requirements captured in Linear AI, specs distilled in BMAD-METHOD and Spec Kit, UI scaffolded in v0, coded in Cursor + Claude Code with AGENTS.md as the team contract, reviewed by CodeRabbit, evaluated with Promptfoo, observed in Langfuse.",
  target:
    "Product engineering teams shipping AI features who want one path from idea to production they can actually follow.",
  tools: [
    "linear-ai",
    "bmad-method",
    "spec-kit",
    "agents-md",
    "v0",
    "cursor",
    "claude-code",
    "coderabbit",
    "promptfoo",
    "langfuse",
  ],
  flow: [
    { from: "linear-ai", to: "bmad-method", label: "tickets → spec" },
    { from: "bmad-method", to: "spec-kit", label: "scaffold contract" },
    { from: "spec-kit", to: "agents-md", label: "encode conventions" },
    { from: "agents-md", to: "cursor", label: "agent contract" },
    { from: "agents-md", to: "claude-code", label: "agent contract" },
    { from: "spec-kit", to: "v0", label: "API → UI" },
    { from: "v0", to: "cursor", label: "hand off UI" },
    { from: "cursor", to: "claude-code", label: "interactive ↔ async" },
    { from: "claude-code", to: "coderabbit", label: "PR review" },
    { from: "coderabbit", to: "promptfoo", label: "merge gate" },
    { from: "promptfoo", to: "langfuse", label: "eval → telemetry" },
  ],
  cluster: "build",
  mission:
    "Cover every AI development phase — requirements through observability — with credible defaults at each step, so the team never has to argue about how to ship the next feature.",
  not_in_stack: [
    {
      tool: "windsurf",
      reason:
        "Cursor + Claude Code already cover both interactive and agent modes. A third editor splits team mental model without adding capability.",
    },
    {
      tool: "devin",
      reason:
        "Devin overlaps with claude-code's async role and bills per usage. Skip until claude-code can't keep up.",
    },
    {
      tool: "github-copilot",
      reason:
        "Lower-context completion than Cursor's repo-aware suggestions. Choose one editor, don't layer two.",
    },
    {
      tool: "langsmith",
      reason:
        "Langfuse covers both eval and prod telemetry with one tool. Adding LangSmith doubles the dashboard surface for marginal feature gain.",
    },
  ],
  kill_conditions: [
    "Your team is on a non-Linear PM tool and the import friction beats the AI ergonomics.",
    "Your codebase doesn't fit Cursor's index (>50GB) or you need fully self-hosted tooling.",
    "Your model spend is under ~$200/mo — Langfuse is overkill at that scale (use the Indie Hacker stack).",
  ],
  graduates_to: "ai-runtime-e2e",
  archetype: "dev-productivity",
  tags: ["e2e", "development", "flagship", "lifecycle"],
  why: "Because the gap between 'I have an AI feature idea' and 'it's in production with observability' is the entire job, not seven separate problems.",
  tradeoffs:
    "Strong opinion at every phase. If you disagree with one tool (e.g. you prefer Linear over Linear AI), the swap is one row. The shape stays.",
  complexity: "intermediate",
  monthly_cost: "$100-300 / engineer",
  target_team_size: ["small", "team"],
  budget_tier: "mid",
  use_cases: ["coding-assistant", "automation", "observability"],
  stage: ["mvp", "production"],
  track: "development",
  // phases computed below
  phases: [],
};

const FLAGSHIP_B = {
  id: "ai-runtime-e2e",
  name: "AI Product Runtime, End-to-End",
  description:
    "What the AI product actually IS at runtime — provider, orchestration, retrieval, tools, guardrails, eval, and observability, with no missing layer. The headline runtime stack for teams hardening their architecture.",
  target:
    "Engineering teams who've shipped v1 and are now locking down the runtime: dual-provider failover, agent orchestration, RAG, MCP-mediated tool access, guardrails, and telemetry.",
  tools: [
    "openai-api",
    "anthropic-api",
    "vercel-ai-sdk",
    "langgraph",
    "llamaindex",
    "qdrant",
    "mem0",
    "github-mcp",
    "composio",
    "lakera-guard",
    "langfuse",
  ],
  flow: [
    { from: "openai-api", to: "vercel-ai-sdk", label: "provider" },
    { from: "anthropic-api", to: "vercel-ai-sdk", label: "provider" },
    { from: "vercel-ai-sdk", to: "langgraph", label: "low-level → graph" },
    { from: "langgraph", to: "llamaindex", label: "agent → RAG" },
    { from: "llamaindex", to: "qdrant", label: "vector store" },
    { from: "langgraph", to: "mem0", label: "agent memory" },
    { from: "langgraph", to: "github-mcp", label: "MCP tool" },
    { from: "langgraph", to: "composio", label: "MCP gateway" },
    { from: "langgraph", to: "lakera-guard", label: "guardrail" },
    { from: "langgraph", to: "langfuse", label: "telemetry + eval" },
  ],
  cluster: "ship",
  mission:
    "Lock down every runtime layer of an AI product — from provider keys to telemetry — with defensible defaults so production behavior is debuggable and recoverable.",
  not_in_stack: [
    {
      tool: "litellm",
      reason:
        "Vercel AI SDK covers the same provider-routing job for TS apps. Pick one router, not two.",
    },
    {
      tool: "pinecone",
      reason:
        "Qdrant is OSS self-hostable with managed cloud — Pinecone is managed-only and costs more at scale.",
    },
    {
      tool: "google-gemini-api",
      reason:
        "OpenAI + Anthropic covers breadth. A third provider doubles eval surface for marginal model gain.",
    },
    {
      tool: "langchain",
      reason:
        "LangGraph is the graph-first successor — the chain-based LangChain APIs add complexity without paying off for production agents.",
    },
  ],
  kill_conditions: [
    "Your app is TypeScript-only and you can't take on a Python service (use the TypeScript-Only AI Stack).",
    "Your retrieval is purely lexical / SQL — no vector store needed (use a plain Postgres setup).",
    "Your spend is under $1k/mo — guardrails + observability layer is overkill for that volume.",
    "You only need one provider — drop the dual-provider failover, save the eval cost.",
  ],
  archetype: "app-infrastructure",
  tags: ["e2e", "runtime", "flagship", "lifecycle"],
  why: "Because picking 'OpenAI + LangChain' is half the runtime stack — the missing half (memory, tools, guardrails, observability) is where production breaks.",
  tradeoffs:
    "Anthropic + OpenAI dual-provider doubles eval surface but gives real failover. LangGraph + Vercel AI SDK overlap by design — Vercel handles HTTP, LangGraph handles graph state.",
  complexity: "advanced",
  monthly_cost: "$500-5000 / mo at scale",
  target_team_size: ["team", "org"],
  budget_tier: "mid",
  use_cases: ["rag", "chatbot", "automation", "observability"],
  stage: ["production", "scale"],
  track: "runtime",
  phases: [],
};

// Verify every referenced tool exists before we write anything.
function verifyTools(stack) {
  for (const id of stack.tools) {
    if (!byId.has(id)) throw new Error(`Stack "${stack.id}" references missing tool "${id}"`);
  }
}
verifyTools(FLAGSHIP_A);
verifyTools(FLAGSHIP_B);

// Compute phases from tools.
FLAGSHIP_A.phases = computeStackPhases(FLAGSHIP_A);
FLAGSHIP_B.phases = computeStackPhases(FLAGSHIP_B);

// ── 3. Backfill phases + track on every existing stack ────────────────────────

let phaseUpdates = 0;
let trackPromotions = 0;
const trackBefore = { development: 0, runtime: 0, specialized: 0 };
const trackAfter = { development: 0, runtime: 0, specialized: 0 };

for (const s of stacks) {
  trackBefore[s.track] = (trackBefore[s.track] ?? 0) + 1;

  const computedPhases = computeStackPhases(s);
  if (JSON.stringify(s.phases) !== JSON.stringify(computedPhases)) {
    s.phases = computedPhases;
    phaseUpdates++;
  }

  // Reclassify only stacks currently sitting at "specialized" (PR 1 default).
  // Manual development marks from PR 1 are preserved — never demoted.
  if (s.track === "specialized") {
    const classified = classifyTrack(s.phases);
    if (classified !== "specialized") {
      s.track = classified;
      trackPromotions++;
    }
  }

  trackAfter[s.track] = (trackAfter[s.track] ?? 0) + 1;
}

// ── 4. Add the flagships (skip if already present — idempotent) ──────────────

const stackIds = new Set(stacks.map((s) => s.id));
const flagshipsAdded = [];
for (const flagship of [FLAGSHIP_A, FLAGSHIP_B]) {
  if (stackIds.has(flagship.id)) continue;
  stacks.push(flagship);
  flagshipsAdded.push(flagship.id);
  trackAfter[flagship.track] = (trackAfter[flagship.track] ?? 0) + 1;
}

fs.writeFileSync(STACKS_PATH, JSON.stringify(stacks, null, 2) + "\n");

// ── 5. Summary ────────────────────────────────────────────────────────────────

console.log("PR 3 — Flagship E2E stacks + track/phases backfill");
console.log(`  Existing stacks scanned:        ${stacks.length - flagshipsAdded.length}`);
console.log(`  phases recomputed on:           ${phaseUpdates}`);
console.log(`  track promoted from specialized:${trackPromotions}`);
console.log(
  `  Flagships added:                ${flagshipsAdded.length}  (${flagshipsAdded.join(", ")})`
);
console.log("  Track distribution before:      ", JSON.stringify(trackBefore));
console.log("  Track distribution after:       ", JSON.stringify(trackAfter));
console.log(`  Stack catalog now:              ${stacks.length} stacks`);
console.log("");
console.log("  Flagship A phases:", FLAGSHIP_A.phases.join(", "));
console.log("  Flagship B phases:", FLAGSHIP_B.phases.join(", "));
