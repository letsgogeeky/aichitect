import { describe, it, expect } from "vitest";
import { simulate, computeToolMonthlyCost, computeLatency, SCALE_STEPS } from "@/lib/simulate";
import type { Tool } from "@/lib/types";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeTool(id: string, overrides: Partial<Tool> = {}): Tool {
  return {
    id,
    name: id,
    category: "llm-infra",
    tagline: "",
    description: "",
    type: "commercial",
    pricing: { free_tier: false, plans: [] },
    github_stars: null,
    slot: "llm",
    website_url: null,
    github_url: null,
    use_context: "app-infrastructure",
    ...overrides,
  };
}

// Fixture tools — every test passes this catalog. Values mirror the relevant
// rows of data/tools.json so assertions stay grounded in realistic numbers,
// but the engine no longer reads JSON itself.
const fixtureTools: Tool[] = [
  makeTool("openai-api", {
    cost_model: {
      type: "per_token",
      input_cost_per_1k_tokens: 0.0025,
      output_cost_per_1k_tokens: 0.01,
    },
    // No latency_p50_ms — exercises DEFAULT_LLM_LATENCY_MS fallback (the AA cron writes this in prod).
  }),
  makeTool("groq", {
    cost_model: {
      type: "per_token",
      input_cost_per_1k_tokens: 0.00059,
      output_cost_per_1k_tokens: 0.00079,
    },
    latency_p50_ms: 100,
  }),
  makeTool("cerebras", { latency_p50_ms: 50 }),
  makeTool("ollama", {}), // no cost_model
  makeTool("pgvector", { cost_model: { type: "free" }, latency_p50_ms: 30 }),
  makeTool("qdrant", { cost_model: { type: "free" }, latency_p50_ms: 50 }),
  makeTool("pinecone", { cost_model: { type: "usage_based" }, latency_p50_ms: 100 }),
  makeTool("langgraph", {
    cost_model: { type: "flat", cost_per_month_base: 29 },
    latency_p50_ms: 150,
  }),
  makeTool("vapi-calls", {
    cost_model: { type: "per_call", cost_per_call: 0.05 },
  }),
  makeTool("skyvern-runs", {
    cost_model: { type: "per_call" }, // no cost_per_call → unprojected
  }),
];

// ── computeToolMonthlyCost ────────────────────────────────────────────────────

