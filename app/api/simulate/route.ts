export const dynamic = "force-dynamic";

import { simulate, SimulationInput, TOKEN_DEFAULTS } from "@/lib/simulate";
import { supabase } from "@/lib/db.server";
import type { Tool } from "@/lib/types";

interface SimulationRequestBody {
  useCase?: SimulationInput["useCase"];
  monthlyUsers?: number;
  requestsPerUserPerDay?: number;
  avgInputTokens?: number;
  avgOutputTokens?: number;
  cacheHitRate?: number;
  batchPct?: number;
  vectorCount?: number;
  embeddingTokensPerQuery?: number;
  peakToAverageRatio?: number;
  stack?: Partial<SimulationInput["stack"]>;
}

export async function POST(request: Request) {
  let body: SimulationRequestBody;
  try {
    body = (await request.json()) as SimulationRequestBody;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const useCase = body.useCase;
  if (!useCase || !(useCase in TOKEN_DEFAULTS)) {
    return Response.json(
      { error: "useCase must be one of: chatbot, rag, agent, custom" },
      { status: 400 }
    );
  }
  if (!body.stack?.llm) {
    return Response.json({ error: "stack.llm is required" }, { status: 400 });
  }
  if (!body.monthlyUsers || body.monthlyUsers <= 0) {
    return Response.json({ error: "monthlyUsers must be a positive number" }, { status: 400 });
  }
  if (!body.requestsPerUserPerDay || body.requestsPerUserPerDay <= 0) {
    return Response.json(
      { error: "requestsPerUserPerDay must be a positive number" },
      { status: 400 }
    );
  }

  const defaults = TOKEN_DEFAULTS[useCase];
  const avgInputTokens = body.avgInputTokens ?? defaults.inputTokens;
  const avgOutputTokens = body.avgOutputTokens ?? defaults.outputTokens;
  if (avgInputTokens <= 0 || avgOutputTokens <= 0) {
    return Response.json(
      { error: "avgInputTokens and avgOutputTokens must be positive" },
      { status: 400 }
    );
  }

  if (!supabase) {
    return Response.json(
      { error: "Database is not configured — simulator requires Supabase" },
      { status: 503 }
    );
  }

  const { data, error } = await supabase.from("tools").select("*");
  if (error || !data) {
    return Response.json({ error: "Failed to load tools" }, { status: 502 });
  }

  const tools = data as unknown as Tool[];

  const input: SimulationInput = {
    useCase,
    monthlyUsers: body.monthlyUsers,
    requestsPerUserPerDay: body.requestsPerUserPerDay,
    avgInputTokens,
    avgOutputTokens,
    cacheHitRate: body.cacheHitRate,
    batchPct: body.batchPct,
    vectorCount: body.vectorCount,
    embeddingTokensPerQuery: body.embeddingTokensPerQuery,
    peakToAverageRatio: body.peakToAverageRatio,
    stack: {
      llm: body.stack.llm,
      vectorDb: body.stack.vectorDb,
      framework: body.stack.framework,
      embedding: body.stack.embedding,
      eval: body.stack.eval,
      guardrails: body.stack.guardrails,
      routerCheapLlm: body.stack.routerCheapLlm,
      routerCheapPct: body.stack.routerCheapPct,
    },
  };

  const result = simulate(input, tools);
  return Response.json(result);
}
