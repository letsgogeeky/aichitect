#!/usr/bin/env node
/**
 * PR 2 — Catalog cleanup migration.
 *
 *   1. Remove relationships pointing to or from archived tools (roocode).
 *   2. Add 12 high-confidence new tools.
 *   3. Backfill lifecycle_phases on every existing tool via slot→phase mapping
 *      with targeted cross-phase overrides for observability tools.
 *
 * Run via: node scripts/pr2-catalog-cleanup.mjs
 * Idempotent: re-running produces no diff once it has been applied.
 */

import fs from "node:fs";
import path from "node:path";

const TOOLS_PATH = path.join("data", "tools.json");
const RELS_PATH = path.join("data", "relationships.json");

// ── 1. Slot → lifecycle_phases mapping ─────────────────────────────────────────
//
// Slot is more specific than category (e.g. llm-infra spans inference, vector-db,
// model-router, orchestration), so we map by slot first.

const SLOT_PHASES = {
  "code-editor": ["coding"],
  "cli-agent": ["coding"],
  "swe-agent": ["coding"],
  "agent-framework": ["orchestration"],
  orchestration: ["orchestration"],
  "model-router": ["orchestration"],
  inference: ["providers"],
  "vector-db": ["retrieval-memory"],
  observability: ["observability"],
  "design-to-code": ["design"],
  "devops-automation": ["code-review"],
  "mcp-infra": ["tools-mcp"],
  "prompt-eval": ["eval"],
  docs: ["specs"],
  "product-mgmt": ["requirements"],
  specifications: ["specs"],
  "fine-tuning": ["coding"],
  "voice-ai": ["providers"],
  multimodal: ["providers"],
  "browser-automation": ["tools-mcp"],
  memory: ["retrieval-memory"],
  guardrails: ["guardrails"],
};

// Cross-phase: anything in the observability category gets BOTH eval and obs.
// Most LLM observability platforms (langfuse, langsmith, helicone, etc.) gate
// CI eval AND run prod telemetry — slot-driven single-phase undersells them.
function phasesForTool(tool) {
  const slotPhases = SLOT_PHASES[tool.slot];
  if (!slotPhases) {
    throw new Error(`Unknown slot "${tool.slot}" on tool "${tool.id}"`);
  }
  if (tool.category === "observability") {
    const set = new Set([...slotPhases, "eval", "observability"]);
    return [...set];
  }
  return [...slotPhases];
}

// ── 2. The 12 new tools ────────────────────────────────────────────────────────

