"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Tool } from "@/lib/types";
import { getCategoryColor } from "@/lib/types";
import type { SimulationInput, SimulationUseCase } from "@/lib/simulate";
import { simulate } from "@/lib/simulate";
import { encodeSimulationInput, appendShadowStack } from "@/lib/simulateUrl";
import { computeDelta } from "@/lib/simulateDelta";
import { SCALE_DEFAULTS, STACK_DEFAULTS } from "@/lib/simulateDefaults";

import UseCaseStep from "./components/UseCaseStep";
import ScaleStep from "./components/ScaleStep";
import StackStep from "./components/StackStep";
import ShareButton from "./components/ShareButton";

import CostChart from "./components/CostChart";
import LatencyBreakdown from "./components/LatencyBreakdown";
import BreakingPointsList from "./components/BreakingPointsList";
import KillConditionsPanel from "./components/KillConditionsPanel";
import ShadowStackForm from "./components/ShadowStackForm";
import CostDeltaChart from "./components/CostDeltaChart";
import LatencyDeltaTable from "./components/LatencyDeltaTable";
import BreakingPointDelta from "./components/BreakingPointDelta";
import SwitchVerdict from "./components/SwitchVerdict";

interface Props {
  tools: Tool[];
  initialInput: SimulationInput;
  initialShadow: SimulationInput["stack"] | null;
}

const USE_CASE_LABEL: Record<SimulationUseCase, string> = {
  chatbot: "Chatbot",
  rag: "RAG app",
  agent: "Autonomous agent",
  custom: "Custom workload",
};

