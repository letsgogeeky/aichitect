"use client";

import { useMemo } from "react";
import type { Tool } from "@/lib/types";
import ToolPicker from "./ToolPicker";

interface Props {
  tools: Tool[];
  vectorDb: string | undefined;
  framework: string | undefined;
  evalTool: string | undefined;
  guardrails: string | undefined;
  showVectorDb: boolean;
  onChange: (patch: {
    vectorDb?: string;
    framework?: string;
    eval?: string;
    guardrails?: string;
  }) => void;
}

export default function StackStep({
  tools,
  vectorDb,
  framework,
  evalTool,
  guardrails,
  showVectorDb,
  onChange,
}: Props) {
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
      {showVectorDb && (
        <ToolPicker
          label="Vector DB"
          tools={vectorTools}
          value={vectorDb}
          onChange={(v) => onChange({ vectorDb: v })}
          hintFor={vectorHint}
        />
      )}
      <ToolPicker
        label="Framework"
        tools={frameworkTools}
        value={framework}
        onChange={(v) => onChange({ framework: v })}
      />
      <ToolPicker
        label="Eval / observability"
        tools={evalTools}
        value={evalTool}
        onChange={(v) => onChange({ eval: v })}
        hintFor={evalHint}
      />
      <ToolPicker
        label="Guardrails"
        tools={guardrailsTools}
        value={guardrails}
        onChange={(v) => onChange({ guardrails: v })}
      />
    </div>
  );
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
