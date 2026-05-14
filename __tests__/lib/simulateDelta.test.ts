import { describe, it, expect } from "vitest";
import { computeDelta } from "@/lib/simulateDelta";
import { simulate, SCALE_STEPS } from "@/lib/simulate";
import type { Tool } from "@/lib/types";

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

const fixtureTools: Tool[] = [
  // Expensive flagship LLM, slow.
  makeTool("expensive-llm", {
    cost_model: {
      type: "per_token",
      input_cost_per_1k_tokens: 0.005,
      output_cost_per_1k_tokens: 0.02,
    },
    latency_p50_ms: 900,
  }),
  // Cheap fast LLM.
  makeTool("cheap-llm", {
    cost_model: {
      type: "per_token",
      input_cost_per_1k_tokens: 0.0005,
      output_cost_per_1k_tokens: 0.002,
    },
    latency_p50_ms: 350,
  }),
  // Costlier but very fast LLM.
  makeTool("fast-expensive-llm", {
    cost_model: {
      type: "per_token",
      input_cost_per_1k_tokens: 0.01,
      output_cost_per_1k_tokens: 0.04,
    },
    latency_p50_ms: 50,
  }),
];

function run(llmId: string) {
  return simulate(
    {
      useCase: "chatbot",
      monthlyUsers: 1_000,
      requestsPerUserPerDay: 1,
      avgInputTokens: 400,
      avgOutputTokens: 600,
      stack: { llm: llmId },
    },
    fixtureTools
  );
}

describe("computeDelta", () => {
  it("aligns snapshots by SCALE_STEPS", () => {
    const delta = computeDelta(run("expensive-llm"), run("cheap-llm"));
    expect(delta.snapshots).toHaveLength(SCALE_STEPS.length);
    expect(delta.snapshots.map((s) => s.users)).toEqual(SCALE_STEPS);
  });

  it("flags 'switch_now' when shadow is cheaper at every scale and faster", () => {
    const delta = computeDelta(run("expensive-llm"), run("cheap-llm"));
    expect(delta.verdict).toBe("switch_now");
    expect(delta.crossoverUsers).toBe(SCALE_STEPS[0]); // cheaper from the first step
    expect(delta.maxScaleAnnualSavings).toBeGreaterThan(0);
    expect(delta.totalLatency.delta).toBeLessThan(0); // shadow is faster
  });

  it("flags 'stick' when shadow is more expensive and not meaningfully faster", () => {
    // expensive-llm vs slightly more expensive same-speed variant
    const expensive2 = makeTool("expensive-llm-2", {
      cost_model: {
        type: "per_token",
        input_cost_per_1k_tokens: 0.006,
        output_cost_per_1k_tokens: 0.024,
      },
      latency_p50_ms: 900, // matches expensive-llm
    });
    const tools2 = [...fixtureTools, expensive2];
    const current = simulate(
      {
        useCase: "chatbot",
        monthlyUsers: 1_000,
        requestsPerUserPerDay: 1,
        avgInputTokens: 400,
        avgOutputTokens: 600,
        stack: { llm: "expensive-llm" },
      },
      tools2
    );
    const shadow = simulate(
      {
        useCase: "chatbot",
        monthlyUsers: 1_000,
        requestsPerUserPerDay: 1,
        avgInputTokens: 400,
        avgOutputTokens: 600,
        stack: { llm: "expensive-llm-2" },
      },
      tools2
    );
    const delta = computeDelta(current, shadow);
    expect(delta.verdict).toBe("stick");
    expect(delta.crossoverUsers).toBeNull();
    expect(delta.maxScaleAnnualSavings).toBeLessThan(0);
  });

  it("flags 'latency_only' when shadow is pricier but ≥200ms faster", () => {
    const delta = computeDelta(run("cheap-llm"), run("fast-expensive-llm"));
    expect(delta.verdict).toBe("latency_only");
    expect(delta.totalLatency.delta).toBeLessThanOrEqual(-200);
  });

  it("captures per-layer latency rows including unique-to-one-side layers", () => {
    const current = simulate(
      {
        useCase: "rag",
        monthlyUsers: 1_000,
        requestsPerUserPerDay: 1,
        avgInputTokens: 3000,
        avgOutputTokens: 400,
        stack: { llm: "expensive-llm" }, // no vector layer
      },
      fixtureTools
    );
    const shadow = simulate(
      {
        useCase: "rag",
        monthlyUsers: 1_000,
        requestsPerUserPerDay: 1,
        avgInputTokens: 3000,
        avgOutputTokens: 400,
        stack: { llm: "expensive-llm", vectorDb: "vec" }, // adds vector layer
      },
      [...fixtureTools, makeTool("vec", { latency_p50_ms: 40, cost_model: { type: "free" } })]
    );
    const delta = computeDelta(current, shadow);
    const vectorRow = delta.latencyByLayer.find((r) => r.layer === "vector");
    expect(vectorRow).toBeDefined();
    expect(vectorRow!.current).toBe(0);
    expect(vectorRow!.shadow).toBe(40);
    expect(vectorRow!.delta).toBe(40);
  });

  it("verdictMessage mentions savings figure for switch_now", () => {
    const delta = computeDelta(run("expensive-llm"), run("cheap-llm"));
    expect(delta.verdictMessage.toLowerCase()).toContain("switch");
    expect(delta.verdictMessage).toMatch(/\$\d/);
  });
});
