"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toolsData from "@/data/tools.json";
import slotsData from "@/data/slots.json";
import { Tool, Slot, SavedStack } from "@/lib/types";
import { analyzeGenome, detectArchetype, GenomeReport } from "@/lib/genomeAnalysis";
import type { ToolRiskSignal } from "@/app/api/pulse/events/route";
import { StackWatchHeader } from "./components/StackWatchHeader";
import { WatchSlotGrid } from "./components/WatchSlotGrid";
import { WatchMissingPanel } from "./components/WatchMissingPanel";

const allTools = toolsData as Tool[];
const allSlots = slotsData as Slot[];

export function WatchClient({ stackId }: { stackId: string }) {
  const router = useRouter();
  const [stack, setStack] = useState<SavedStack | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<GenomeReport | null>(null);
  const [signals, setSignals] = useState<Record<string, ToolRiskSignal>>({});

  useEffect(() => {
    fetch(`/api/stacks/${stackId}`)
      .then(async (r) => {
        if (r.status === 401 || r.status === 403) {
          router.push("/");
          return null;
        }
        if (!r.ok) throw new Error("Not found");
        return r.json() as Promise<SavedStack>;
      })
      .then((data) => {
        if (!data) return;
        setStack(data);

        const archetype = detectArchetype(data.tool_ids, allTools);
        const gen = analyzeGenome(data.tool_ids, allTools, allSlots, archetype);
        setReport(gen);
        setLoading(false);

        if (data.tool_ids.length === 0) return;
        fetch("/api/pulse/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tool_ids: data.tool_ids.slice(0, 30) }),
        })
          .then((r) => (r.ok ? r.json() : null))
          .then((res) => {
            if (!res?.signals) return;
            const map: Record<string, ToolRiskSignal> = {};
            for (const sig of res.signals as ToolRiskSignal[]) {
              if (sig.signal) map[sig.tool_id] = sig;
            }
            setSignals(map);
          })
          .catch(() => {});
      })
      .catch(() => {
        setError("Stack not found or you don't have access.");
        setLoading(false);
      });
  }, [stackId, router]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl h-24"
              style={{ background: "var(--surface)" }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (error || !stack || !report) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10">
        <p className="text-sm" style={{ color: "var(--danger, #ff6b6b)" }}>
          {error ?? "Something went wrong."}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
      <StackWatchHeader stack={stack} report={report} />
      <WatchSlotGrid report={report} signals={signals} allTools={allTools} />
      <WatchMissingPanel report={report} />
    </div>
  );
}
