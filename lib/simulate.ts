/**
 * AI Stack Simulator — pure computation engine (AIC-126).
 *
 * Given a stack + scale inputs, projects monthly cost and latency across
 * nine scale steps and detects architectural breaking points.
 *
 * No side effects — safe to call from API routes, tests, or the browser.
 */

import toolsData from "@/data/tools.json";
import type { Tool } from "@/lib/types";

const allTools = toolsData as Tool[];

// ── Public types ──────────────────────────────────────────────────────────────

export type SimulationUseCase = "chatbot" | "rag" | "agent" | "custom";

export interface SimulationInput {
  useCase: SimulationUseCase;
  monthlyUsers: number;
  requestsPerUserPerDay: number;
  /** Total tokens per request (prompt + completion). Assumed 40% input / 60% output. */
  avgTokensPerRequest: number;
  stack: {
    llm: string; // tool id
    vectorDb?: string; // tool id
    framework?: string; // tool id
  };
}

export interface SimulationSnapshot {
  users: number;
  monthlyCostUSD: number;
  avgLatencyMs: number;
  /** Per-tool monthly cost in USD */
  costBreakdown: Record<string, number>;
  /** Per-layer latency contribution in ms */
  latencyBreakdown: Record<string, number>;
}

export interface BreakingPoint {
  users: number;
  type: "latency" | "cost" | "architecture";
  message: string;
}

export interface KillCondition {
  type: string;
  message: string;
  recommendation?: string;
}

export interface SimulationResult {
  snapshots: SimulationSnapshot[];
  breakingPoints: BreakingPoint[];
  killConditions: KillCondition[];
}

// ── Scale steps ───────────────────────────────────────────────────────────────

export const SCALE_STEPS = [
  1_000, 5_000, 10_000, 25_000, 50_000, 100_000, 250_000, 500_000, 1_000_000,
];

// ── Latency defaults ──────────────────────────────────────────────────────────
//
// Used only when a tool has no latency_p50_ms in its data record.
// Model-API tools (OpenAI, Anthropic, etc.) are synced from Artificial Analysis
// via the sync-benchmarks cron and will have latency_p50_ms populated at runtime.
// Static tools (inference providers, vector DBs, frameworks) have latency_p50_ms
// set directly in tools.json.

const DEFAULT_LLM_LATENCY_MS = 800;
const DEFAULT_VECTOR_LATENCY_MS = 80;
const DEFAULT_FRAMEWORK_LATENCY_MS = 100;

// ── Cost computation ──────────────────────────────────────────────────────────

const INPUT_TOKEN_RATIO = 0.4;
const OUTPUT_TOKEN_RATIO = 0.6;

/**
 * Compute monthly USD cost for a single tool at a given request volume.
 * Returns 0 for OSS/free tools — they are correctly treated as zero-cost for projection.
 * Returns 0 for usage_based tools — flagged separately in kill conditions.
 */
export function computeToolMonthlyCost(
  tool: Tool,
  monthlyRequests: number,
  avgTokensPerRequest: number
): number {
  const cm = tool.cost_model;
  if (!cm) return 0;

  switch (cm.type) {
    case "free":
      return 0;

    case "per_token": {
      const inputCostPerReq =
        ((avgTokensPerRequest * INPUT_TOKEN_RATIO) / 1000) * (cm.input_cost_per_1k_tokens ?? 0);
      const outputCostPerReq =
        ((avgTokensPerRequest * OUTPUT_TOKEN_RATIO) / 1000) * (cm.output_cost_per_1k_tokens ?? 0);
      return monthlyRequests * (inputCostPerReq + outputCostPerReq);
    }

    case "flat":
      return cm.cost_per_month_base ?? 0;

    case "per_seat":
      // In a backend API context seats don't scale with users — treat as flat infra cost
      return cm.cost_per_month_base ?? cm.cost_per_seat ?? 0;

    case "per_call":
      // Generic per-call estimate when no exact rate is available
      return monthlyRequests * 0.01;

    case "usage_based":
      // No published per-unit rate — cannot project. Flagged in kill conditions.
      return 0;
  }
}

// ── Latency computation ───────────────────────────────────────────────────────

export function computeLatency(stack: SimulationInput["stack"]): {
  totalMs: number;
  breakdown: Record<string, number>;
} {
  const breakdown: Record<string, number> = {};

  const llmTool = allTools.find((t) => t.id === stack.llm);
  breakdown["llm"] = llmTool?.latency_p50_ms ?? DEFAULT_LLM_LATENCY_MS;

  if (stack.vectorDb) {
    const vectorTool = allTools.find((t) => t.id === stack.vectorDb);
    breakdown["vector"] = vectorTool?.latency_p50_ms ?? DEFAULT_VECTOR_LATENCY_MS;
  }

  if (stack.framework) {
    const frameworkTool = allTools.find((t) => t.id === stack.framework);
    breakdown["framework"] = frameworkTool?.latency_p50_ms ?? DEFAULT_FRAMEWORK_LATENCY_MS;
  }

  const totalMs = Object.values(breakdown).reduce((sum, ms) => sum + ms, 0);
  return { totalMs, breakdown };
}

