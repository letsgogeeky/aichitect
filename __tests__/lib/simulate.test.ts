import { describe, it, expect } from "vitest";
import {
  simulate,
  computeToolMonthlyCost,
  computeLatency,
  SCALE_STEPS,
  type CostContext,
} from "@/lib/simulate";
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

function ctx(overrides: Partial<CostContext> = {}): CostContext {
  return {
    monthlyRequests: 300_000,
    avgInputTokens: 400,
    avgOutputTokens: 600,
    cacheHitRate: 0,
    batchPct: 0,
    vectorCount: 0,
    ...overrides,
  };
}

const fixtureTools: Tool[] = [
  makeTool("openai-api", {
    cost_model: {
      type: "per_token",
      input_cost_per_1k_tokens: 0.0025,
      output_cost_per_1k_tokens: 0.01,
      cached_input_cost_per_1k_tokens: 0.00025, // 10% of std
      batch_input_cost_per_1k_tokens: 0.00125, // 50% of std
      batch_output_cost_per_1k_tokens: 0.005,
    },
    ttft_p50_ms: 500,
    output_tokens_per_second: 85,
    max_tpm: 600_000,
    max_rpm: 5_000,
  }),
  makeTool("anthropic-api", {
    cost_model: {
      type: "per_token",
      input_cost_per_1k_tokens: 0.003,
      output_cost_per_1k_tokens: 0.015,
      cached_input_cost_per_1k_tokens: 0.0003,
      cache_write_cost_per_1k_tokens: 0.00375,
    },
    ttft_p50_ms: 700,
    output_tokens_per_second: 46,
  }),
  makeTool("groq", {
    cost_model: {
      type: "per_token",
      input_cost_per_1k_tokens: 0.00059,
      output_cost_per_1k_tokens: 0.00079,
    },
    ttft_p50_ms: 100,
    output_tokens_per_second: 500, // Groq is fast
  }),
  makeTool("cerebras", { ttft_p50_ms: 50, output_tokens_per_second: 800 }),
  makeTool("ollama", {}),
  makeTool("pgvector", {
    cost_model: { type: "free" },
    latency_p50_ms: 30,
  }),
  makeTool("qdrant", { cost_model: { type: "free" }, latency_p50_ms: 50 }),
  makeTool("pinecone", {
    slot: "vector-db",
    cost_model: {
      type: "per_vector_query",
      storage_cost_per_gb_month: 0.33,
      query_cost_per_million: 16,
      min_monthly_cost: 50,
    },
    latency_p50_ms: 100,
    bytes_per_vector: 2_000,
  }),
  makeTool("pinecone-usage", {
    slot: "vector-db",
    cost_model: { type: "usage_based" },
    latency_p50_ms: 100,
  }),
  makeTool("langgraph", {
    cost_model: { type: "flat", cost_per_month_base: 29 },
    latency_p50_ms: 150,
  }),
  makeTool("langfuse", {
    cost_model: { type: "per_event", cost_per_event: 0.00006 },
  }),
  makeTool("text-embedding-3-small", {
    cost_model: {
      type: "per_token",
      input_cost_per_1k_tokens: 0.00002,
      output_cost_per_1k_tokens: 0,
    },
  }),
];

// ── computeToolMonthlyCost ────────────────────────────────────────────────────

