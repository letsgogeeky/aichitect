/**
 * URL encoding for the simulator (AIC-127).
 *
 * The results page reads its inputs from query params so any simulation can be
 * shared by URL. Param names are compact so the URL stays manageable:
 *   ?uc=chatbot&u=10000&r=2&in=400&out=600&llm=openai-api&vec=qdrant&fw=langgraph
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

  return {
    ok: true,
    input: {
      useCase: uc as SimulationUseCase,
      monthlyUsers: u,
      requestsPerUserPerDay: r,
      avgInputTokens: inputTokens,
      avgOutputTokens: outputTokens,
      stack: {
        llm,
        vectorDb: getParam(params, "vec") || undefined,
        framework: getParam(params, "fw") || undefined,
      },
    },
  };
}