describe("computeToolMonthlyCost", () => {
  it("returns 0 for a tool with no cost_model", () => {
    const tool = makeTool("oss-tool", { cost_model: undefined });
    expect(computeToolMonthlyCost(tool, 100_000, 400, 600)).toBe(0);
  });

  it("returns 0 for type: free", () => {
    const tool = makeTool("langchain", { cost_model: { type: "free" } });
    expect(computeToolMonthlyCost(tool, 100_000, 400, 600)).toBe(0);
  });

  it("computes per_token cost correctly — openai-api at 10k users", () => {
    // 10k users × 1 req/day × 30 days = 300k monthly requests
    // 400 input @ $0.0025/1k + 600 output @ $0.01/1k = $0.007/req
    // 300k × $0.007 = $2,100
    const tool = makeTool("openai-api", {
      cost_model: {
        type: "per_token",
        input_cost_per_1k_tokens: 0.0025,
        output_cost_per_1k_tokens: 0.01,
      },
    });
    const monthlyRequests = 10_000 * 1 * 30;
    expect(computeToolMonthlyCost(tool, monthlyRequests, 400, 600)).toBeCloseTo(2100, 1);
  });

  it("computes per_token cost correctly — groq (cheap) at 10k users", () => {
    // 300k × (400/1k × 0.00059 + 600/1k × 0.00079) = $213
    const tool = makeTool("groq", {
      cost_model: {
        type: "per_token",
        input_cost_per_1k_tokens: 0.00059,
        output_cost_per_1k_tokens: 0.00079,
      },
    });
    const monthlyRequests = 10_000 * 1 * 30;
    expect(computeToolMonthlyCost(tool, monthlyRequests, 400, 600)).toBeCloseTo(213, 1);
  });

  it("RAG token mix inflates input cost (3000 in / 400 out)", () => {
    // openai-api: 3000/1k × 0.0025 + 400/1k × 0.01 = 0.0075 + 0.004 = 0.0115/req
    // 300k × 0.0115 = $3,450
    const tool = makeTool("openai-api", {
      cost_model: {
        type: "per_token",
        input_cost_per_1k_tokens: 0.0025,
        output_cost_per_1k_tokens: 0.01,
      },
    });
    const monthlyRequests = 10_000 * 1 * 30;
    expect(computeToolMonthlyCost(tool, monthlyRequests, 3000, 400)).toBeCloseTo(3450, 1);
  });

  it("returns flat cost regardless of request volume", () => {
    const tool = makeTool("langgraph", { cost_model: { type: "flat", cost_per_month_base: 29 } });
    expect(computeToolMonthlyCost(tool, 1_000, 400, 600)).toBe(29);
    expect(computeToolMonthlyCost(tool, 1_000_000, 400, 600)).toBe(29);
  });

  it("returns 0 for usage_based (cannot project)", () => {
    const tool = makeTool("pinecone", { cost_model: { type: "usage_based" } });
    expect(computeToolMonthlyCost(tool, 100_000, 400, 600)).toBe(0);
  });

  it("computes per_call with a published rate", () => {
    const tool = makeTool("vapi", { cost_model: { type: "per_call", cost_per_call: 0.05 } });
    expect(computeToolMonthlyCost(tool, 10_000, 400, 600)).toBeCloseTo(500, 1);
  });

  it("returns 0 for per_call without a published rate", () => {
    const tool = makeTool("skyvern", { cost_model: { type: "per_call" } });
    expect(computeToolMonthlyCost(tool, 10_000, 400, 600)).toBe(0);
  });
});

// ── computeLatency ────────────────────────────────────────────────────────────

describe("computeLatency", () => {
  it("returns LLM-only latency when no vector DB or framework", () => {
    const { totalMs, breakdown } = computeLatency({ llm: "openai-api" }, fixtureTools);
    // openai-api fixture has no latency_p50_ms → falls back to DEFAULT_LLM_LATENCY_MS
    expect(totalMs).toBe(800);
    expect(breakdown).toEqual({ llm: 800 });
  });

  it("adds vector retrieval latency when vectorDb is set", () => {
    const { totalMs, breakdown } = computeLatency(
      { llm: "openai-api", vectorDb: "pgvector" },
      fixtureTools
    );
    expect(breakdown["vector"]).toBe(30);
    expect(totalMs).toBe(830);
  });

  it("adds framework overhead when framework is set", () => {
    const { totalMs, breakdown } = computeLatency(
      { llm: "openai-api", vectorDb: "qdrant", framework: "langgraph" },
      fixtureTools
    );
    expect(breakdown["llm"]).toBe(800);
    expect(breakdown["vector"]).toBe(50);
    expect(breakdown["framework"]).toBe(150);
    expect(totalMs).toBe(1000);
  });

  it("falls back to 800ms for unknown LLM tool", () => {
    const { totalMs } = computeLatency({ llm: "unknown-llm" }, fixtureTools);
    expect(totalMs).toBe(800);
  });

  it("groq returns fast latency (100ms)", () => {
    const { totalMs } = computeLatency({ llm: "groq" }, fixtureTools);
    expect(totalMs).toBe(100);
  });

  it("cerebras returns fastest latency (50ms)", () => {
    const { totalMs } = computeLatency({ llm: "cerebras" }, fixtureTools);
    expect(totalMs).toBe(50);
  });
});

// ── simulate — snapshots ──────────────────────────────────────────────────────

