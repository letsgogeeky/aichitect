import type { SlotPriority } from "@/lib/types";

export type GenomeStep = "scan" | "workflow" | "results";

export type InputTab = "package.json" | "requirements.txt" | "pyproject.toml" | ".env.example";

export const INPUT_TABS: { id: InputTab; label: string; placeholder: string }[] = [
  {
    id: "package.json",
    label: "package.json",
    placeholder: `{\n  "dependencies": {\n    "openai": "^4.0.0",\n    "@langchain/core": "^0.1.0"\n  }\n}`,
  },
  {
    id: "requirements.txt",
    label: "requirements.txt",
    placeholder: "langchain>=0.1.0\nanthropicai\nlangfuse\n...",
  },
  {
    id: "pyproject.toml",
    label: "pyproject.toml",
    placeholder: '[project]\ndependencies = [\n  "anthropic>=0.25.0",\n  "langgraph",\n]\n...',
  },
  {
    id: ".env.example",
    label: ".env.example",
    placeholder: "ANTHROPIC_API_KEY=\nOPENAI_API_KEY=\nLANGFUSE_SECRET_KEY=\n...",
  },
];

export const PRIORITY_COLOR: Record<SlotPriority, string> = {
  required: "#ff6b6b",
  recommended: "#fd9644",
  optional: "#555577",
  "not-applicable": "#2a2a3a",
};