// ── Main simulation ───────────────────────────────────────────────────────────

export function simulate(input: SimulationInput): SimulationResult {
  const { useCase, monthlyUsers: _, requestsPerUserPerDay, avgTokensPerRequest, stack } = input;

  const llmTool = allTools.find((t) => t.id === stack.llm);
  const vectorTool = stack.vectorDb ? allTools.find((t) => t.id === stack.vectorDb) : undefined;
  const frameworkTool = stack.framework
    ? allTools.find((t) => t.id === stack.framework)
    : undefined;

  const { totalMs: latencyMs, breakdown: latencyBreakdown } = computeLatency(stack);

  // ── Snapshots ──────────────────────────────────────────────────────────────

  const snapshots: SimulationSnapshot[] = SCALE_STEPS.map((users) => {
    const monthlyRequests = users * requestsPerUserPerDay * 30;
    const costBreakdown: Record<string, number> = {};

    if (llmTool) {
      costBreakdown[stack.llm] = computeToolMonthlyCost(
        llmTool,
        monthlyRequests,
        avgTokensPerRequest
      );
    }
    if (vectorTool && stack.vectorDb) {
      costBreakdown[stack.vectorDb] = computeToolMonthlyCost(
        vectorTool,
        monthlyRequests,
        avgTokensPerRequest
      );
    }
    if (frameworkTool && stack.framework) {
      costBreakdown[stack.framework] = computeToolMonthlyCost(
        frameworkTool,
        monthlyRequests,
        avgTokensPerRequest
      );
    }

    const monthlyCostUSD = Object.values(costBreakdown).reduce((s, v) => s + v, 0);

    return { users, monthlyCostUSD, avgLatencyMs: latencyMs, costBreakdown, latencyBreakdown };
  });

  // ── Breaking points ────────────────────────────────────────────────────────

  const breakingPoints: BreakingPoint[] = [];
  const firedCostMilestones = new Set<number>();
  let latencyBreachFired = false;
  let llmDominanceFired = false;

  for (const snap of snapshots) {
    if (!latencyBreachFired && snap.avgLatencyMs > 2000) {
      breakingPoints.push({
        users: snap.users,
        type: "latency",
        message: `Latency risk at ${formatUsers(snap.users)} — avg response exceeds 2s`,
      });
      latencyBreachFired = true;
    }

    for (const milestone of [1_000, 5_000, 20_000]) {
      if (!firedCostMilestones.has(milestone) && snap.monthlyCostUSD >= milestone) {
        breakingPoints.push({
          users: snap.users,
          type: "cost",
          message: `Cost crosses $${milestone.toLocaleString()}/mo at ${formatUsers(snap.users)}`,
        });
        firedCostMilestones.add(milestone);
      }
    }

    // LLM dominance — only meaningful when total cost is significant and other layers exist
    const llmCost = snap.costBreakdown[stack.llm] ?? 0;
    const hasOtherCosts = snap.monthlyCostUSD - llmCost > 0;
    if (
      !llmDominanceFired &&
      hasOtherCosts &&
      snap.monthlyCostUSD > 100 &&
      llmCost / snap.monthlyCostUSD > 0.8
    ) {
      breakingPoints.push({
        users: snap.users,
        type: "architecture",
        message: `LLM cost dominates (${Math.round((llmCost / snap.monthlyCostUSD) * 100)}% of total) at ${formatUsers(snap.users)} — consider adding a caching layer`,
      });
      llmDominanceFired = true;
    }
  }

  // ── Kill conditions ────────────────────────────────────────────────────────

  const killConditions: KillCondition[] = [];

  if (useCase === "rag" && !stack.vectorDb) {
    killConditions.push({
      type: "missing_vector_db",
      message: "RAG without a vector store",
      recommendation: "Add a vector database (Qdrant, Pinecone, or pgvector) for retrieval.",
    });
  }

  killConditions.push({
    type: "no_eval_layer",
    message: "No eval layer in stack",
    recommendation:
      "Add Langfuse, Braintrust, or DeepEval to catch quality regressions before users do.",
  });

  const unprojectedTools = [
    llmTool && stack.llm,
    vectorTool && stack.vectorDb,
    frameworkTool && stack.framework,
  ]
    .filter((id): id is string => !!id)
    .filter((id) => {
      const tool = allTools.find((t) => t.id === id);
      return tool?.cost_model?.type === "usage_based";
    })
    .map((id) => allTools.find((t) => t.id === id)!.name);

  if (unprojectedTools.length > 0) {
    killConditions.push({
      type: "unprojected_cost",
      message: `Cost projection unavailable for: ${unprojectedTools.join(", ")}`,
      recommendation:
        "These tools have usage-based pricing without a published per-unit rate. Contact their team for volume estimates.",
    });
  }

  return { snapshots, breakingPoints, killConditions };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatUsers(n: number): string {
  return n >= 1_000_000 ? `${n / 1_000_000}M users` : `${(n / 1_000).toFixed(0)}k users`;
}