const NEW_TOOLS = [
  {
    id: "letta",
    name: "Letta",
    category: "memory",
    tagline: "Persistent memory for AI agents — formerly MemGPT",
    description:
      "Stateful LLMs that learn from every conversation. Letta gives agents long-term memory through tool-mediated context management — agents recall facts, build user profiles, and persist state across sessions. Open-source server with a hosted cloud option.",
    type: "oss",
    pricing: {
      free_tier: true,
      plans: [{ name: "Cloud Pro", price: "$99/mo" }],
    },
    github_stars: null,
    slot: "memory",
    prominent: true,
    choose_if: [
      "Your agent needs durable memory across sessions, not just chat history",
      "You want a self-hostable memory server with a clean SDK",
      "You're moving off MemGPT and need the modern successor",
    ],
    aliases: {
      npm: [],
      pip: ["letta", "letta-client"],
      env_vars: ["LETTA_API_KEY", "LETTA_SERVER_URL"],
      config_files: [],
    },
    website_url: "https://www.letta.com",
    github_url: "https://github.com/letta-ai/letta",
    use_context: "app-infrastructure",
    added_at: "2026-05-30",
    health_score: null,
    last_synced_at: null,
    is_stale: null,
    scope: "ai-native",
    lifecycle_phases: ["retrieval-memory"],
  },
  {
    id: "langmem",
    name: "LangMem",
    category: "memory",
    tagline: "Memory primitives for LangChain agents",
    description:
      "LangChain's official memory SDK. Drop-in tools for long-term semantic memory, episodic recall, and user preference tracking — built to compose with LangGraph and the broader LangChain ecosystem.",
    type: "oss",
    pricing: { free_tier: true, plans: [] },
    github_stars: null,
    slot: "memory",
    choose_if: [
      "You're already on LangGraph / LangChain and want native memory",
      "You need semantic + episodic memory without rolling your own",
      "You want managed memory backed by LangSmith's storage",
    ],
    aliases: {
      npm: ["@langchain/langmem"],
      pip: ["langmem"],
      env_vars: ["LANGCHAIN_API_KEY"],
      config_files: [],
    },
    website_url: "https://langchain-ai.github.io/langmem/",
    github_url: "https://github.com/langchain-ai/langmem",
    use_context: "app-infrastructure",
    added_at: "2026-05-30",
    health_score: null,
    last_synced_at: null,
    is_stale: null,
    scope: "ai-native",
    lifecycle_phases: ["retrieval-memory"],
  },
  {
    id: "codeium",
    name: "Codeium",
    category: "coding-assistants",
    tagline: "Free AI code completion across 70+ languages and 40+ IDEs",
    description:
      "AI code completion and chat that works in nearly every editor. Free for individuals, paid for teams. Often the fallback when Copilot is blocked by enterprise policy or budget. Now operates alongside Windsurf (same parent) but the IDE-plugin product remains distinct.",
    type: "commercial",
    pricing: {
      free_tier: true,
      plans: [
        { name: "Pro", price: "$15/user/mo" },
        { name: "Teams", price: "$35/user/mo" },
        { name: "Enterprise", price: "Contact" },
      ],
    },
    github_stars: null,
    slot: "code-editor",
    choose_if: [
      "You want free AI completion that works in your existing IDE",
      "Copilot is blocked or too expensive at your org",
      "You need broad language + IDE coverage out of the box",
    ],
    aliases: {
      npm: [],
      pip: [],
      env_vars: ["CODEIUM_API_KEY"],
      config_files: [".codeiumignore"],
    },
    website_url: "https://codeium.com",
    github_url: null,
    use_context: "dev-productivity",
    added_at: "2026-05-30",
    health_score: null,
    last_synced_at: null,
    is_stale: null,
    scope: "ai-native",
    lifecycle_phases: ["coding"],
  },
  {
    id: "sourcegraph-cody",
    name: "Sourcegraph Cody",
    category: "coding-assistants",
    tagline: "AI coding assistant grounded in your entire codebase",
    description:
      "Cody pairs an LLM with Sourcegraph's code graph so suggestions know your whole repo, not just the open file. Strong on monorepos and on enterprises where context-across-services is the bottleneck. Self-hostable for compliance.",
    type: "commercial",
    pricing: {
      free_tier: true,
      plans: [
        { name: "Pro", price: "$9/user/mo" },
        { name: "Enterprise", price: "Contact" },
      ],
    },
    github_stars: null,
    slot: "code-editor",
    choose_if: [
      "You work in a large monorepo or microservice fleet",
      "You need repo-wide context, not single-file completion",
      "Enterprise security / self-hosting is a hard requirement",
    ],
    aliases: {
      npm: [],
      pip: [],
      env_vars: ["SRC_ENDPOINT", "SRC_ACCESS_TOKEN"],
      config_files: [".cody.json"],
    },
    website_url: "https://sourcegraph.com/cody",
    github_url: "https://github.com/sourcegraph/cody",
    use_context: "dev-productivity",
    added_at: "2026-05-30",
    health_score: null,
    last_synced_at: null,
    is_stale: null,
    scope: "ai-native",
    lifecycle_phases: ["coding"],
  },
  {
    id: "codestral",
    name: "Codestral",
    category: "llm-infra",
    tagline: "Mistral's code-specialized LLM, served on its own endpoint",
    description:
      "Mistral's 22B-class code model with a dedicated API on codestral.mistral.ai. Tuned for code completion, repair, and instruction-following on programming tasks. Used standalone as a backend for AI coding tools and IDE plugins.",
    type: "commercial",
    pricing: {
      free_tier: true,
      plans: [{ name: "Pay-as-you-go", price: "$0.20 / 1M input, $0.60 / 1M output" }],
    },
    github_stars: null,
    slot: "inference",
    provider: "mistral",
    choose_if: [
      "You want a code-specialized model API without using a wrapper",
      "You're building a coding tool and want a cheap, fast code LLM backend",
      "You need a non-OpenAI code model to comply with vendor policy",
    ],
    aliases: {
      npm: [],
      pip: ["mistralai"],
      env_vars: ["CODESTRAL_API_KEY", "MISTRAL_API_KEY"],
      config_files: [],
    },
    website_url: "https://docs.mistral.ai/capabilities/code_generation/",
    github_url: null,
    use_context: "app-infrastructure",
    added_at: "2026-05-30",
    health_score: null,
    last_synced_at: null,
    is_stale: null,
    scope: "ai-native",
    lifecycle_phases: ["providers"],
  },
  {
    id: "filesystem-mcp",
    name: "Filesystem MCP",
    category: "mcp",
    tagline: "Official MCP server for local filesystem access",
    description:
      "Reference Anthropic MCP server exposing read/write/list operations on the local filesystem to AI agents. The most common MCP wired into Claude Code and Cursor for repo-aware workflows.",
    type: "oss",
    pricing: { free_tier: true, plans: [] },
    github_stars: null,
    slot: "mcp-infra",
    choose_if: [
      "Your agent needs to read or write local files via MCP",
      "You want the canonical reference implementation, not a fork",
      "You're setting up a Claude Code / Cursor workflow from scratch",
    ],
    aliases: {
      npm: ["@modelcontextprotocol/server-filesystem"],
      pip: [],
      env_vars: [],
      config_files: ["claude_desktop_config.json", ".mcp.json"],
    },
    website_url: "https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem",
    github_url: "https://github.com/modelcontextprotocol/servers",
    use_context: "both",
    added_at: "2026-05-30",
    health_score: null,
    last_synced_at: null,
    is_stale: null,
    scope: "substrate",
    lifecycle_phases: ["tools-mcp"],
  },
  {
    id: "postgres-mcp",
    name: "Postgres MCP",
    category: "mcp",
    tagline: "Official MCP server for Postgres queries",
    description:
      "Reference Anthropic MCP server giving AI agents read-only access to a Postgres database with schema introspection. Use for data-aware agents that need to answer questions from production tables.",
    type: "oss",
    pricing: { free_tier: true, plans: [] },
    github_stars: null,
    slot: "mcp-infra",
    choose_if: [
      "Your agent needs to query a Postgres database via MCP",
      "You want safe read-only access with schema introspection",
      "You're building a data-aware Claude or Cursor workflow",
    ],
    aliases: {
      npm: ["@modelcontextprotocol/server-postgres"],
      pip: [],
      env_vars: ["POSTGRES_CONNECTION_STRING"],
      config_files: ["claude_desktop_config.json", ".mcp.json"],
    },
    website_url: "https://github.com/modelcontextprotocol/servers/tree/main/src/postgres",
    github_url: "https://github.com/modelcontextprotocol/servers",
    use_context: "both",
    added_at: "2026-05-30",
    health_score: null,
    last_synced_at: null,
    is_stale: null,
    scope: "substrate",
    lifecycle_phases: ["tools-mcp"],
  },
  {
    id: "slack-mcp",
    name: "Slack MCP",
    category: "mcp",
    tagline: "Official MCP server for Slack",
    description:
      "Reference Anthropic MCP server exposing Slack messages, channels, and DMs to AI agents. Used for AI assistants that need to search history, summarize threads, or post on behalf of a user.",
    type: "oss",
    pricing: { free_tier: true, plans: [] },
    github_stars: null,
    slot: "mcp-infra",
    choose_if: [
      "Your agent needs to read or post to Slack",
      "You want canonical Slack tool access without a custom integration",
      "You're building a workplace AI assistant",
    ],
    aliases: {
      npm: ["@modelcontextprotocol/server-slack"],
      pip: [],
      env_vars: ["SLACK_BOT_TOKEN", "SLACK_TEAM_ID"],
      config_files: ["claude_desktop_config.json", ".mcp.json"],
    },
    website_url: "https://github.com/modelcontextprotocol/servers/tree/main/src/slack",
    github_url: "https://github.com/modelcontextprotocol/servers",
    use_context: "both",
    added_at: "2026-05-30",
    health_score: null,
    last_synced_at: null,
    is_stale: null,
    scope: "substrate",
    lifecycle_phases: ["tools-mcp"],
  },
  {
    id: "notion-mcp",
    name: "Notion MCP",
    category: "mcp",
    tagline: "Official MCP server for Notion workspaces",
    description:
      "Notion's own MCP server giving AI agents access to pages, databases, and comments. The standard way to wire Claude into a Notion workspace for project context, ticket triage, and doc-grounded answers.",
    type: "oss",
    pricing: { free_tier: true, plans: [] },
    github_stars: null,
    slot: "mcp-infra",
    choose_if: [
      "Your team uses Notion as a knowledge base or project tracker",
      "You want Claude to read and write Notion pages",
      "You need official, sanctioned Notion integration (not a community fork)",
    ],
    aliases: {
      npm: ["@notionhq/notion-mcp-server"],
      pip: [],
      env_vars: ["NOTION_API_KEY"],
      config_files: ["claude_desktop_config.json", ".mcp.json"],
    },
    website_url: "https://github.com/makenotion/notion-mcp-server",
    github_url: "https://github.com/makenotion/notion-mcp-server",
    use_context: "both",
    added_at: "2026-05-30",
    health_score: null,
    last_synced_at: null,
    is_stale: null,
    scope: "substrate",
    lifecycle_phases: ["tools-mcp"],
  },
  {
    id: "memory-mcp",
    name: "Memory MCP",
    category: "mcp",
    tagline: "Official MCP server for persistent agent memory",
    description:
      "Reference Anthropic MCP server providing a knowledge-graph-backed memory store that agents can read and write across sessions. Light-weight alternative to running a full Letta/Mem0 stack when you just need MCP-native memory.",
    type: "oss",
    pricing: { free_tier: true, plans: [] },
    github_stars: null,
    slot: "mcp-infra",
    choose_if: [
      "You want MCP-native memory without standing up a separate memory server",
      "You're using Claude Desktop / Code and need simple persistent recall",
      "Your memory needs are graph-shaped (entities + relations)",
    ],
    aliases: {
      npm: ["@modelcontextprotocol/server-memory"],
      pip: [],
      env_vars: ["MEMORY_FILE_PATH"],
      config_files: ["claude_desktop_config.json", ".mcp.json"],
    },
    website_url: "https://github.com/modelcontextprotocol/servers/tree/main/src/memory",
    github_url: "https://github.com/modelcontextprotocol/servers",
    use_context: "both",
    added_at: "2026-05-30",
    health_score: null,
    last_synced_at: null,
    is_stale: null,
    scope: "substrate",
    lifecycle_phases: ["tools-mcp"],
  },
  {
    id: "agents-md",
    name: "AGENTS.md",
    category: "specifications",
    tagline: "The convention for telling AI coding agents how to work in your repo",
    description:
      "AGENTS.md is the cross-vendor markdown file that AI coding agents (Claude Code, Cursor, Codex, Aider, etc.) read for repo-specific instructions, conventions, and constraints. The de-facto spec for codifying your team's preferences so every agent behaves the same.",
    type: "oss",
    pricing: { free_tier: true, plans: [] },
    github_stars: null,
    slot: "specifications",
    choose_if: [
      "You use multiple AI coding tools and want consistent behavior across them",
      "You want one place to encode repo conventions for agents",
      "You're tired of duplicating .cursorrules / .clinerules / CLAUDE.md content",
    ],
    aliases: {
      npm: [],
      pip: [],
      env_vars: [],
      config_files: ["AGENTS.md"],
    },
    website_url: "https://agents.md",
    github_url: null,
    use_context: "dev-productivity",
    added_at: "2026-05-30",
    health_score: null,
    last_synced_at: null,
    is_stale: null,
    scope: "substrate",
    lifecycle_phases: ["specs"],
  },
  {
    id: "specstory",
    name: "SpecStory",
    category: "spec-driven-dev",
    tagline: "Capture AI coding sessions, turn them into specs",
    description:
      "Records your Cursor / Claude Code conversations and helps you distill them into reusable specs and patterns. Useful when your team's tribal knowledge lives in chat history that you want to commit.",
    type: "commercial",
    pricing: {
      free_tier: true,
      plans: [{ name: "Team", price: "Contact" }],
    },
    github_stars: null,
    slot: "specifications",
    choose_if: [
      "You want a paper trail of what AI did and why",
      "You're trying to extract reusable patterns from one-off AI sessions",
      "Your team needs to share AI workflows without screenshots",
    ],
    aliases: {
      npm: [],
      pip: [],
      env_vars: [],
      config_files: [".specstory"],
    },
    website_url: "https://specstory.com",
    github_url: null,
    use_context: "dev-productivity",
    added_at: "2026-05-30",
    health_score: null,
    last_synced_at: null,
    is_stale: null,
    scope: "ai-native",
    lifecycle_phases: ["specs"],
  },
];