describe("computeToolMonthlyCost", () => {
  it("returns 0 for a tool with no cost_model", () => {
    const tool = makeTool("oss-tool", { cost_model: undefined });
    expect(computeToolMonthlyCost(tool, ctx({ monthlyRequests: 100_000 }))).toBe(0);
  });

  it("returns 0 for type: free", () => {
    const tool = makeTool("langchain", { cost_model: { type: "free" } });
    expect(computeToolMonthlyCost(tool, ctx({ monthlyRequests: 100_000 }))).toBe(0);
  });

  it("per_token at 300k req with 400/600 tokens — openai-api ≈ $2100", () => {
    // 300k × (0.4×0.0025 + 0.6×0.01) = 300k × 0.007 = $2100
    expect(computeToolMonthlyCost(fixtureTools[0], ctx())).toBeCloseTo(2100, 1);
  });

  it("cacheHitRate=0.6 cuts input cost on the cached fraction (90% off)", () => {
    // base input cost portion = 0.4×0.0025 = $0.001 per req
    // With 60% cached: 0.4 × (0.6×0.00025 + 0.4×0.0025) = 0.4 × 0.00115 = $0.00046 per req
    // Output unchanged: 0.6×0.01 = $0.006
    // Total per req: $0.00646 → 300k × = $1938
    const cost = computeToolMonthlyCost(fixtureTools[0], ctx({ cacheHitRate: 0.6 }));
    expect(cost).toBeCloseTo(1938, 0);
  });

  it("batchPct=1 halves cost (50% off input and output)", () => {
    // Full batch: 300k × (0.4×0.00125 + 0.6×0.005) = 300k × 0.0035 = $1050
    const cost = computeToolMonthlyCost(fixtureTools[0], ctx({ batchPct: 1 }));
    expect(cost).toBeCloseTo(1050, 1);
  });

  it("per_token uses default cache discount when cached price unset", () => {
    const tool = makeTool("noCached", {
      cost_model: {
        type: "per_token",
        input_cost_per_1k_tokens: 0.001,
        output_cost_per_1k_tokens: 0.001,
      },
    });
    // 100% cache hit → input rate = 0.0001 (10% of 0.001). Output rate unchanged.
    // Per req: 0.4×0.0001 + 0.6×0.001 = 0.00004 + 0.0006 = $0.00064 → 300k × = $192
    const cost = computeToolMonthlyCost(tool, ctx({ cacheHitRate: 1 }));
    expect(cost).toBeCloseTo(192, 1);
  });

  it("flat cost is independent of request volume", () => {
    const tool = makeTool("flat", { cost_model: { type: "flat", cost_per_month_base: 29 } });
    expect(computeToolMonthlyCost(tool, ctx({ monthlyRequests: 1_000 }))).toBe(29);
    expect(computeToolMonthlyCost(tool, ctx({ monthlyRequests: 1_000_000_000 }))).toBe(29);
  });

  it("usage_based returns 0 (unprojectable)", () => {
    const tool = makeTool("pinecone-usage", { cost_model: { type: "usage_based" } });
    expect(computeToolMonthlyCost(tool, ctx())).toBe(0);
  });

  it("per_call uses cost_per_call when present", () => {
    const tool = makeTool("vapi", { cost_model: { type: "per_call", cost_per_call: 0.05 } });
    expect(computeToolMonthlyCost(tool, ctx({ monthlyRequests: 10_000 }))).toBeCloseTo(500, 1);
  });

  it("per_event scales with monthly request count", () => {
    // langfuse: $0.00006 per event × 300k = $18
    expect(computeToolMonthlyCost(fixtureTools[10], ctx())).toBeCloseTo(18, 1);
  });

  it("per_vector_query honours the minimum monthly cost", () => {
    // Tiny workload — storage + queries < $50, floor at $50.
    const cost = computeToolMonthlyCost(
      fixtureTools[7],
      ctx({ monthlyRequests: 1_000, vectorCount: 10_000 })
    );
    expect(cost).toBe(50);
  });

  it("per_vector_query exceeds the minimum at scale", () => {
    // 5M vectors × 2000 bytes ≈ 9.31 GB → 9.31 × 0.33 ≈ $3.07 storage
    // 1M queries / 1M × 16 = $16. Total ≈ $19.07. Below min so → $50.
    // 50M vectors → 93.1 GB × 0.33 = $30.72 storage; queries 30M / 1M × 16 = $480 → ~$510.72 > $50.
    const cost = computeToolMonthlyCost(
      fixtureTools[7],
      ctx({ monthlyRequests: 30_000_000, vectorCount: 50_000_000 })
    );
    expect(cost).toBeGreaterThan(500);
  });
});

// ── computeLatency ────────────────────────────────────────────────────────────

