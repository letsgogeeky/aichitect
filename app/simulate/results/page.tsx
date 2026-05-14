import type { Metadata } from "next";
import { supabase } from "@/lib/db";
import { simulate } from "@/lib/simulate";
import { parseSimulationInput, parseShadowStack } from "@/lib/simulateUrl";
import { computeDelta } from "@/lib/simulateDelta";
import { pageMeta } from "@/lib/metadata";
import type { Tool } from "@/lib/types";
import SimulateResultsClient from "./SimulateResultsClient";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const params = await searchParams;
  const llm = typeof params.llm === "string" ? params.llm : undefined;
  const title = llm ? `Simulator — ${llm}` : "Simulator results";
  return pageMeta({
    title,
    description: "Project cost, latency, and breaking points for your AI stack at scale.",
    path: "/simulate/results",
    ogImageAlt: title,
  });
}

export default async function SimulateResultsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const parsed = parseSimulationInput(params);

  if (!parsed.ok) {
    return <ErrorView title="Invalid simulation input" message={parsed.error} />;
  }

  if (!supabase) {
    return (
      <ErrorView
        title="Database unavailable"
        message="The simulator requires Supabase to load tool data."
      />
    );
  }

  const { data, error } = await supabase.from("tools").select("*");
  if (error || !data) {
    return <ErrorView title="Failed to load tools" message={error?.message ?? "Unknown error"} />;
  }

  const tools = data as unknown as Tool[];
  const result = simulate(parsed.input, tools);

  // Shadow Stack (AIC-131): run a second simulation with an alternative stack
  // and compute the delta. Same scale/use-case/tokens — only the stack differs.
  const shadowStack = parseShadowStack(params);
  const shadowResult = shadowStack
    ? simulate({ ...parsed.input, stack: shadowStack }, tools)
    : null;
  const delta = shadowResult ? computeDelta(result, shadowResult) : null;

  return (
    <SimulateResultsClient
      input={parsed.input}
      result={result}
      tools={tools}
      shadowStack={shadowStack}
      delta={delta}
    />
  );
}

function ErrorView({ title, message }: { title: string; message: string }) {
  return (
    <div
      style={{
        minHeight: "calc(100vh - 56px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        padding: 24,
        textAlign: "center",
      }}
    >
      <h1 style={{ fontSize: 22, fontWeight: 600, color: "var(--text-primary)" }}>{title}</h1>
      <p style={{ fontSize: 14, color: "var(--text-secondary)", maxWidth: 480 }}>{message}</p>
    </div>
  );
}
