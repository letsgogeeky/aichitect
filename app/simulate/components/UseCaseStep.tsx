"use client";

import type { SimulationUseCase } from "@/lib/simulate";

interface ChipDef {
  id: SimulationUseCase;
  label: string;
  icon: string;
  hint: string;
}

const CHIPS: ChipDef[] = [
  { id: "chatbot", label: "Chatbot", icon: "💬", hint: "Conversational app, short turns" },
  { id: "rag", label: "RAG app", icon: "📚", hint: "Retrieval over a knowledge base" },
  { id: "agent", label: "Agent", icon: "🤖", hint: "Multi-step tool-use loops" },
  { id: "custom", label: "Custom", icon: "⚙️", hint: "Open-ended workload" },
];

interface Props {
  value: SimulationUseCase;
  onChange: (uc: SimulationUseCase) => void;
}

export default function UseCaseStep({ value, onChange }: Props) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
      {CHIPS.map((c) => {
        const active = value === c.id;
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onChange(c.id)}
            title={c.hint}
            style={{
              textAlign: "left",
              background: active ? "var(--surface-2)" : "transparent",
              border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
              borderRadius: 6,
              padding: "8px 10px",
              color: "var(--text-primary)",
              display: "flex",
              alignItems: "center",
              gap: 8,
              transition: "border-color 0.15s ease, background 0.15s ease",
              cursor: "pointer",
            }}
            aria-pressed={active}
          >
            <span style={{ fontSize: 16, lineHeight: 1 }}>{c.icon}</span>
            <span style={{ fontSize: 13, fontWeight: 500 }}>{c.label}</span>
          </button>
        );
      })}
    </div>
  );
}