describe("simulate — snapshots", () => {
  it("produces one snapshot per scale step", () => {
    const result = simulate(
      {
        useCase: "chatbot",
        monthlyUsers: 1000,
        requestsPerUserPerDay: 1,
        avgInputTokens: 200,
        avgOutputTokens: 300,
        stack: { llm: "openai-api" },
      },
      fixtureTools
    );
    expect(result.snapshots).toHaveLength(SCALE_STEPS.length);
    expect(result.snapshots.map((s) => s.users)).toEqual(SCALE_STEPS);
  });

  it("cost scales linearly with users for per_token LLM", () => {
    const result = simulate(
      {
        useCase: "chatbot",
        monthlyUsers: 1000,
        requestsPerUserPerDay: 1,
        avgInputTokens: 400,
        avgOutputTokens: 600,
        stack: { llm: "openai-api" },
      },
      fixtureTools
    );
    const at1k = result.snapshots.find((s) => s.users === 1_000)!;
    const at5k = result.snapshots.find((s) => s.users === 5_000)!;
    expect(at1k.monthlyCostUSD).toBeCloseTo(210, 1);
    expect(at5k.monthlyCostUSD).toBeCloseTo(1050, 1);
    expect(at5k.monthlyCostUSD / at1k.monthlyCostUSD).toBeCloseTo(5, 2);
  });

  it("flat tools contribute the same cost at every scale", () => {
    const result = simulate(
      {
        useCase: "chatbot",
        monthlyUsers: 1000,
        requestsPerUserPerDay: 1,
        avgInputTokens: 400,
        avgOutputTokens: 600,
        stack: { llm: "openai-api", framework: "langgraph" },
      },
      fixtureTools
    );
    for (const snap of result.snapshots) {
      expect(snap.costBreakdown["langgraph"]).toBe(29);
    }
  });

  it("latency is constant across all snapshots", () => {
    const result = simulate(
      {
        useCase: "chatbot",
        monthlyUsers: 1000,
        requestsPerUserPerDay: 1,
        avgInputTokens: 400,
        avgOutputTokens: 600,
        stack: { llm: "openai-api", vectorDb: "pgvector" },
      },
      fixtureTools
    );
    const latencies = result.snapshots.map((s) => s.avgLatencyMs);
    expect(new Set(latencies).size).toBe(1);
    expect(latencies[0]).toBe(830);
  });
});

// ── simulate — breaking points ────────────────────────────────────────────────

describe("simulate — breaking points", () => {
  it("fires cost milestone at $1k when crossed", () => {
    // openai-api, 400/600 tokens, 1 req/user/day:
    // 5k users → 150k req × $0.007 = $1,050 → crosses $1k
    const result = simulate(
      {
        useCase: "chatbot",
        monthlyUsers: 1000,
        requestsPerUserPerDay: 1,
        avgInputTokens: 400,
        avgOutputTokens: 600,
        stack: { llm: "openai-api" },
      },
      fixtureTools
    );
    const milestone1k = result.breakingPoints.find(
      (b) => b.type === "cost" && b.message.includes("$1,000")
    );
    expect(milestone1k).toBeDefined();
    expect(milestone1k!.users).toBe(5_000);
  });

  it("fires cost milestone at $5k when crossed", () => {
    // 25k users → $5,250 → crosses $5k milestone
    const result = simulate(
      {
        useCase: "chatbot",
        monthlyUsers: 1000,
        requestsPerUserPerDay: 1,
        avgInputTokens: 400,
        avgOutputTokens: 600,
        stack: { llm: "openai-api" },
      },
      fixtureTools
    );
    const milestone5k = result.breakingPoints.find(
      (b) => b.type === "cost" && b.message.includes("$5,000")
    );
    expect(milestone5k).toBeDefined();
    expect(milestone5k!.users).toBe(25_000);
  });

  it("does not fire cost milestones for zero-cost stacks", () => {
    const result = simulate(
      {
        useCase: "chatbot",
        monthlyUsers: 1000,
        requestsPerUserPerDay: 1,
        avgInputTokens: 400,
        avgOutputTokens: 600,
        stack: { llm: "ollama" },
      },
      fixtureTools
    );
    const costPoints = result.breakingPoints.filter((b) => b.type === "cost");
    expect(costPoints).toHaveLength(0);
  });

  it("fires LLM dominance when LLM > 80% of total and other costs exist", () => {
    // 1k users: openai $210 + langgraph $29 = $239. LLM share = 210/239 = 87.9% > 80%, total > $100 ✓
    const result = simulate(
      {
        useCase: "chatbot",
        monthlyUsers: 1000,
        requestsPerUserPerDay: 1,
        avgInputTokens: 400,
        avgOutputTokens: 600,
        stack: { llm: "openai-api", framework: "langgraph" },
      },
      fixtureTools
    );
    const dominance = result.breakingPoints.find((b) => b.type === "architecture");
    expect(dominance).toBeDefined();
    expect(dominance!.message).toContain("LLM cost dominates");
  });

  it("does not fire LLM dominance when there are no other cost layers", () => {
    const result = simulate(
      {
        useCase: "chatbot",
        monthlyUsers: 1000,
        requestsPerUserPerDay: 1,
        avgInputTokens: 400,
        avgOutputTokens: 600,
        stack: { llm: "openai-api" },
      },
      fixtureTools
    );
    const dominance = result.breakingPoints.filter((b) => b.type === "architecture");
    expect(dominance).toHaveLength(0);
  });
});

