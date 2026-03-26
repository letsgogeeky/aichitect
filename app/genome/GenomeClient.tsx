"use client";

import { useState, useMemo, useEffect, Suspense, Component, ReactNode } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Tool, Slot, Stack } from "@/lib/types";
import { analyzeGenome, detectArchetype } from "@/lib/genomeAnalysis";
import { GenomeDataCtx, useGenomeData } from "./GenomeContext";
import { GenomeStep } from "./genomeConstants";
import { ScanStep } from "./components/ScanStep";
import { WorkflowStep } from "./components/WorkflowStep";
import { ResultsView } from "./components/ResultsView";

class GenomeErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            gap: 12,
            color: "#555577",
          }}
        >
          <span style={{ fontSize: 28 }}>⚠</span>
          <p style={{ fontSize: 13, margin: 0 }}>Something went wrong loading the Genome.</p>
          <button
            onClick={() => this.setState({ error: null })}
            style={{
              marginTop: 4,
              padding: "6px 16px",
              fontSize: 12,
              borderRadius: 6,
              background: "#1e1e2e",
              border: "1px solid #2e2e4e",
              color: "#f0f0f8",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function GenomePageInner() {
  const { allTools, allSlots } = useGenomeData();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Always start in a consistent SSR-safe state; sync from URL after mount to avoid hydration mismatch
  const [step, setStep] = useState<GenomeStep>("workflow");
  const [detectedIds, setDetectedIds] = useState<string[]>([]);
  const [workflowIds, setWorkflowIds] = useState<string[]>([]);

  useEffect(() => {
    const deps = (searchParams.get("deps") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (deps.length > 0) {
      setWorkflowIds(deps);
      setStep("results");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const allIds = useMemo(
    () => [...new Set([...detectedIds, ...workflowIds])],
    [detectedIds, workflowIds]
  );

  const report = useMemo(() => {
    if (step !== "results") return null;
    const archetype = detectArchetype(allIds, allTools);
    return analyzeGenome(allIds, allTools, allSlots, archetype);
  }, [step, allIds, allTools, allSlots]);

  function handleWorkflowNext(ids: string[]) {
    setWorkflowIds(ids);
    setStep("scan");
  }

  function handleScanNext(ids: string[]) {
    setDetectedIds(ids);
    setStep("results");
    const all = [...new Set([...workflowIds, ...ids])];
    if (all.length > 0) {
      router.replace(`/genome?deps=${all.join(",")}`, { scroll: false });
    }
  }

  function handleReset() {
    setDetectedIds([]);
    setWorkflowIds([]);
    setStep("workflow");
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
      {step === "workflow" && <WorkflowStep onNext={handleWorkflowNext} />}

      {step === "scan" && <ScanStep onBack={() => setStep("workflow")} onNext={handleScanNext} />}

      {step === "results" && report && (
        <ResultsView report={report} allIds={allIds} onReset={handleReset} />
      )}

      {step === "results" && !report && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            gap: 12,
            color: "#555577",
          }}
        >
          <p style={{ fontSize: 13, margin: 0 }}>No analysis to show.</p>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setStep("scan")}
              style={{
                padding: "6px 16px",
                fontSize: 12,
                borderRadius: 6,
                background: "#1e1e2e",
                border: "1px solid #2e2e4e",
                color: "#8888aa",
                cursor: "pointer",
              }}
            >
              ← Back
            </button>
            <button
              onClick={handleReset}
              style={{
                padding: "6px 16px",
                fontSize: 12,
                borderRadius: 6,
                background: "#1e1e2e",
                border: "1px solid #2e2e4e",
                color: "#f0f0f8",
                cursor: "pointer",
              }}
            >
              Start over
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GenomeClient({
  tools,
  slots,
  stacks,
}: {
  tools: Tool[];
  slots: Slot[];
  stacks: Stack[];
}) {
  return (
    <GenomeDataCtx.Provider
      value={{
        allTools: tools,
        allSlots: slots,
        allStacks: stacks,
      }}
    >
      <GenomeErrorBoundary>
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
      </GenomeErrorBoundary>
    </GenomeDataCtx.Provider>
  );
}
