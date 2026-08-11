"use client";

import { useState } from "react";
import type { Tool } from "@/lib/types";
import type { SimulationInput } from "@/lib/simulate";
import ToolPicker from "./ToolPicker";

interface Props {
  tools: Tool[];
  /** Currently-applied shadow stack (if any). Source-of-truth lives in the parent. */
  shadow: SimulationInput["stack"] | null;
  onChange: (shadow: SimulationInput["stack"] | null) => void;
}

export default function ShadowStackForm({ tools, shadow, onChange }: Props) {
  const [open, setOpen] = useState(shadow !== null);
  const [llm, setLlm] = useState(shadow?.llm);
  const [vectorDb, setVectorDb] = useState(shadow?.vectorDb);
  const [framework, setFramework] = useState(shadow?.framework);

  const llmTools = tools
    .filter((t) => t.slot === "inference" && t.cost_model?.type === "per_token")
    .sort((a, b) => a.name.localeCompare(b.name));
  const vectorTools = tools
    .filter((t) => t.slot === "vector-db")
    .sort((a, b) => a.name.localeCompare(b.name));
  const frameworkTools = tools
    .filter((t) => t.slot === "agent-framework")
    .sort((a, b) => a.name.localeCompare(b.name));

  function applyShadow() {
    if (!llm) return;
    onChange({ llm, vectorDb, framework });
  }

  function cancel() {
    setOpen(false);
    if (shadow) onChange(null);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={ctaStyle}
        aria-label="Compare this stack with an alternative"
      >
        + Compare with alternative stack
      </button>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 14,
        padding: 16,
        background: "var(--surface-2)",
        border: "1px solid var(--border)",
        borderRadius: 8,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <h3 style={headerStyle}>Shadow stack — alternative to compare against</h3>
        <button type="button" onClick={cancel} style={subtleButtonStyle}>
          {shadow ? "Remove" : "Cancel"}
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 12,
        }}
      >
        <ToolPicker label="LLM provider" tools={llmTools} value={llm} onChange={(v) => setLlm(v)} />
        <ToolPicker
          label="Vector DB"
          tools={vectorTools}
          value={vectorDb}
          onChange={(v) => setVectorDb(v)}
        />
        <ToolPicker
          label="Framework"
          tools={frameworkTools}
          value={framework}
          onChange={(v) => setFramework(v)}
        />
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          type="button"
          onClick={applyShadow}
          disabled={!llm}
          style={primaryButtonStyle(!!llm)}
        >
          {shadow ? "Update comparison" : "Run comparison"}
        </button>
      </div>
    </div>
  );
}

const ctaStyle: React.CSSProperties = {
  background: "var(--btn)",
  border: "1px solid var(--btn-border)",
  borderRadius: 6,
  color: "var(--text-secondary)",
  padding: "10px 16px",
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
  alignSelf: "flex-start",
};

const headerStyle: React.CSSProperties = {
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: 0.6,
  color: "var(--text-muted)",
  fontWeight: 600,
  margin: 0,
};

const subtleButtonStyle: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: "var(--text-muted)",
  fontSize: 12,
  cursor: "pointer",
};

function primaryButtonStyle(enabled: boolean): React.CSSProperties {
  return {
    background: enabled ? "var(--accent)" : "var(--btn)",
    border: `1px solid ${enabled ? "var(--accent)" : "var(--btn-border)"}`,
    color: enabled ? "var(--bg)" : "var(--text-muted)",
    borderRadius: 6,
    padding: "10px 16px",
    fontSize: 13,
    fontWeight: 600,
    cursor: enabled ? "pointer" : "not-allowed",
  };
}