// ── simulate — kill conditions ────────────────────────────────────────────────

describe("simulate — kill conditions", () => {
  it("fires missing_vector_db for RAG use case without vectorDb", () => {
    const result = simulate(
      {
        useCase: "rag",
        monthlyUsers: 1000,
        requestsPerUserPerDay: 1,
        avgInputTokens: 3000,
        avgOutputTokens: 400,
        stack: { llm: "openai-api" },
      },
      fixtureTools
    );
    const kc = result.killConditions.find((k) => k.type === "missing_vector_db");
    expect(kc).toBeDefined();
    expect(kc!.recommendation).toContain("vector database");
  });

  it("does not fire missing_vector_db when vectorDb is provided", () => {
    const result = simulate(
      {
        useCase: "rag",
        monthlyUsers: 1000,
        requestsPerUserPerDay: 1,
        avgInputTokens: 3000,
        avgOutputTokens: 400,
        stack: { llm: "openai-api", vectorDb: "qdrant" },
      },
      fixtureTools
    );
    expect(result.killConditions.find((k) => k.type === "missing_vector_db")).toBeUndefined();
  });

  it("does not fire missing_vector_db for chatbot use case", () => {
    const result = simulate(
      {
        useCase: "chatbot",
        monthlyUsers: 1000,
        requestsPerUserPerDay: 1,
        avgInputTokens: 400,
        avgOutputTokens: 600,
        stack: { llm: "openai-api" },
      },
      fixtureTools
    );
    expect(result.killConditions.find((k) => k.type === "missing_vector_db")).toBeUndefined();
  });

  it("always fires no_eval_layer", () => {
    const result = simulate(
      {
        useCase: "chatbot",
        monthlyUsers: 1000,
        requestsPerUserPerDay: 1,
        avgInputTokens: 400,
        avgOutputTokens: 600,
        stack: { llm: "openai-api" },
      },
      fixtureTools
    );
    expect(result.killConditions.find((k) => k.type === "no_eval_layer")).toBeDefined();
  });

  it("fires unprojected_cost when a usage_based tool is in the stack", () => {
    const result = simulate(
      {
        useCase: "rag",
        monthlyUsers: 1000,
        requestsPerUserPerDay: 1,
        avgInputTokens: 3000,
        avgOutputTokens: 400,
        stack: { llm: "openai-api", vectorDb: "pinecone" },
      },
      fixtureTools
    );
    const kc = result.killConditions.find((k) => k.type === "unprojected_cost");
    expect(kc).toBeDefined();
    expect(kc!.message).toContain("pinecone");
  });
});
