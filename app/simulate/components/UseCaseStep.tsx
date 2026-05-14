"use client";

import type { SimulationUseCase } from "@/lib/simulate";

interface ChipDef {
  id: SimulationUseCase;
  label: string;
  icon: string;
  description: string;
}

const CHIPS: ChipDef[] = [
  {
    id: "chatbot",
    label: "Chatbot",
    icon: "💬",
    description: "User-facing chat with system prompts and short context.",
  },
  {
    id: "rag",
    label: "RAG app",
    icon: "📚",
    description: "Retrieval-augmented generation over a knowledge base.",
  },
  {
    id: "agent",
    label: "Autonomous agent",
    icon: "🤖",
    description: "Multi-step tool-use loops with accumulating context.",
  },
  {
    id: "custom",
    label: "Custom workload",
    icon: "⚙️",
    description: "Open-ended — set your own scale and stack.",
  },
];

interface Props {
  value: SimulationUseCase | null;
  onChange: (uc: SimulationUseCase) => void;
}

export default function UseCaseStep({ value, onChange }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
        What are you building?
      </h2>
      <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>
        Pick the closest match — it sets sensible defaults for scale and stack.
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 10,
          marginTop: 6,
        }}
      >
        {CHIPS.map((c) => {
          const active = value === c.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onChange(c.id)}
              style={{
                textAlign: "left",
                background: active ? "var(--surface-2)" : "var(--surface)",
                border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
                borderRadius: 8,
                padding: 14,
                color: "var(--text-primary)",
                display: "flex",
                flexDirection: "column",
                gap: 6,
                transition: "border-color 0.15s ease, background 0.15s ease",
              }}
              aria-pressed={active}
            >
              <span style={{ fontSize: 22, lineHeight: 1 }}>{c.icon}</span>
              <span style={{ fontSize: 15, fontWeight: 600 }}>{c.label}</span>
              <span style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.4 }}>
                {c.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
