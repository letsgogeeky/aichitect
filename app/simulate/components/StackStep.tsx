"use client";

import { useMemo } from "react";
import type { Tool } from "@/lib/types";
import ToolPicker from "./ToolPicker";

interface Props {
  tools: Tool[];
  llm: string | undefined;
  vectorDb: string | undefined;
  framework: string | undefined;
  onChange: (patch: { llm?: string; vectorDb?: string; framework?: string }) => void;
}

export default function StackStep({ tools, llm, vectorDb, framework, onChange }: Props) {
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
        Which stack are you running?
      </h2>
      <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>
        Pick the model — vector store and orchestration are optional.
      </p>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
          marginTop: 8,
          padding: 16,
          background: "var(--surface-2)",
          border: "1px solid var(--border)",
          borderRadius: 8,
        }}
      >
        <ToolPicker
          label="LLM provider"
          tools={llmTools}
          value={llm}
          onChange={(v) => onChange({ llm: v })}
          required
          hintFor={priceHint}
        />
        <ToolPicker
          label="Vector DB"
          tools={vectorTools}
          value={vectorDb}
          onChange={(v) => onChange({ vectorDb: v })}
          optional
        />
        <ToolPicker
          label="Orchestration framework"
          tools={frameworkTools}
          value={framework}
          onChange={(v) => onChange({ framework: v })}
          optional
        />
      </div>
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
