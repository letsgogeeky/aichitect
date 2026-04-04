export interface Profile {
  id: string; // uuid — matches auth.users.id
  github_id: number;
  github_username: string;
  avatar_url: string | null;
  created_at: string;
}

export interface SavedStack {
  id: string;
  user_id: string;
  name: string;
  tool_ids: string[];
  created_at: string;
  updated_at: string;
}

export type ToolType = "oss" | "commercial";

export type UseContext = "dev-productivity" | "app-infrastructure" | "both";

export type StackArchetype = "dev-productivity" | "app-infrastructure" | "hybrid";

export type RelationshipType = "integrates-with" | "commonly-paired-with" | "competes-with";

export type CategoryId =
  | "coding-assistants"
  | "autonomous-agents"
  | "agent-frameworks"
  | "pipelines-rag"
  | "llm-infra"
  | "design"
  | "devops"
  | "docs"
  | "product-mgmt"
  | "mcp"
  | "prompt-eval"
  | "specifications"
  | "fine-tuning"
  | "voice-ai"
  | "multimodal"
  | "browser-automation";

export interface PricingPlan {
  name: string;
  price: string;
}

export interface Pricing {
  free_tier: boolean;
  plans: PricingPlan[];
}

/**
 * Multi-strategy detection signals for the Stack Genome parser.
 * Each array contains strings matched against a specific input source.
 * Tools with all empty arrays are "manual-only" — shown in the "Did we miss anything?" UI.
 */
export interface ToolAliases {
  npm: string[]; // npm/yarn package names (package.json dependencies)
  pip: string[]; // PyPI package names (requirements.txt / pyproject.toml)
  env_vars: string[]; // env var key names (.env.example, docker-compose.yml)
  config_files: string[]; // file path prefixes/patterns (file tree detection)
}

export interface Tool {
  id: string;
  name: string;
  category: CategoryId;
  tagline: string;
  description: string;
  type: ToolType;
  pricing: Pricing;
  github_stars: number | null;
  slot: string;
  prominent?: boolean;
  provider?: string; // e.g. "anthropic" | "openai" | "mistral" | "cohere" — only set for provider-tied tools
  choose_if?: string[]; // ≤3 decision signals shown in comparison panel
  aliases?: ToolAliases; // Stack Genome detection signals
  website_url: string | null;
  github_url: string | null;
  /** Which paradigm this tool belongs to — used by the Genome for archetype detection */
  use_context: UseContext;
  // Health fields populated by nightly GitHub sync (AIC-9)
  health_score?: number | null; // 0–100 composite score
  last_synced_at?: string | null; // ISO timestamp of last GitHub sync
  is_stale?: boolean | null; // true if no commits in 90d or repo is archived
  stars_delta?: number | null; // 30d star velocity; null until a 30d-prior snapshot exists (AIC-97)
  /** ISO date when this tool was first added to the directory — drives "New" badge */
  added_at?: string | null;
}

export interface Relationship {
  source: string;
  target: string;
  type: RelationshipType;
  /** How the two tools are used together (enriched relationships only) */
  how?: string;
  /** What outcome the pairing achieves (enriched relationships only) */
  achieves?: string;
  /** Archetype context — if set, this edge only applies within that archetype ("hybrid" | "dev-productivity" | "app-infrastructure") */
  context?: string;
}

export interface StackFlowEdge {
  from: string;
  to: string;
  label: string;
}

export type StackCluster = "build" | "automate" | "ship" | "comply" | "understand";

/** 1 = solo, 2-5 = small, 6-20 = team, 20+ = org */
export type TeamSize = "solo" | "small" | "team" | "org";

/** free = $0, low = <$500/mo, mid = $500–$5k, high = unlimited/enterprise */
export type BudgetTier = "free" | "low" | "mid" | "high";

export type UseCase =
  | "rag"
  | "chatbot"
  | "coding-assistant"
  | "automation"
  | "observability"
  | "compliance";

export type Stage = "prototype" | "mvp" | "production" | "scale";

export interface StackRejection {
  tool: string; // tool id
  reason: string;
}

export interface Stack {
  id: string;
  name: string;
  description: string;
  target: string;
  tools: string[];
  flow: StackFlowEdge[];
  cluster: StackCluster;
  mission: string;
  not_in_stack: StackRejection[];
  kill_conditions: string[];
  graduates_to?: string;
  archetype: StackArchetype;
  tags?: string[];
  why?: string;
  tradeoffs?: string;
  complexity?: "beginner" | "intermediate" | "advanced";
  monthly_cost?: string;
  /** Team sizes this stack is designed for */
  target_team_size?: TeamSize[];
  /** Budget tier this stack fits */
  budget_tier?: BudgetTier;
  /** Primary use cases this stack addresses */
  use_cases?: UseCase[];
  /** Project stages where this stack applies */
  stage?: Stage[];
}

