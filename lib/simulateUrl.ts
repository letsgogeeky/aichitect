/**
 * URL encoding for the simulator (AIC-127, AIC-131).
 *
 * The results page reads its inputs from query params so any simulation can be
 * shared by URL. Param names are compact so the URL stays manageable:
 *   ?uc=chatbot&u=10000&r=2&in=400&out=600&llm=openai-api&vec=qdrant&fw=langgraph
 *
 * Shadow Stack (AIC-131) reuses the scale + use case from the primary input
 * and adds only `llm2`, `vec2`, `fw2` for the alternative stack.
 */

import type { SimulationInput, SimulationUseCase } from "@/lib/simulate";

const VALID_USE_CASES = ["chatbot", "rag", "agent", "custom"] as const;

export type ParsedSimulationInput =
  | { ok: true; input: SimulationInput }
  | { ok: false; error: string };

export function encodeSimulationInput(input: SimulationInput): URLSearchParams {
  const params = new URLSearchParams();
  params.set("uc", input.useCase);
  params.set("u", String(input.monthlyUsers));
  params.set("r", String(input.requestsPerUserPerDay));
  params.set("in", String(input.avgInputTokens));
  params.set("out", String(input.avgOutputTokens));
  params.set("llm", input.stack.llm);
  if (input.stack.vectorDb) params.set("vec", input.stack.vectorDb);
  if (input.stack.framework) params.set("fw", input.stack.framework);
  if (input.stack.embedding) params.set("em", input.stack.embedding);
  if (input.stack.eval) params.set("ev", input.stack.eval);
  if (input.stack.guardrails) params.set("gd", input.stack.guardrails);
  if (input.stack.routerCheapLlm) params.set("llmC", input.stack.routerCheapLlm);
  if (input.stack.routerCheapPct != null && input.stack.routerCheapPct > 0)
    params.set("rcp", String(input.stack.routerCheapPct));
  if (input.cacheHitRate != null && input.cacheHitRate > 0)
    params.set("cr", String(input.cacheHitRate));
  if (input.batchPct != null && input.batchPct > 0) params.set("bp", String(input.batchPct));
  if (input.vectorCount != null && input.vectorCount > 0)
    params.set("vc", String(input.vectorCount));
  if (input.embeddingTokensPerQuery != null)
    params.set("et", String(input.embeddingTokensPerQuery));
  if (input.peakToAverageRatio != null && input.peakToAverageRatio !== 3)
    params.set("pk", String(input.peakToAverageRatio));
  return params;
}

type ParamMap = URLSearchParams | Record<string, string | string[] | undefined>;

function getParam(params: ParamMap, key: string): string | undefined {
  if (params instanceof URLSearchParams) return params.get(key) ?? undefined;
  const v = params[key];
  if (Array.isArray(v)) return v[0];
  return v;
}

function positiveNumber(raw: string | undefined): number | null {
  if (raw === undefined) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

export function parseSimulationInput(params: ParamMap): ParsedSimulationInput {
  const uc = getParam(params, "uc");
  if (!uc || !(VALID_USE_CASES as readonly string[]).includes(uc)) {
    return { ok: false, error: "Missing or invalid useCase (uc)" };
  }
  const u = positiveNumber(getParam(params, "u"));
  if (u === null) return { ok: false, error: "Missing or invalid monthlyUsers (u)" };
  const r = positiveNumber(getParam(params, "r"));
  if (r === null) return { ok: false, error: "Missing or invalid requestsPerUserPerDay (r)" };
  const inputTokens = positiveNumber(getParam(params, "in"));
  if (inputTokens === null) return { ok: false, error: "Missing or invalid avgInputTokens (in)" };
  const outputTokens = positiveNumber(getParam(params, "out"));
  if (outputTokens === null)
    return { ok: false, error: "Missing or invalid avgOutputTokens (out)" };
  const llm = getParam(params, "llm");
  if (!llm) return { ok: false, error: "Missing stack.llm" };

  const cr = numberInRange(getParam(params, "cr"), 0, 1);
  const bp = numberInRange(getParam(params, "bp"), 0, 1);
  const vc = nonNegativeNumber(getParam(params, "vc"));
  const et = positiveNumber(getParam(params, "et"));
  const pk = numberInRange(getParam(params, "pk"), 1, 50);
  const rcp = numberInRange(getParam(params, "rcp"), 0, 1);

  return {
    ok: true,
    input: {
      useCase: uc as SimulationUseCase,
      monthlyUsers: u,
      requestsPerUserPerDay: r,
      avgInputTokens: inputTokens,
      avgOutputTokens: outputTokens,
      cacheHitRate: cr ?? undefined,
      batchPct: bp ?? undefined,
      vectorCount: vc ?? undefined,
      embeddingTokensPerQuery: et ?? undefined,
      peakToAverageRatio: pk ?? undefined,
      stack: {
        llm,
        vectorDb: getParam(params, "vec") || undefined,
        framework: getParam(params, "fw") || undefined,
        embedding: getParam(params, "em") || undefined,
        eval: getParam(params, "ev") || undefined,
        guardrails: getParam(params, "gd") || undefined,
        routerCheapLlm: getParam(params, "llmC") || undefined,
        routerCheapPct: rcp ?? undefined,
      },
    },
  };
}

function numberInRange(raw: string | undefined, min: number, max: number): number | null {
  if (raw === undefined) return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  if (n < min || n > max) return null;
  return n;
}

function nonNegativeNumber(raw: string | undefined): number | null {
  if (raw === undefined) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

// ── Shadow Stack (AIC-131) ────────────────────────────────────────────────────

/** Append a shadow stack to an existing primary params object. Mutates and returns. */
export function appendShadowStack(
  params: URLSearchParams,
  shadow: SimulationInput["stack"]
): URLSearchParams {
  params.set("llm2", shadow.llm);
  if (shadow.vectorDb) params.set("vec2", shadow.vectorDb);
  else params.delete("vec2");
  if (shadow.framework) params.set("fw2", shadow.framework);
  else params.delete("fw2");
  return params;
}

/** Remove shadow-stack params from an existing URLSearchParams. */
export function dropShadowStack(params: URLSearchParams): URLSearchParams {
  params.delete("llm2");
  params.delete("vec2");
  params.delete("fw2");
  return params;
}

/** Parse a shadow stack from URL params. Returns null when `llm2` is absent. */
export function parseShadowStack(params: ParamMap): SimulationInput["stack"] | null {
  const llm = getParam(params, "llm2");
  if (!llm) return null;
  return {
    llm,
    vectorDb: getParam(params, "vec2") || undefined,
    framework: getParam(params, "fw2") || undefined,
  };
}
