"use client";

import { useMemo } from "react";
import type { SimulationInput, SimulationResult } from "@/lib/simulate";
import type { SimulationDelta } from "@/lib/simulateDelta";
import type { Tool } from "@/lib/types";
import { getCategoryColor } from "@/lib/types";
import CostChart from "./components/CostChart";
import LatencyBreakdown from "./components/LatencyBreakdown";
import BreakingPointsList from "./components/BreakingPointsList";
import KillConditionsPanel from "./components/KillConditionsPanel";
import ShareButton from "./components/ShareButton";
import ShadowStackForm from "./components/ShadowStackForm";
import CostDeltaChart from "./components/CostDeltaChart";
import LatencyDeltaTable from "./components/LatencyDeltaTable";
import BreakingPointDelta from "./components/BreakingPointDelta";
import SwitchVerdict from "./components/SwitchVerdict";

interface Props {
  input: SimulationInput;
  result: SimulationResult;
  tools: Tool[];
  shadowStack: SimulationInput["stack"] | null;
  delta: SimulationDelta | null;
}

const USE_CASE_LABEL: Record<SimulationInput["useCase"], string> = {
  chatbot: "Chatbot",
  rag: "RAG app",
  agent: "Autonomous agent",
  custom: "Custom workload",
};

export default function SimulateResultsClient({ input, result, tools, shadowStack, delta }: Props) {
  const stackTools = useMemo(() => {
    const ids = [input.stack.llm, input.stack.vectorDb, input.stack.framework].filter(
      (v): v is string => !!v
    );
    return ids.map((id) => tools.find((t) => t.id === id)).filter((t): t is Tool => !!t);
  }, [input.stack, tools]);

  const shadowTools = useMemo(() => {
    if (!shadowStack) return [];
    const ids = [shadowStack.llm, shadowStack.vectorDb, shadowStack.framework].filter(
      (v): v is string => !!v
    );
    return ids.map((id) => tools.find((t) => t.id === id)).filter((t): t is Tool => !!t);
  }, [shadowStack, tools]);

  // Series for the cost chart: include only tools with non-zero projected cost so the legend
  // doesn't show flat-zero lines for OSS tools.
  const series = useMemo(() => {
    return stackTools
      .filter((t) => result.snapshots.some((snap) => (snap.costBreakdown[t.id] ?? 0) > 0))
      .map((t) => ({
        id: t.id,
        name: t.name,
        color: getCategoryColor(t.category),
      }));
  }, [stackTools, result.snapshots]);

  const firstBreakingPoint = useMemo(() => {
    if (result.breakingPoints.length === 0) return undefined;
    return [...result.breakingPoints].sort((a, b) => a.users - b.users)[0];
  }, [result.breakingPoints]);

  const latencyBreakdown = result.snapshots[0]?.latencyBreakdown ?? {};
  const totalLatency = Object.values(latencyBreakdown).reduce((s, v) => s + v, 0);

  return (
    <div
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "32px 24px 48px",
        display: "flex",
        flexDirection: "column",
        gap: 24,
      }}
    >
      {/* Header */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: 0.6,
              color: "var(--text-muted)",
              marginBottom: 6,
            }}
          >
            Simulator results · {USE_CASE_LABEL[input.useCase]}
          </div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 600,
              color: "var(--text-primary)",
              margin: 0,
              display: "flex",
              gap: 8,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            {stackTools.map((t, i) => (
              <span key={t.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    padding: "4px 10px",
                    background: "var(--surface-2)",
                    border: `1px solid ${getCategoryColor(t.category)}55`,
                    borderRadius: 999,
                    fontSize: 14,
                    color: "var(--text-primary)",
                  }}
                >
                  {t.name}
                </span>
                {i < stackTools.length - 1 && <span style={{ color: "var(--text-muted)" }}>+</span>}
              </span>
            ))}
          </h1>
          <div style={{ marginTop: 8, fontSize: 13, color: "var(--text-secondary)" }}>
            {input.monthlyUsers.toLocaleString()} monthly users · {input.requestsPerUserPerDay}{" "}
            req/user/day · {input.avgInputTokens}/{input.avgOutputTokens} tokens in/out
          </div>
        </div>
        <ShareButton />
      </header>

      {/* Shadow Stack — A/B comparison (AIC-131) */}
      <ShadowStackForm baseInput={input} tools={tools} currentShadow={shadowStack} />

      {delta && shadowStack && (
        <>
          <Panel title="Switch verdict">
            <SwitchVerdict verdict={delta.verdict} verdictMessage={delta.verdictMessage} />
          </Panel>

          <Panel
            title={
              shadowTools.length > 0
                ? `Cost — current vs ${shadowTools.map((t) => t.name).join(" + ")}`
                : "Cost — current vs shadow"
            }
          >
            <CostDeltaChart snapshots={delta.snapshots} crossoverUsers={delta.crossoverUsers} />
          </Panel>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Panel title="Latency delta">
              <LatencyDeltaTable rows={delta.latencyByLayer} total={delta.totalLatency} />
            </Panel>
            <Panel title="Breaking point delta">
              <BreakingPointDelta
                currentFirstBreak={delta.currentFirstBreak}
                shadowFirstBreak={delta.shadowFirstBreak}
              />
            </Panel>
          </div>
        </>
      )}

      {/* Panel 1 — Cost over time */}
      <Panel title="Cost over time">
        {series.length > 0 ? (
          <CostChart
            snapshots={result.snapshots}
            series={series}
            firstBreakingPoint={firstBreakingPoint}
          />
        ) : (
          <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            Every tool in this stack is free or OSS — there is no projectable cost to chart.
          </p>
        )}
      </Panel>

      {/* Two-column row: latency + breaking points (collapses on mobile) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Panel title="Latency breakdown">
          {totalLatency > 0 ? (
            <LatencyBreakdown totalMs={totalLatency} breakdown={latencyBreakdown} />
          ) : (
            <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              No latency data for the selected stack.
            </p>
          )}
        </Panel>

        <Panel title="Breaking points">
          <BreakingPointsList points={result.breakingPoints} />
        </Panel>
      </div>

      {/* Panel 4+5 — Kill conditions + recommendations */}
      <Panel title="When to switch stacks">
        <KillConditionsPanel
          killConditions={result.killConditions}
          breakingPoints={result.breakingPoints}
        />
      </Panel>

      <footer
        style={{
          fontSize: 11,
          color: "var(--text-muted)",
          textAlign: "center",
          marginTop: 8,
        }}
      >
        Latency benchmarks from Artificial Analysis · Pricing from public vendor docs
      </footer>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        padding: 20,
      }}
    >
      <h2
        style={{
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: 0.6,
          color: "var(--text-muted)",
          fontWeight: 600,
          margin: "0 0 14px",
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}