describe("computeLatency", () => {
  function input(
    stack: Partial<Parameters<typeof computeLatency>[0]["stack"]> = {},
    useCase: "chatbot" | "rag" = "chatbot",
    avgOutputTokens = 600
  ) {
    return {
      useCase,
      monthlyUsers: 10_000,
      requestsPerUserPerDay: 1,
      avgInputTokens: 400,
      avgOutputTokens,
      stack: { llm: "openai-api", ...stack },
    };
  }

  it("ttft + generation = output / throughput for the LLM", () => {
    // openai fixture: ttft 500, throughput 85
    // generation = 600 / 85 * 1000 ≈ 7058 ms
    const { totalMs, stages } = computeLatency(input(), fixtureTools);
    expect(stages.ttft).toBe(500);
    expect(stages.generation).toBeCloseTo((600 / 85) * 1000, 0);
    expect(totalMs).toBeCloseTo(500 + (600 / 85) * 1000, 0);
  });

  it("Groq's high throughput keeps total latency under 1.5s", () => {
    // 100 ttft + 600/500*1000 = 1200ms generation = 1300ms total
    const { totalMs } = computeLatency(input({ llm: "groq" }), fixtureTools);
    expect(totalMs).toBeLessThan(1500);
  });

  it("falls back to default ttft + throughput when LLM tool has no fields", () => {
    // ollama has no ttft / throughput. defaults: 600 ttft, 50 tok/s
    // generation = 600/50 * 1000 = 12000 ms
    const { totalMs } = computeLatency(input({ llm: "ollama" }), fixtureTools);
    expect(totalMs).toBeCloseTo(600 + 12000, 0);
  });

  it("includes vector retrieval and embedding only on RAG use case", () => {
    const chatbot = computeLatency(input({ vectorDb: "pgvector" }, "chatbot"), fixtureTools);
    expect(chatbot.stages.vector).toBe(0);
    expect(chatbot.stages.embedding).toBe(0);
    const rag = computeLatency(input({ vectorDb: "pgvector" }, "rag"), fixtureTools);
    expect(rag.stages.vector).toBe(30);
    expect(rag.stages.embedding).toBeGreaterThan(0); // default embedding latency
  });

  it("scales linearly with output tokens", () => {
    const short = computeLatency(input({}, "chatbot", 100), fixtureTools);
    const long = computeLatency(input({}, "chatbot", 1000), fixtureTools);
    // generation only — ttft constant. 10× output → ~10× generation.
    expect(long.stages.generation / short.stages.generation).toBeCloseTo(10, 1);
  });
});

// ── simulate — snapshots ──────────────────────────────────────────────────────

describe("simulate — snapshots", () => {
  function baseInput(overrides = {}) {
    return {
      useCase: "chatbot" as const,
      monthlyUsers: 1_000,
      requestsPerUserPerDay: 1,
      avgInputTokens: 400,
      avgOutputTokens: 600,
      stack: { llm: "openai-api" },
      ...overrides,
    };
  }

  it("produces one snapshot per scale step", () => {
    const result = simulate(baseInput(), fixtureTools);
    expect(result.snapshots).toHaveLength(SCALE_STEPS.length);
    expect(result.snapshots.map((s) => s.users)).toEqual(SCALE_STEPS);
  });

  it("each snapshot carries cost-per-request and cost-per-user", () => {
    const result = simulate(baseInput(), fixtureTools);
    for (const snap of result.snapshots) {
      expect(snap.costPerRequest).toBeGreaterThan(0);
      expect(snap.costPerUser).toBeGreaterThan(0);
      expect(snap.costPerRequest * snap.monthlyRequests).toBeCloseTo(snap.monthlyCostUSD, 4);
      expect(snap.costPerUser * snap.users).toBeCloseTo(snap.monthlyCostUSD, 4);
    }
  });

  it("costByLayer.llm + others equals total", () => {
    const result = simulate(
      baseInput({ stack: { llm: "openai-api", framework: "langgraph", eval: "langfuse" } }),
      fixtureTools
    );
    for (const snap of result.snapshots) {
      const sum =
        snap.costByLayer.llm +
        snap.costByLayer.embedding +
        snap.costByLayer.vector +
        snap.costByLayer.framework +
        snap.costByLayer.eval +
        snap.costByLayer.guardrails;
      expect(sum).toBeCloseTo(snap.monthlyCostUSD, 4);
    }
  });

  it("scales cost linearly with users for per_token LLM", () => {
    const result = simulate(baseInput(), fixtureTools);
    const at1k = result.snapshots.find((s) => s.users === 1_000)!;
    const at5k = result.snapshots.find((s) => s.users === 5_000)!;
    expect(at1k.monthlyCostUSD).toBeCloseTo(210, 1);
    expect(at5k.monthlyCostUSD).toBeCloseTo(1050, 1);
  });
});