export const STACK_CLUSTERS: { id: StackCluster; label: string; tagline: string }[] = [
  { id: "build", label: "Build", tagline: "Ship this week" },
  { id: "automate", label: "Automate", tagline: "AI does the work" },
  { id: "ship", label: "Ship & Harden", tagline: "Make it trustworthy" },
  { id: "comply", label: "Comply & Restrict", tagline: "Nothing leaves the building" },
  { id: "understand", label: "Understand", tagline: "Data is the product" },
];

export type SlotPriority = "required" | "recommended" | "optional" | "not-applicable";

export interface Slot {
  id: string;
  name: string;
  description: string;
  tools: string[];
  /** Per-archetype priority — use the detected stack archetype to look up the right value */
  priority: Record<StackArchetype, SlotPriority>;
  suggest?: string; // tool id to recommend when slot is empty
  suggest_reason?: string; // one-line reason shown in health panel
}

export interface CategoryMeta {
  id: CategoryId;
  label: string;
  color: string;
}

// Stack layer groups — used for pipeline reasoning UI
export interface StackLayer {
  id: string;
  label: string; // short display name: "Development", "AI Logic", etc.
  question: string; // "What question does this answer in your stack?"
  description: string;
  categories: CategoryId[];
}

export const STACK_LAYERS: StackLayer[] = [
  {
    id: "planning",
    label: "Planning & Spec",
    question: "What are you building and how is it defined?",
    description:
      "Specification engineering, API design, and architecture — the upstream layer where what gets built is defined.",
    categories: ["specifications", "product-mgmt"],
  },
  {
    id: "development",
    label: "Development",
    question: "How do you write and ship code?",
    description: "Your daily coding environment and the agents that handle tasks for you.",
    categories: ["coding-assistants", "autonomous-agents"],
  },
  {
    id: "ai-logic",
    label: "AI Logic",
    question: "How does your AI think and act?",
    description:
      "Frameworks and pipelines that structure how your AI reasons, plans, and retrieves knowledge.",
    categories: ["agent-frameworks", "pipelines-rag"],
  },
  {
    id: "models-infra",
    label: "Models & Infra",
    question: "Which models and infrastructure power it?",
    description:
      "LLM providers, model routing, vector databases, compute infrastructure, fine-tuning, and multimodal models.",
    categories: ["llm-infra", "fine-tuning", "multimodal"],
  },
  {
    id: "tooling",
    label: "Tooling",
    question: "How do you build, observe, and extend it?",
    description:
      "DevOps automation, observability, MCP servers, evals, docs, design tooling, voice AI, and browser automation.",
    categories: [
      "devops",
      "prompt-eval",
      "mcp",
      "design",
      "docs",
      "voice-ai",
      "browser-automation",
    ],
  },
];

export const CATEGORIES: CategoryMeta[] = [
  { id: "coding-assistants", label: "Coding Assistants", color: "#7c6bff" },
  { id: "autonomous-agents", label: "Autonomous Agents", color: "#ff6b6b" },
  { id: "agent-frameworks", label: "Agent Frameworks", color: "#fdcb6e" },
  { id: "pipelines-rag", label: "Pipelines & RAG", color: "#26de81" },
  { id: "llm-infra", label: "LLM Infrastructure", color: "#4ecdc4" },
  { id: "design", label: "Design & UI", color: "#ff9f43" },
  { id: "devops", label: "DevOps & CI/CD", color: "#fd9644" },
  { id: "docs", label: "Documentation", color: "#74b9ff" },
  { id: "product-mgmt", label: "Product & PM", color: "#fd79a8" },
  { id: "mcp", label: "MCP Servers", color: "#a29bfe" },
  { id: "prompt-eval", label: "Prompt & Eval", color: "#55efc4" },
  { id: "specifications", label: "Specifications", color: "#e17055" },
  { id: "fine-tuning", label: "Fine-tuning", color: "#e84393" },
  { id: "voice-ai", label: "Voice AI", color: "#00b894" },
  { id: "multimodal", label: "Multimodal", color: "#6c5ce7" },
  { id: "browser-automation", label: "Browser Automation", color: "#f0932b" },
];

export function getCategoryColor(id: CategoryId): string {
  return CATEGORIES.find((c) => c.id === id)?.color ?? "#555577";
}