export default function SimulateAppClient({ tools, initialInput, initialShadow }: Props) {
  const router = useRouter();

  // ── Input state ──────────────────────────────────────────────────────────
  const [useCase, setUseCase] = useState<SimulationUseCase>(initialInput.useCase);
  const [monthlyUsers, setMonthlyUsers] = useState(initialInput.monthlyUsers);
  const [requestsPerUserPerDay, setRPD] = useState(initialInput.requestsPerUserPerDay);
  const [avgInputTokens, setInputTokens] = useState(initialInput.avgInputTokens);
  const [avgOutputTokens, setOutputTokens] = useState(initialInput.avgOutputTokens);
  const [llm, setLlm] = useState<string | undefined>(initialInput.stack.llm);
  const [vectorDb, setVectorDb] = useState<string | undefined>(initialInput.stack.vectorDb);
  const [framework, setFramework] = useState<string | undefined>(initialInput.stack.framework);
  const [shadow, setShadow] = useState<SimulationInput["stack"] | null>(initialShadow);

  function selectUseCase(uc: SimulationUseCase) {
    setUseCase(uc);
    setMonthlyUsers(SCALE_DEFAULTS[uc].monthlyUsers);
    setRPD(SCALE_DEFAULTS[uc].requestsPerUserPerDay);
    setInputTokens(SCALE_DEFAULTS[uc].avgInputTokens);
    setOutputTokens(SCALE_DEFAULTS[uc].avgOutputTokens);
    setLlm(STACK_DEFAULTS[uc].llm);
    setVectorDb(STACK_DEFAULTS[uc].vectorDb);
    setFramework(STACK_DEFAULTS[uc].framework);
  }

  // ── Derived simulation ────────────────────────────────────────────────────
  const input: SimulationInput | null = useMemo(() => {
    if (!llm) return null;
    return {
      useCase,
      monthlyUsers,
      requestsPerUserPerDay,
      avgInputTokens,
      avgOutputTokens,
      stack: { llm, vectorDb, framework },
    };
  }, [
    useCase,
    monthlyUsers,
    requestsPerUserPerDay,
    avgInputTokens,
    avgOutputTokens,
    llm,
    vectorDb,
    framework,
  ]);

  const result = useMemo(() => (input ? simulate(input, tools) : null), [input, tools]);
  const shadowResult = useMemo(
    () => (input && shadow ? simulate({ ...input, stack: shadow }, tools) : null),
    [input, shadow, tools]
  );
  const delta = useMemo(
    () => (result && shadowResult ? computeDelta(result, shadowResult) : null),
    [result, shadowResult]
  );

  // ── URL sync (debounced 300ms) ────────────────────────────────────────────
  useEffect(() => {
    if (!input) return;
    const handle = setTimeout(() => {
      const params = encodeSimulationInput(input);
      if (shadow) appendShadowStack(params, shadow);
      router.replace(`/simulate?${params.toString()}`, { scroll: false });
    }, 300);
    return () => clearTimeout(handle);
  }, [input, shadow, router]);

  // ── Derived display state ─────────────────────────────────────────────────
  const stackTools = useMemo(() => {
    if (!input) return [];
    const ids = [input.stack.llm, input.stack.vectorDb, input.stack.framework].filter(
      (v): v is string => !!v
    );
    return ids.map((id) => tools.find((t) => t.id === id)).filter((t): t is Tool => !!t);
  }, [input, tools]);

  const series = useMemo(() => {
    if (!result) return [];
    return stackTools
      .filter((t) => result.snapshots.some((snap) => (snap.costBreakdown[t.id] ?? 0) > 0))
      .map((t) => ({ id: t.id, name: t.name, color: getCategoryColor(t.category) }));
  }, [stackTools, result]);

  const firstBreakingPoint = useMemo(() => {
    if (!result || result.breakingPoints.length === 0) return undefined;
    return [...result.breakingPoints].sort((a, b) => a.users - b.users)[0];
  }, [result]);

  const latencyBreakdown = result?.snapshots[0]?.latencyBreakdown ?? {};
  const totalLatency = Object.values(latencyBreakdown).reduce((s, v) => s + v, 0);

  return (
    <div
      style={{
        maxWidth: 1320,
        margin: "0 auto",
        padding: "24px 24px 48px",
        display: "grid",
        gridTemplateColumns: "minmax(280px, 360px) 1fr",
        gap: 24,
      }}
      className="simulate-grid"
    >
      <style>{`
        @media (max-width: 880px) {
          .simulate-grid {
            grid-template-columns: 1fr !important;
          }
          .simulate-aside {
            position: static !important;
          }
        }
      `}</style>

      {/* ── Inputs (sticky aside) ───────────────────────────────────────────── */}
      <aside
        className="simulate-aside"
        style={{
          position: "sticky",
          top: 80,
          alignSelf: "start",
          display: "flex",
          flexDirection: "column",
          gap: 18,
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          padding: 18,
          maxHeight: "calc(100vh - 96px)",
          overflowY: "auto",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: 0.6,
              color: "var(--text-muted)",
              fontWeight: 600,
            }}
          >
            AI Stack Simulator
          </div>
          <h1
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: "var(--text-primary)",
              margin: "4px 0 0",
            }}
          >
            Tweak and watch the numbers move
          </h1>
        </div>

        <Section title="Use case">
          <UseCaseStep value={useCase} onChange={selectUseCase} />
        </Section>

        <Section title="Workload">
          <ScaleStep
            monthlyUsers={monthlyUsers}
            requestsPerUserPerDay={requestsPerUserPerDay}
            avgInputTokens={avgInputTokens}
            avgOutputTokens={avgOutputTokens}
            onChange={(patch) => {
              if (patch.monthlyUsers !== undefined) setMonthlyUsers(patch.monthlyUsers);
              if (patch.requestsPerUserPerDay !== undefined) setRPD(patch.requestsPerUserPerDay);
              if (patch.avgInputTokens !== undefined) setInputTokens(patch.avgInputTokens);
              if (patch.avgOutputTokens !== undefined) setOutputTokens(patch.avgOutputTokens);
            }}
          />
        </Section>

        <Section title="Stack">
          <StackStep
            tools={tools}
            llm={llm}
            vectorDb={vectorDb}
            framework={framework}
            onChange={(patch) => {
              if (patch.llm !== undefined) setLlm(patch.llm);
              if (patch.vectorDb !== undefined) setVectorDb(patch.vectorDb || undefined);
              if (patch.framework !== undefined) setFramework(patch.framework || undefined);
            }}
          />
        </Section>

        <ShareButton />
      </aside>

      {/* ── Results ────────────────────────────────────────────────────────── */}
      <main style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {!result || !input ? (
          <EmptyState />
        ) : (
          <>
            <header
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: 0.6,
                    color: "var(--text-muted)",
                  }}
                >
                  {USE_CASE_LABEL[input.useCase]} · {formatUsers(input.monthlyUsers)} users ·{" "}
                  {input.requestsPerUserPerDay}/day · {input.avgInputTokens}/{input.avgOutputTokens}{" "}
                  tokens
                </div>
                <h2
                  style={{
                    fontSize: 20,
                    fontWeight: 600,
                    margin: "4px 0 0",
                    display: "flex",
                    gap: 6,
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  {stackTools.map((t, i) => (
                    <span key={t.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span
                        style={{
                          padding: "2px 8px",
                          background: "var(--surface-2)",
                          border: `1px solid ${getCategoryColor(t.category)}55`,
                          borderRadius: 999,
                          fontSize: 13,
                        }}
                      >
                        {t.name}
                      </span>
                      {i < stackTools.length - 1 && (
                        <span style={{ color: "var(--text-muted)", fontSize: 12 }}>+</span>
                      )}
                    </span>
                  ))}
                </h2>
              </div>
            </header>

            {/* Shadow Stack form — always visible */}
            <ShadowStackForm tools={tools} shadow={shadow} onChange={setShadow} />

            {/* Delta panels (when shadow set) */}
            {delta && shadow && (
              <>
                <Panel title="Switch verdict">
                  <SwitchVerdict verdict={delta.verdict} verdictMessage={delta.verdictMessage} />
                </Panel>
                <Panel title="Cost — current vs shadow">
                  <CostDeltaChart
                    snapshots={delta.snapshots}
                    crossoverUsers={delta.crossoverUsers}
                  />
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

            {/* Standard panels */}
            <Panel title="Cost over time">
              {series.length > 0 ? (
                <CostChart
                  snapshots={result.snapshots}
                  series={series}
                  firstBreakingPoint={firstBreakingPoint}
                />
              ) : (
                <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                  Every tool in this stack is free or OSS — no projectable cost to chart.
                </p>
              )}
            </Panel>

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
          </>
        )}
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <h2
        style={{
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: 0.6,
          color: "var(--text-muted)",
          fontWeight: 600,
          margin: 0,
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        padding: 18,
      }}
    >
      <h3
        style={{
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: 0.6,
          color: "var(--text-muted)",
          fontWeight: 600,
          margin: "0 0 12px",
        }}
      >
        {title}
      </h3>
      {children}
    </section>
  );
}

function EmptyState() {
  return (
    <div
      style={{
        padding: 48,
        textAlign: "center",
        color: "var(--text-secondary)",
        fontSize: 14,
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 8,
      }}
    >
      Pick an LLM provider in the sidebar to see projections.
    </div>
  );
}

function formatUsers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}k`;
  return String(n);
}
