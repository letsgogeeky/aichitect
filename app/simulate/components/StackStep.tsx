"use client";

import { useMemo } from "react";
import type { Tool } from "@/lib/types";
import ToolPicker from "./ToolPicker";

interface Props {
  tools: Tool[];
  llm: string | undefined;
  vectorDb: string | undefined;
  framework: string | undefined;
  evalTool: string | undefined;
  guardrails: string | undefined;
  showVectorDb: boolean;
  onChange: (patch: {
    llm?: string;
    vectorDb?: string;
    framework?: string;
    eval?: string;
    guardrails?: string;
  }) => void;
}

export default function StackStep({
  tools,
  llm,
  vectorDb,
  framework,
  evalTool,
  guardrails,
  showVectorDb,
  onChange,
}: Props) {
  const llmTools = useMemo(
    () =>
      tools
        .filter((t) => t.slot === "inference" && t.cost_model?.type === "per_token")
        .sort((a, b) => a.name.localeCompare(b.name)),
    [tools]
  );
  const vectorTools = useMemo(
    () => tools.filter((t) => t.slot === "vector-db").sort((a, b) => a.name.localeCompare(b.name)),
    [tools]
  );
  const frameworkTools = useMemo(
    () =>
      tools
        .filter((t) => t.slot === "agent-framework")
        .sort((a, b) => a.name.localeCompare(b.name)),
    [tools]
  );
  const evalTools = useMemo(
    () =>
      tools
        .filter((t) => t.slot === "observability" || t.slot === "prompt-eval")
        .sort((a, b) => a.name.localeCompare(b.name)),
    [tools]
  );
  const guardrailsTools = useMemo(
    () => tools.filter((t) => t.slot === "guardrails").sort((a, b) => a.name.localeCompare(b.name)),
    [tools]
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <ToolPicker
        label="LLM provider"
        tools={llmTools}
        value={llm}
        onChange={(v) => onChange({ llm: v })}
        required
        hintFor={priceHint}
      />
      {showVectorDb && (
        <ToolPicker
          label="Vector DB"
          tools={vectorTools}
          value={vectorDb}
          onChange={(v) => onChange({ vectorDb: v })}
          optional
          hintFor={vectorHint}
        />
      )}
      <ToolPicker
        label="Framework"
        tools={frameworkTools}
        value={framework}
        onChange={(v) => onChange({ framework: v })}
        optional
      />
      <ToolPicker
        label="Eval / observability"
        tools={evalTools}
        value={evalTool}
        onChange={(v) => onChange({ eval: v })}
        optional
        hintFor={evalHint}
      />
      <ToolPicker
        label="Guardrails"
        tools={guardrailsTools}
        value={guardrails}
        onChange={(v) => onChange({ guardrails: v })}
        optional
      />
    </div>
  );
}

function priceHint(tool: Tool): string | undefined {
  const cm = tool.cost_model;
  if (!cm || cm.type !== "per_token") return undefined;
  const i = cm.input_cost_per_1k_tokens;
  if (i == null) return undefined;
  return `$${i.toFixed(4)} / 1k in`;
}

function vectorHint(tool: Tool): string | undefined {
  const cm = tool.cost_model;
  if (cm?.type === "free") return "OSS / self-hosted";
  if (cm?.type === "per_vector_query") {
    const min = cm.min_monthly_cost ?? 0;
    return min > 0 ? `min $${min}/mo` : "pay per use";
  }
  return undefined;
}

function evalHint(tool: Tool): string | undefined {
  const cm = tool.cost_model;
  if (cm?.type === "per_event" && cm.cost_per_event != null) {
    return `$${(cm.cost_per_event * 1000).toFixed(3)} / 1k events`;
  }
  if (cm?.type === "free") return "OSS / self-hosted";
  return undefined;
}