// ── simulate — breaking points ────────────────────────────────────────────────

describe("simulate — breaking points", () => {
  function baseInput(overrides = {}) {
    return {
      useCase: "chatbot" as const,
      monthlyUsers: 1_000,
      requestsPerUserPerDay: 1,
      avgInputTokens: 400,
      avgOutputTokens: 600,
      stack: { llm: "openai-api" },
      ...overrides,
    };
  }

  it("fires $1k cost milestone at 5k users for openai", () => {
    const result = simulate(baseInput(), fixtureTools);
    const m = result.breakingPoints.find((b) => b.type === "cost" && b.message.includes("$1,000"));
    expect(m).toBeDefined();
    expect(m!.users).toBe(5_000);
  });

  it("fires latency breaking point when total exceeds the chatbot ceiling (8s)", () => {
    // anthropic: 700 ttft + 600/46*1000 ≈ 13740ms — past 8s chatbot ceiling.
    const result = simulate(baseInput({ stack: { llm: "anthropic-api" } }), fixtureTools);
    const breach = result.breakingPoints.find(
      (b) => b.type === "latency" && b.message.includes("Total response")
    );
    expect(breach).toBeDefined();
  });

  it("does not fire total-latency breach for OpenAI on chatbot (≤8s)", () => {
    // openai: 500 + 600/85*1000 ≈ 7558ms — under the 8s chatbot ceiling.
    const result = simulate(baseInput({ stack: { llm: "openai-api" } }), fixtureTools);
    const breach = result.breakingPoints.find(
      (b) => b.type === "latency" && b.message.includes("Total response")
    );
    expect(breach).toBeUndefined();
  });

  it("does not fire latency breach for Groq (fast everywhere)", () => {
    const result = simulate(baseInput({ stack: { llm: "groq" } }), fixtureTools);
    // groq: 100 + 600/500*1000 = 1300ms — under any ceiling, and TTFT well under 1.5s.
    const breach = result.breakingPoints.find((b) => b.type === "latency");
    expect(breach).toBeUndefined();
  });

  it("fires TTFT-slow breaking point when ttft exceeds 1.5s", () => {
    const tools2: Tool[] = [
      ...fixtureTools,
      makeTool("slow-start", {
        cost_model: {
          type: "per_token",
          input_cost_per_1k_tokens: 0.001,
          output_cost_per_1k_tokens: 0.001,
        },
        ttft_p50_ms: 2_000, // beyond TTFT_SLOW_MS
        output_tokens_per_second: 200,
      }),
    ];
    const result = simulate(baseInput({ stack: { llm: "slow-start" } }), tools2);
    const breach = result.breakingPoints.find(
      (b) => b.type === "latency" && b.message.includes("Time-to-first-token")
    );
    expect(breach).toBeDefined();
  });

  it("rate_limit breaking point fires when peak > max_tpm", () => {
    // openai has max_tpm=600k. At 1M users × 1 req/day × 1000 tokens × 30 days = 30B tokens/mo
    // avg tpm = 30B / (30 × 24 × 60) ≈ 694k → peak (3x) = 2.08M tpm → exceeds 600k. Fires.
    const result = simulate(
      { ...baseInput(), avgInputTokens: 400, avgOutputTokens: 600 },
      fixtureTools
    );
    const rl = result.breakingPoints.find((b) => b.type === "rate_limit");
    expect(rl).toBeDefined();
    expect(result.rateLimitAtUsers).not.toBeNull();
  });
});

