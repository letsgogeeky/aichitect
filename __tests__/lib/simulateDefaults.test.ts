import { describe, it, expect } from "vitest";
import { SCALE_DEFAULTS, STACK_DEFAULTS, SCALE_BOUNDS } from "@/lib/simulateDefaults";
import { TOKEN_DEFAULTS } from "@/lib/simulate";

describe("default tables", () => {
  it("SCALE_DEFAULTS values lie within SCALE_BOUNDS", () => {
    for (const [, d] of Object.entries(SCALE_DEFAULTS)) {
      expect(d.monthlyUsers).toBeGreaterThanOrEqual(SCALE_BOUNDS.monthlyUsers.min);
      expect(d.monthlyUsers).toBeLessThanOrEqual(SCALE_BOUNDS.monthlyUsers.max);
      expect(d.requestsPerUserPerDay).toBeGreaterThanOrEqual(
        SCALE_BOUNDS.requestsPerUserPerDay.min
      );
      expect(d.requestsPerUserPerDay).toBeLessThanOrEqual(SCALE_BOUNDS.requestsPerUserPerDay.max);
      expect(d.avgInputTokens).toBeGreaterThanOrEqual(SCALE_BOUNDS.inputTokens.min);
      expect(d.avgInputTokens).toBeLessThanOrEqual(SCALE_BOUNDS.inputTokens.max);
      expect(d.avgOutputTokens).toBeGreaterThanOrEqual(SCALE_BOUNDS.outputTokens.min);
      expect(d.avgOutputTokens).toBeLessThanOrEqual(SCALE_BOUNDS.outputTokens.max);
    }
  });

  it("SCALE_DEFAULTS token values mirror TOKEN_DEFAULTS for each use case", () => {
    for (const uc of ["chatbot", "rag", "agent", "custom"] as const) {
      expect(SCALE_DEFAULTS[uc].avgInputTokens).toBe(TOKEN_DEFAULTS[uc].inputTokens);
      expect(SCALE_DEFAULTS[uc].avgOutputTokens).toBe(TOKEN_DEFAULTS[uc].outputTokens);
    }
  });

  it("STACK_DEFAULTS has a non-empty LLM for every use case", () => {
    for (const [, stack] of Object.entries(STACK_DEFAULTS)) {
      expect(stack.llm).toBeTruthy();
    }
  });
});
