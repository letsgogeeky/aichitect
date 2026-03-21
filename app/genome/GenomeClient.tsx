"use client";

import { useState, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Tool, Slot, Relationship } from "@/lib/types";
import { analyzeGenome } from "@/lib/genomeAnalysis";
import { GenomeDataCtx, useGenomeData } from "./GenomeContext";
import { GenomeStep } from "./genomeConstants";
import { ScanStep } from "./components/ScanStep";
import { WorkflowStep } from "./components/WorkflowStep";
import { ResultsView } from "./components/ResultsView";

function GenomePageInner() {
  const { allTools, allSlots, allRelationships } = useGenomeData();
  const searchParams = useSearchParams();
  const router = useRouter();

  const urlDeps = useMemo(
    () =>
      (searchParams.get("deps") ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    [searchParams]
  );

  const [step, setStep] = useState<GenomeStep>(urlDeps.length > 0 ? "results" : "scan");
  const [detectedIds, setDetectedIds] = useState<string[]>(urlDeps);
  const [workflowIds, setWorkflowIds] = useState<string[]>([]);

  const allIds = useMemo(
    () => [...new Set([...detectedIds, ...workflowIds])],
    [detectedIds, workflowIds]
  );

  const report = useMemo(
    () => (step === "results" ? analyzeGenome(allIds, allTools, allSlots, allRelationships) : null),
    [step, allIds, allTools, allSlots, allRelationships]
  );

  function handleScanNext(ids: string[]) {
    setDetectedIds(ids);
    setStep("workflow");
  }

  function handleWorkflowNext(ids: string[]) {
    setWorkflowIds(ids);
    setStep("results");
    const all = [...new Set([...detectedIds, ...ids])];
    if (all.length > 0) {
      router.replace(`/genome?deps=${all.join(",")}`, { scroll: false });
    }
  }

  function handleReset() {
    setDetectedIds([]);
    setWorkflowIds([]);
    setStep("scan");
    router.replace("/genome", { scroll: false });
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        background: "#0a0a0f",
      }}
    >
      {step === "scan" && <ScanStep onNext={handleScanNext} />}

      {step === "workflow" && (
        <WorkflowStep
          detectedCount={detectedIds.length}
          onBack={() => setStep("scan")}
          onNext={handleWorkflowNext}
        />
      )}

      {step === "results" && report && (
        <ResultsView report={report} allIds={allIds} onReset={handleReset} />
      )}
    </div>
  );
}

export default function GenomeClient({
  tools,
  slots,
  relationships,
}: {
  tools: Tool[];
  slots: Slot[];
  relationships: Relationship[];
}) {
  return (
    <GenomeDataCtx.Provider
      value={{ allTools: tools, allSlots: slots, allRelationships: relationships }}
    >
      <Suspense
        fallback={
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "#555577",
              fontSize: 13,
            }}
          >
            Loading…
          </div>
        }
      >
        <GenomePageInner />
      </Suspense>
    </GenomeDataCtx.Provider>
  );
}
