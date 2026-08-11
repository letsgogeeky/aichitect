"use client";

interface TokenPreset {
  id: string;
  label: string;
  input: number;
  output: number;
  hint: string;
}

export const TOKEN_PRESETS: TokenPreset[] = [
  {
    id: "quick-chat",
    label: "Quick chat",
    input: 200,
    output: 300,
    hint: "Short turn, minimal system prompt",
  },
  {
    id: "long-qa",
    label: "Long Q&A",
    input: 500,
    output: 1_000,
    hint: "Detailed multi-paragraph answers",
  },
  {
    id: "rag",
    label: "RAG retrieval",
    input: 3_000,
    output: 500,
    hint: "5 retrieved chunks + concise reply",
  },
  {
    id: "agent",
    label: "Agent loop",
    input: 1_500,
    output: 800,
    hint: "Tool-use cycle with growing context",
  },
  {
    id: "code-gen",
    label: "Code generation",
    input: 2_000,
    output: 1_500,
    hint: "Source files in, completion out",
  },
];

interface Props {
  input: number;
  output: number;
  onChange: (input: number, output: number) => void;
}

export default function TokenPresets({ input, output, onChange }: Props) {
  const activeId = TOKEN_PRESETS.find((p) => p.input === input && p.output === output)?.id;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
        Pick a preset or drag the sliders below
      </span>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {TOKEN_PRESETS.map((p) => {
          const active = activeId === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onChange(p.input, p.output)}
              title={`${p.hint} · ${p.input} in / ${p.output} out`}
              style={{
                background: active ? "var(--accent)" : "var(--surface-2)",
                border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
                color: active ? "var(--bg)" : "var(--text-secondary)",
                borderRadius: 999,
                padding: "5px 10px",
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
                transition: "background 0.15s ease, color 0.15s ease",
              }}
              aria-pressed={active}
            >
              {p.label}
            </button>
          );
        })}
      </div>
      {activeId && (
        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
          {TOKEN_PRESETS.find((p) => p.id === activeId)!.hint}
        </span>
      )}
    </div>
  );
}