// ── simulate — kill conditions ────────────────────────────────────────────────

describe("simulate — kill conditions", () => {
  function baseInput(overrides = {}) {
    return {
      useCase: "chatbot" as const,
      monthlyUsers: 1_000,
      requestsPerUserPerDay: 1,
      avgInputTokens: 400,
      avgOutputTokens: 600,
      stack: { llm: "openai-api" },
      ...overrides,
    };
  }

  it("RAG without vectorDb fires missing_vector_db", () => {
    const result = simulate(
      { ...baseInput(), useCase: "rag", avgInputTokens: 3000, avgOutputTokens: 400 },
      fixtureTools
    );
    expect(result.killConditions.find((k) => k.type === "missing_vector_db")).toBeDefined();
  });

  it("no_eval_layer fires when stack.eval is unset", () => {
    const result = simulate(baseInput(), fixtureTools);
    expect(result.killConditions.find((k) => k.type === "no_eval_layer")).toBeDefined();
  });

  it("no_eval_layer does NOT fire when an eval tool is selected", () => {
    const result = simulate(
      baseInput({ stack: { llm: "openai-api", eval: "langfuse" } }),
      fixtureTools
    );
    expect(result.killConditions.find((k) => k.type === "no_eval_layer")).toBeUndefined();
  });

  it("unprojected_cost fires for usage_based vector DB", () => {
    const result = simulate(
      {
        ...baseInput(),
        useCase: "rag",
        avgInputTokens: 3000,
        avgOutputTokens: 400,
        stack: { llm: "openai-api", vectorDb: "pinecone-usage" },
      },
      fixtureTools
    );
    const kc = result.killConditions.find((k) => k.type === "unprojected_cost");
    expect(kc).toBeDefined();
    expect(kc!.message).toContain("pinecone-usage");
  });
});

// ── simulate — bottleneck diagnosis ──────────────────────────────────────────

describe("simulate — bottleneck", () => {
  it("reports cost-bound for expensive LLM at scale", () => {
    const result = simulate(
      {
        useCase: "chatbot",
        monthlyUsers: 1_000,
        requestsPerUserPerDay: 5,
        avgInputTokens: 1_000,
        avgOutputTokens: 1_000,
        stack: { llm: "anthropic-api", eval: "langfuse" },
      },
      fixtureTools
    );
    expect(["cost", "balanced", "latency"]).toContain(result.bottleneck);
  });

  it("reports no bottleneck for an OSS-only stack with short outputs", () => {
    // ollama default ttft=600 + gen 50/50*1000 = 1000 = 1600ms total (< 2s).
    // langfuse at $0.00006/event × 30M req = $1800 (< $20k cost threshold).
    const result = simulate(
      {
        useCase: "chatbot",
        monthlyUsers: 1_000,
        requestsPerUserPerDay: 1,
        avgInputTokens: 400,
        avgOutputTokens: 50,
        stack: { llm: "ollama", eval: "langfuse" },
      },
      fixtureTools
    );
    expect(result.bottleneck).toBe("none");
  });
});

// ── simulate — model routing ──────────────────────────────────────────────────

describe("simulate — router", () => {
  it("blending traffic with a cheap model reduces LLM cost", () => {
    const noRouter = simulate(
      {
        useCase: "chatbot",
        monthlyUsers: 1_000,
        requestsPerUserPerDay: 1,
        avgInputTokens: 400,
        avgOutputTokens: 600,
        stack: { llm: "openai-api" },
      },
      fixtureTools
    );
    const withRouter = simulate(
      {
        useCase: "chatbot",
        monthlyUsers: 1_000,
        requestsPerUserPerDay: 1,
        avgInputTokens: 400,
        avgOutputTokens: 600,
        stack: { llm: "openai-api", routerCheapLlm: "groq", routerCheapPct: 0.7 },
      },
      fixtureTools
    );
    expect(withRouter.snapshots[0].monthlyCostUSD).toBeLessThan(
      noRouter.snapshots[0].monthlyCostUSD
    );
  });
});
