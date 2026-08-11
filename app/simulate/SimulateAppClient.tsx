"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Tool } from "@/lib/types";
import { getCategoryColor } from "@/lib/types";
import type { SimulationInput, SimulationUseCase } from "@/lib/simulate";
import { simulate } from "@/lib/simulate";
import { encodeSimulationInput, appendShadowStack } from "@/lib/simulateUrl";
import { computeDelta } from "@/lib/simulateDelta";
import { SCALE_DEFAULTS, STACK_DEFAULTS, SCALE_BOUNDS } from "@/lib/simulateDefaults";

import UseCaseStep from "./components/UseCaseStep";
import ScaleStep from "./components/ScaleStep";
import StackStep from "./components/StackStep";
import LlmChipPicker from "./components/LlmChipPicker";
import LogSlider from "./components/LogSlider";
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
import UnitEconomics from "./components/UnitEconomics";
import BottleneckDiagnosis from "./components/BottleneckDiagnosis";
import CostComposition from "./components/CostComposition";
import ProviderCompare from "./components/ProviderCompare";

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
  const [cacheHitRate, setCacheHitRate] = useState(initialInput.cacheHitRate ?? 0);
  const [batchPct, setBatchPct] = useState(initialInput.batchPct ?? 0);
  const [vectorCount, setVectorCount] = useState(initialInput.vectorCount ?? 100_000);
  const [llm, setLlm] = useState<string | undefined>(initialInput.stack.llm);
  const [vectorDb, setVectorDb] = useState<string | undefined>(initialInput.stack.vectorDb);
  const [framework, setFramework] = useState<string | undefined>(initialInput.stack.framework);
  const [evalTool, setEvalTool] = useState<string | undefined>(initialInput.stack.eval);
  const [guardrails, setGuardrails] = useState<string | undefined>(initialInput.stack.guardrails);
  const [shadow, setShadow] = useState<SimulationInput["stack"] | null>(initialShadow);
  const [advancedStackOpen, setAdvancedStackOpen] = useState(
    Boolean(framework || evalTool || guardrails)
  );
  const [shareOpen, setShareOpen] = useState(false);

  const llmTools = useMemo(
    () =>
      tools
        .filter((t) => t.slot === "inference" && t.cost_model?.type === "per_token")
        .sort((a, b) => a.name.localeCompare(b.name)),
    [tools]
  );

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
      cacheHitRate,
      batchPct,
      vectorCount: useCase === "rag" ? vectorCount : undefined,
      stack: {
        llm,
        vectorDb,
        framework,
        eval: evalTool,
        guardrails,
      },
    };
  }, [
    useCase,
    monthlyUsers,
    requestsPerUserPerDay,
    avgInputTokens,
    avgOutputTokens,
    cacheHitRate,
    batchPct,
    vectorCount,
    llm,
    vectorDb,
    framework,
    evalTool,
    guardrails,
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

  // The snapshot closest to the user-picked `monthlyUsers` — what UnitEconomics shows.
  const focusSnapshot = useMemo(() => {
    if (!result) return null;
    return result.snapshots.reduce((best, s) =>
      Math.abs(s.users - monthlyUsers) < Math.abs(best.users - monthlyUsers) ? s : best
    );
  }, [result, monthlyUsers]);

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

  // ── Display helpers ─────────────────────────────────────────────────────
  const stackTools = useMemo(() => {
    if (!input) return [];
    const ids = [input.stack.llm, input.stack.vectorDb, input.stack.framework].filter(
      (v): v is string => !!v
    );
    return ids.map((id) => tools.find((t) => t.id === id)).filter((t): t is Tool => !!t);
  }, [input, tools]);

  const series = useMemo(() => {
    if (!result) return [];
    // Aggregate per-tool cost across snapshots (most contribute >0 to at least one snapshot).
    const ids = new Set<string>();
    for (const snap of result.snapshots) {
      for (const id of Object.keys(snap.costBreakdown)) {
        if ((snap.costBreakdown[id] ?? 0) > 0) ids.add(id);
      }
    }
    return Array.from(ids)
      .map((id) => tools.find((t) => t.id === id))
      .filter((t): t is Tool => !!t)
      .map((t) => ({ id: t.id, name: t.name, color: getCategoryColor(t.category) }));
  }, [result, tools]);

  const firstBreakingPoint = useMemo(() => {
    if (!result || result.breakingPoints.length === 0) return undefined;
    return [...result.breakingPoints].sort((a, b) => a.users - b.users)[0];
  }, [result]);

  const latencyStages: Record<string, number> = (result?.snapshots[0]?.latencyByStage ??
    {}) as unknown as Record<string, number>;
  const totalLatency = Object.values(latencyStages).reduce<number>((s, v) => s + v, 0);

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
          /* minmax(0, 1fr), not 1fr — a bare fr track can't shrink below its
             content's intrinsic min-width, so any wide inner element (e.g. a
             chart) would force this track past the viewport and cause
             horizontal scroll on the whole page. */
          .simulate-grid { grid-template-columns: minmax(0, 1fr) !important; }
          .simulate-aside { position: static !important; }
        }
      `}</style>

      {/* ── Inputs sidebar ───────────────────────────────────────────────── */}
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
            Tweak inputs · watch results live
          </h1>
        </div>

        <Section title="Use case">
          <UseCaseStep value={useCase} onChange={selectUseCase} />
        </Section>

        <Section title="LLM provider">
          <LlmChipPicker tools={llmTools} value={llm} onChange={setLlm} />
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

        <Section title="Optimization">
          <PercentSlider
            label="Prompt-cache hit rate"
            value={cacheHitRate}
            onChange={setCacheHitRate}
            hint="Cached input tokens are ~90% cheaper. Stable system prompts → high hit rate."
          />
          <PercentSlider
            label="Batch API traffic"
            value={batchPct}
            onChange={setBatchPct}
            hint="Non-real-time work via batch endpoints is 50% off (both input and output)."
          />
        </Section>

        {useCase === "rag" && (
          <Section title="RAG sizing">
            <LogSlider
              label="Stored vectors"
              min={SCALE_BOUNDS.vectorCount.min}
              max={SCALE_BOUNDS.vectorCount.max}
              value={vectorCount}
              logScale={SCALE_BOUNDS.vectorCount.logScale}
              formatValue={formatNumber}
              onChange={setVectorCount}
              hint="Index size — drives vector-DB storage cost."
            />
          </Section>
        )}

        <CollapsibleSection
          title="Advanced stack"
          open={advancedStackOpen}
          onToggle={setAdvancedStackOpen}
        >
          <StackStep
            tools={tools}
            vectorDb={vectorDb}
            framework={framework}
            evalTool={evalTool}
            guardrails={guardrails}
            showVectorDb={useCase === "rag"}
            onChange={(patch) => {
              if (patch.vectorDb !== undefined) setVectorDb(patch.vectorDb || undefined);
              if (patch.framework !== undefined) setFramework(patch.framework || undefined);
              if (patch.eval !== undefined) setEvalTool(patch.eval || undefined);
              if (patch.guardrails !== undefined) setGuardrails(patch.guardrails || undefined);
            }}
          />
        </CollapsibleSection>

        <CollapsibleSection title="Share & export" open={shareOpen} onToggle={setShareOpen}>
          <ShareButton />
        </CollapsibleSection>
      </aside>

      {/* ── Results ────────────────────────────────────────────────────────── */}
      <main style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {!result || !input || !focusSnapshot ? (
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

            {/* Bottleneck verdict */}
            <BottleneckDiagnosis
              bottleneck={result.bottleneck}
              message={result.bottleneckMessage}
            />

            {/* Unit economics */}
            <UnitEconomics snapshot={focusSnapshot} />

            {/* Shadow Stack form — always visible */}
            <ShadowStackForm tools={tools} shadow={shadow} onChange={setShadow} />

            {/* Delta panels when shadow set */}
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

            <Panel title={`Cost composition at ${formatUsers(focusSnapshot.users)} users`}>
              <CostComposition
                byLayer={focusSnapshot.costByLayer}
                totalMonthlyCost={focusSnapshot.monthlyCostUSD}
              />
            </Panel>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Panel title="Latency breakdown">
                {totalLatency > 0 ? (
                  <LatencyBreakdown totalMs={totalLatency} stages={latencyStages} />
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

            <Panel title="Provider comparison">
              <ProviderCompare
                input={input}
                tools={tools}
                comparisonUsers={focusSnapshot.users}
                onPickLlm={setLlm}
              />
            </Panel>

            <Panel title="Structural risks">
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

function CollapsibleSection({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: (next: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <details
      open={open}
      onToggle={(e) => onToggle((e.target as HTMLDetailsElement).open)}
      style={{
        padding: "10px 12px",
        background: "var(--surface-2)",
        border: "1px solid var(--border)",
        borderRadius: 6,
      }}
    >
      <summary
        style={{
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: 0.6,
          color: "var(--text-muted)",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        {title}
      </summary>
      <div style={{ marginTop: 10 }}>{children}</div>
    </details>
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

function PercentSlider({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  hint?: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <label style={{ fontSize: 13, color: "var(--text-secondary)" }}>{label}</label>
        <span
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--text-primary)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {Math.round(value * 100)}%
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={Math.round(value * 100)}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        style={{
          width: "100%",
          accentColor: "var(--accent)",
        }}
        aria-label={label}
      />
      {hint && <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{hint}</span>}
    </div>
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

function formatNumber(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return String(n);
}