// ── 3. Run migration ───────────────────────────────────────────────────────────

const tools = JSON.parse(fs.readFileSync(TOOLS_PATH, "utf8"));
const rels = JSON.parse(fs.readFileSync(RELS_PATH, "utf8"));

// Step 3a: drop dangling relationships referencing archived tools.
const archivedIds = new Set(tools.filter((t) => t.archived === true).map((t) => t.id));
const beforeRels = rels.length;
const cleanRels = rels.filter((r) => !archivedIds.has(r.source) && !archivedIds.has(r.target));
const droppedRelCount = beforeRels - cleanRels.length;

// Step 3b: add new tools (skip if id already exists — keeps script idempotent).
const existingIds = new Set(tools.map((t) => t.id));
const newAdded = [];
for (const t of NEW_TOOLS) {
  if (existingIds.has(t.id)) continue;
  tools.push(t);
  newAdded.push(t.id);
}

// Step 3c: backfill lifecycle_phases on every tool.
let backfilled = 0;
let observabilitySpan = 0;
for (const t of tools) {
  const phases = phasesForTool(t);
  // Only overwrite when empty; respect any per-tool curation that's already there.
  if (!Array.isArray(t.lifecycle_phases) || t.lifecycle_phases.length === 0) {
    t.lifecycle_phases = phases;
    backfilled++;
    if (t.category === "observability") observabilitySpan++;
  }
}

fs.writeFileSync(TOOLS_PATH, JSON.stringify(tools, null, 2) + "\n");
fs.writeFileSync(RELS_PATH, JSON.stringify(cleanRels, null, 2) + "\n");

// ── 4. Summary ─────────────────────────────────────────────────────────────────

console.log("PR 2 — Catalog cleanup");
console.log(
  `  Archived tools detected:        ${archivedIds.size}  (${[...archivedIds].join(", ")})`
);
console.log(`  Relationships dropped:          ${droppedRelCount}`);
console.log(`  New tools added:                ${newAdded.length}  (${newAdded.join(", ")})`);
console.log(`  lifecycle_phases backfilled:    ${backfilled}`);
console.log(`     — observability cross-phase: ${observabilitySpan} (eval + observability)`);
console.log(
  `  Catalog now:                    ${tools.length} tools, ${cleanRels.length} relationships`
);
