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

export const WORKFLOW_GROUPS: { label: string; toolIds: string[] }[] = [
  {
    label: "Code editor",
    toolIds: ["cursor", "windsurf", "github-copilot", "zed", "jetbrains-ai", "continue", "cline"],
  },
  {
    label: "CLI agent",
    toolIds: ["claude-code", "aider", "goose", "plandex"],
  },
  {
    label: "Autonomous agent",
    toolIds: ["devin", "lovable", "openhands", "bolt-new", "gpt-pilot"],
  },
  {
    label: "DevOps & CI",
    toolIds: ["coderabbit", "sweep-ai", "qodo", "trunk", "sourcery", "graphite"],
  },
  {
    label: "Design to code",
    toolIds: ["v0", "framer-ai", "webflow-ai", "locofy", "galileo", "google-stitch"],
  },
  {
    label: "Docs",
    toolIds: ["mintlify", "notion-ai", "gitbook-ai", "swimm"],
  },
  {
    label: "Product",
    toolIds: ["linear-ai", "height-ai", "cycle", "kraftful"],
  },
];

export const PRIORITY_COLOR: Record<SlotPriority, string> = {
  required: "#ff6b6b",
  recommended: "#fd9644",
  optional: "#555577",
  "not-applicable": "#2a2a3a",
};
