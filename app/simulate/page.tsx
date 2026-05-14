import type { Metadata } from "next";
import { supabase } from "@/lib/db";
import { pageMeta } from "@/lib/metadata";
import type { Tool } from "@/lib/types";
import type { SimulationInput, SimulationUseCase } from "@/lib/simulate";
import { parseSimulationInput, parseShadowStack } from "@/lib/simulateUrl";
import { SCALE_DEFAULTS, STACK_DEFAULTS } from "@/lib/simulateDefaults";
import SimulateAppClient from "./SimulateAppClient";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const DEFAULT_USE_CASE: SimulationUseCase = "chatbot";

function defaultInput(): SimulationInput {
  const scale = SCALE_DEFAULTS[DEFAULT_USE_CASE];
  return {
    useCase: DEFAULT_USE_CASE,
    monthlyUsers: scale.monthlyUsers,
    requestsPerUserPerDay: scale.requestsPerUserPerDay,
    avgInputTokens: scale.avgInputTokens,
    avgOutputTokens: scale.avgOutputTokens,
    stack: { ...STACK_DEFAULTS[DEFAULT_USE_CASE] },
  };
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const params = await searchParams;
  const llm = typeof params.llm === "string" ? params.llm : undefined;
  const title = llm ? `Simulator — ${llm}` : "AI Stack Simulator";
  return pageMeta({
    title,
    description:
      "Project cost, latency, and breaking points for your AI stack at scale. Tweak the inputs and watch the numbers move.",
    path: "/simulate",
    ogImageAlt: title,
  });
}

export default async function SimulatePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;

  if (!supabase) {
    return <ErrorView message="Database is not configured — simulator requires Supabase." />;
  }

  const { data, error } = await supabase.from("tools").select("*").order("name");
  if (error || !data) {
    return <ErrorView message={`Failed to load tools: ${error?.message ?? "unknown"}`} />;
  }
  const tools = data as unknown as Tool[];

  // If the URL has a complete simulation input, use it. Otherwise fall back to
  // defaults — but if `?s=` (Builder/Genome share) is present, slot-map those
  // tool IDs onto the default stack so users land on a useful simulation.
  const parsed = parseSimulationInput(params);
  let initialInput: SimulationInput;
  if (parsed.ok) {
    initialInput = parsed.input;
  } else {
    initialInput = defaultInput();
    const sParam = typeof params.s === "string" ? params.s : "";
    const importedIds = sParam.split(",").filter(Boolean);
    if (importedIds.length > 0) {
      initialInput = {
        ...initialInput,
        stack: importStack(importedIds, tools, initialInput.stack),
      };
    }
  }

  const initialShadow = parseShadowStack(params);

  return (
    <SimulateAppClient tools={tools} initialInput={initialInput} initialShadow={initialShadow} />
  );
}

function importStack(
  ids: string[],
  tools: Tool[],
  fallback: SimulationInput["stack"]
): SimulationInput["stack"] {
  const result: SimulationInput["stack"] = { ...fallback };
  for (const id of ids) {
    const tool = tools.find((t) => t.id === id);
    if (!tool) continue;
    if (tool.slot === "inference") result.llm = id;
    else if (tool.slot === "vector-db") result.vectorDb = id;
    else if (tool.slot === "agent-framework") result.framework = id;
  }
  return result;
}

function ErrorView({ message }: { message: string }) {
  return (
    <div
      style={{
        minHeight: "calc(100vh - 56px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        textAlign: "center",
        color: "var(--text-secondary)",
        fontSize: 14,
      }}
    >
      {message}
    </div>
  );
}
