import { describe, it, expect } from "vitest";
import { splitTokens, SCALE_DEFAULTS, STACK_DEFAULTS, SCALE_BOUNDS } from "@/lib/simulateDefaults";
import { TOKEN_DEFAULTS } from "@/lib/simulate";

describe("splitTokens", () => {
  it("splits chatbot 1000 tokens 40/60 (per TOKEN_DEFAULTS.chatbot)", () => {
    const { input, output } = splitTokens(1000, "chatbot");
    expect(input).toBe(400);
    expect(output).toBe(600);
  });

  it("splits rag in the input-heavy direction", () => {
    // TOKEN_DEFAULTS.rag = { in: 3000, out: 400 } → ratio ~88% input
    const { input, output } = splitTokens(3400, "rag");
    expect(input).toBeGreaterThan(output * 5);
    expect(input + output).toBe(3400);
  });

  it("preserves total at +/-1 token across all use cases", () => {
    const cases: Array<keyof typeof TOKEN_DEFAULTS> = ["chatbot", "rag", "agent", "custom"];
    for (const uc of cases) {
      for (const total of [500, 1500, 5000, 25000]) {
        const { input, output } = splitTokens(total, uc);
        expect(Math.abs(input + output - total)).toBeLessThanOrEqual(1);
      }
    }
  });

  it("keeps each side at least 1 for small totals", () => {
    const { input, output } = splitTokens(2, "chatbot");
    expect(input).toBeGreaterThanOrEqual(1);
    expect(output).toBeGreaterThanOrEqual(1);
  });
});

describe("default tables", () => {
  it("SCALE_DEFAULTS values lie within SCALE_BOUNDS", () => {
    for (const [, d] of Object.entries(SCALE_DEFAULTS)) {
      expect(d.monthlyUsers).toBeGreaterThanOrEqual(SCALE_BOUNDS.monthlyUsers.min);
      expect(d.monthlyUsers).toBeLessThanOrEqual(SCALE_BOUNDS.monthlyUsers.max);
      expect(d.requestsPerUserPerDay).toBeGreaterThanOrEqual(
        SCALE_BOUNDS.requestsPerUserPerDay.min
      );
      expect(d.requestsPerUserPerDay).toBeLessThanOrEqual(SCALE_BOUNDS.requestsPerUserPerDay.max);
      expect(d.avgTokens).toBeGreaterThanOrEqual(SCALE_BOUNDS.avgTokens.min);
      expect(d.avgTokens).toBeLessThanOrEqual(SCALE_BOUNDS.avgTokens.max);
    }
  });

  it("STACK_DEFAULTS has a non-empty LLM for every use case", () => {
    for (const [, stack] of Object.entries(STACK_DEFAULTS)) {
      expect(stack.llm).toBeTruthy();
    }
  });
});
