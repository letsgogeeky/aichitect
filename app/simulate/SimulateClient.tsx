"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Tool } from "@/lib/types";
import type { SimulationInput, SimulationUseCase } from "@/lib/simulate";
import { encodeSimulationInput } from "@/lib/simulateUrl";
import { SCALE_DEFAULTS, STACK_DEFAULTS, splitTokens, SCALE_BOUNDS } from "@/lib/simulateDefaults";
import StepDots from "./components/StepDots";
import UseCaseStep from "./components/UseCaseStep";
import ScaleStep from "./components/ScaleStep";
import StackStep from "./components/StackStep";

type Step = 1 | 2 | 3;

interface Props {
  tools: Tool[];
  /** Pre-fill from `?s=tool-id-1,tool-id-2,...` (Genome / Builder convention). */
  importedToolIds: string[];
}

export default function SimulateClient({ tools, importedToolIds }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [step, setStep] = useState<Step>(1);
  const [useCase, setUseCase] = useState<SimulationUseCase | null>(null);

  const [scale, setScale] = useState({
    monthlyUsers: SCALE_DEFAULTS.chatbot.monthlyUsers,
    requestsPerUserPerDay: SCALE_DEFAULTS.chatbot.requestsPerUserPerDay,
    avgTokens: SCALE_DEFAULTS.chatbot.avgTokens,
  });

  // Imported stack from `?s=` overrides STACK_DEFAULTS — applied once on mount.
  const importedStack = useMemo(
    () => importStackFromIds(importedToolIds, tools),
    [importedToolIds, tools]
  );
  const [stack, setStack] = useState(importedStack);

  function selectUseCase(uc: SimulationUseCase) {
    setUseCase(uc);
    setScale({
      monthlyUsers: SCALE_DEFAULTS[uc].monthlyUsers,
      requestsPerUserPerDay: SCALE_DEFAULTS[uc].requestsPerUserPerDay,
      avgTokens: SCALE_DEFAULTS[uc].avgTokens,
    });
    // Imported stack wins over use-case stack defaults.
    if (Object.keys(importedStack).length === 0) {
      setStack(STACK_DEFAULTS[uc]);
    }
    setStep(2);
  }

  const canSubmit = useCase !== null && !!stack.llm;

  function submit() {
    if (!useCase || !stack.llm) return;
    const { input, output } = splitTokens(scale.avgTokens, useCase);
    const simInput: SimulationInput = {
      useCase,
      monthlyUsers: scale.monthlyUsers,
      requestsPerUserPerDay: scale.requestsPerUserPerDay,
      avgInputTokens: input,
      avgOutputTokens: output,
      stack: {
        llm: stack.llm,
        vectorDb: stack.vectorDb,
        framework: stack.framework,
      },
    };
    const params = encodeSimulationInput(simInput);
    startTransition(() => {
      router.push(`/simulate/results?${params.toString()}`);
    });
  }

  return (
    <div
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "40px 24px 56px",
        display: "flex",
        flexDirection: "column",
        gap: 24,
      }}
    >
      <header style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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
        <h1 style={{ fontSize: 28, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
          Project cost, latency, and breaking points.
        </h1>
        <StepDots current={step} />
        {importedToolIds.length > 0 && step === 1 && (
          <div
            style={{
              fontSize: 12,
              color: "var(--accent-2)",
              background: "color-mix(in srgb, var(--accent-2) 8%, transparent)",
              border: "1px solid color-mix(in srgb, var(--accent-2) 30%, transparent)",
              padding: "8px 12px",
              borderRadius: 6,
            }}
          >
            Imported {importedToolIds.length} tool{importedToolIds.length === 1 ? "" : "s"} from
            your shared stack — pick a use case to continue.
          </div>
        )}
      </header>

      <section
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          padding: 24,
          minHeight: 320,
        }}
      >
        {step === 1 && <UseCaseStep value={useCase} onChange={selectUseCase} />}
        {step === 2 && (
          <ScaleStep
            monthlyUsers={scale.monthlyUsers}
            requestsPerUserPerDay={scale.requestsPerUserPerDay}
            avgTokens={scale.avgTokens}
            onChange={(patch) => setScale((s) => ({ ...s, ...patch }))}
          />
        )}
        {step === 3 && (
          <StackStep
            tools={tools}
            llm={stack.llm}
            vectorDb={stack.vectorDb}
            framework={stack.framework}
            onChange={(patch) => setStack((s) => ({ ...s, ...patch }))}
          />
        )}
      </section>

      <nav
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
        }}
      >
        <button
          type="button"
          onClick={() => setStep((s) => (s > 1 ? ((s - 1) as Step) : s))}
          disabled={step === 1}
          style={{
            background: "transparent",
            border: "1px solid var(--border)",
            color: step === 1 ? "var(--text-muted)" : "var(--text-primary)",
            borderRadius: 6,
            padding: "10px 14px",
            fontSize: 13,
            cursor: step === 1 ? "not-allowed" : "pointer",
          }}
        >
          ← Back
        </button>

        {step < 3 ? (
          <button
            type="button"
            onClick={() => setStep((s) => (s < 3 ? ((s + 1) as Step) : s))}
            disabled={step === 1 && useCase === null}
            style={primaryButtonStyle(!(step === 1 && useCase === null))}
          >
            Next →
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit || isPending}
            style={primaryButtonStyle(canSubmit && !isPending)}
          >
            {isPending ? "Running…" : "Run simulation →"}
          </button>
        )}
      </nav>

      <p style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", margin: 0 }}>
        Bounds — users {clean(SCALE_BOUNDS.monthlyUsers.min)} to{" "}
        {clean(SCALE_BOUNDS.monthlyUsers.max)} · tokens {clean(SCALE_BOUNDS.avgTokens.min)} to{" "}
        {clean(SCALE_BOUNDS.avgTokens.max)}.
      </p>
    </div>
  );
}

function primaryButtonStyle(enabled: boolean): React.CSSProperties {
  return {
    background: enabled ? "var(--accent)" : "var(--btn)",
    border: `1px solid ${enabled ? "var(--accent)" : "var(--btn-border)"}`,
    color: enabled ? "#fff" : "var(--text-muted)",
    borderRadius: 6,
    padding: "10px 16px",
    fontSize: 13,
    fontWeight: 600,
    cursor: enabled ? "pointer" : "not-allowed",
    transition: "background 0.15s ease, opacity 0.15s ease",
  };
}

function clean(n: number): string {
  if (n >= 1_000_000) return `${n / 1_000_000}M`;
  if (n >= 1_000) return `${n / 1_000}k`;
  return String(n);
}

/**
 * Map a list of tool IDs (from `?s=` Builder/Genome param) onto the simulator's
 * 3-layer stack by inspecting each tool's `slot` field.
 * Order rules:
 *   - first tool in slot=inference  → llm
 *   - first tool in slot=vector-db  → vectorDb
 *   - first tool in slot=agent-framework → framework
 * Other slots are ignored — the simulator only models these three layers.
 */
function importStackFromIds(
  ids: string[],
  tools: Tool[]
): { llm?: string; vectorDb?: string; framework?: string } {
  const result: { llm?: string; vectorDb?: string; framework?: string } = {};
  for (const id of ids) {
    const tool = tools.find((t) => t.id === id);
    if (!tool) continue;
    if (tool.slot === "inference" && !result.llm) result.llm = id;
    else if (tool.slot === "vector-db" && !result.vectorDb) result.vectorDb = id;
    else if (tool.slot === "agent-framework" && !result.framework) result.framework = id;
  }
  return result;
}
