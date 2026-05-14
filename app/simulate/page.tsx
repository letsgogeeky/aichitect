import type { Metadata } from "next";
import { supabase } from "@/lib/db";
import { pageMeta } from "@/lib/metadata";
import type { Tool } from "@/lib/types";
import SimulateClient from "./SimulateClient";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata(): Promise<Metadata> {
  return pageMeta({
    title: "Simulator",
    description: "Project the cost, latency, and breaking points of your AI stack in 30 seconds.",
    path: "/simulate",
    ogImageAlt: "AI Stack Simulator",
  });
}

export default async function SimulatePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const sParam = typeof params.s === "string" ? params.s : "";
  const importedToolIds = sParam.split(",").filter(Boolean);

  if (!supabase) {
    return <ErrorView message="Database is not configured — simulator requires Supabase." />;
  }

  const { data, error } = await supabase.from("tools").select("*").order("name");

  if (error || !data) {
    return <ErrorView message={`Failed to load tools: ${error?.message ?? "unknown"}`} />;
  }

  const tools = data as unknown as Tool[];
  return <SimulateClient tools={tools} importedToolIds={importedToolIds} />;
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
