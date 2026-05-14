import { describe, it, expect } from "vitest";
import {
  encodeSimulationInput,
  parseSimulationInput,
  appendShadowStack,
  dropShadowStack,
  parseShadowStack,
} from "@/lib/simulateUrl";
import type { SimulationInput } from "@/lib/simulate";

const baseInput: SimulationInput = {
  useCase: "chatbot",
  monthlyUsers: 10_000,
  requestsPerUserPerDay: 2,
  avgInputTokens: 400,
  avgOutputTokens: 600,
  stack: { llm: "openai-api" },
};

describe("encodeSimulationInput", () => {
  it("emits compact param names for the minimal input", () => {
    const p = encodeSimulationInput(baseInput);
    expect(p.get("uc")).toBe("chatbot");
    expect(p.get("u")).toBe("10000");
    expect(p.get("r")).toBe("2");
    expect(p.get("in")).toBe("400");
    expect(p.get("out")).toBe("600");
    expect(p.get("llm")).toBe("openai-api");
    expect(p.has("vec")).toBe(false);
    expect(p.has("fw")).toBe(false);
  });

  it("includes vec/fw when set", () => {
    const p = encodeSimulationInput({
      ...baseInput,
      stack: { llm: "openai-api", vectorDb: "qdrant", framework: "langgraph" },
    });
    expect(p.get("vec")).toBe("qdrant");
    expect(p.get("fw")).toBe("langgraph");
  });
});

describe("parseSimulationInput", () => {
  it("roundtrips with encodeSimulationInput", () => {
    const full: SimulationInput = {
      ...baseInput,
      stack: { llm: "openai-api", vectorDb: "qdrant", framework: "langgraph" },
    };
    const parsed = parseSimulationInput(encodeSimulationInput(full));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.input).toEqual(full);
  });

  it("accepts a plain record (Next.js searchParams shape)", () => {
    const parsed = parseSimulationInput({
      uc: "rag",
      u: "5000",
      r: "1",
      in: "3000",
      out: "400",
      llm: "anthropic-api",
      vec: "pgvector",
    });
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.input.useCase).toBe("rag");
      expect(parsed.input.stack.vectorDb).toBe("pgvector");
      expect(parsed.input.stack.framework).toBeUndefined();
    }
  });

  it("rejects an invalid useCase", () => {
    const parsed = parseSimulationInput({ ...stringifyParams(baseInput), uc: "magic" });
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.error).toContain("useCase");
  });

  it("rejects a negative monthlyUsers", () => {
    const parsed = parseSimulationInput({ ...stringifyParams(baseInput), u: "-100" });
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.error).toContain("monthlyUsers");
  });

  it("rejects a missing llm", () => {
    const params: Record<string, string> = stringifyParams(baseInput);
    delete (params as Record<string, string | undefined>).llm;
    const parsed = parseSimulationInput(params);
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.error).toContain("stack.llm");
  });
});

function stringifyParams(input: SimulationInput): Record<string, string> {
  const p = encodeSimulationInput(input);
  const out: Record<string, string> = {};
  p.forEach((v, k) => (out[k] = v));
  return out;
}

describe("shadow stack URL helpers", () => {
  it("appendShadowStack adds llm2/vec2/fw2 without touching primary params", () => {
    const p = encodeSimulationInput(baseInput);
    appendShadowStack(p, { llm: "anthropic-api", vectorDb: "qdrant", framework: "langgraph" });
    expect(p.get("llm")).toBe("openai-api");
    expect(p.get("llm2")).toBe("anthropic-api");
    expect(p.get("vec2")).toBe("qdrant");
    expect(p.get("fw2")).toBe("langgraph");
  });

  it("appendShadowStack clears stale vec2/fw2 when the shadow has none", () => {
    const p = encodeSimulationInput(baseInput);
    appendShadowStack(p, { llm: "a", vectorDb: "v", framework: "f" });
    appendShadowStack(p, { llm: "b" });
    expect(p.get("llm2")).toBe("b");
    expect(p.has("vec2")).toBe(false);
    expect(p.has("fw2")).toBe(false);
  });

  it("dropShadowStack removes all shadow params and leaves primary intact", () => {
    const p = encodeSimulationInput(baseInput);
    appendShadowStack(p, { llm: "anthropic-api", vectorDb: "qdrant" });
    dropShadowStack(p);
    expect(p.has("llm2")).toBe(false);
    expect(p.has("vec2")).toBe(false);
    expect(p.has("fw2")).toBe(false);
    expect(p.get("llm")).toBe("openai-api");
  });

  it("parseShadowStack returns null when llm2 is absent", () => {
    expect(parseShadowStack({ llm: "openai-api" })).toBeNull();
  });

  it("parseShadowStack reads llm2 + optional vec2/fw2", () => {
    const shadow = parseShadowStack({ llm2: "anthropic-api", vec2: "pgvector" });
    expect(shadow).toEqual({ llm: "anthropic-api", vectorDb: "pgvector", framework: undefined });
  });
});
