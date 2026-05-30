/**
 * Shared seed data — imported by seed-db.ts and seed-db-local.ts.
 * No side effects: just data, types, and validation.
 */

import type { Tool, Stack, Slot, Relationship } from "../lib/types";
import toolsData from "../data/tools.json";
import stacksData from "../data/stacks.json";
import relationshipsData from "../data/relationships.json";
import slotsData from "../data/slots.json";

// ── DB row types (mirror the schema columns exactly) ──────────────────────────

export interface DbTool {
  id: string;
  name: string;
  category: string;
  tagline: string;
  description: string;
  type: "oss" | "commercial";
  pricing: Tool["pricing"];
  cost_model: Tool["cost_model"] | null;
  github_stars: number | null;
  slot: string;
  prominent: boolean;
  provider: string | null;
  choose_if: string[];
  aliases: Tool["aliases"];
  website_url: string | null;
  github_url: string | null;
  use_context: Tool["use_context"];
  latency_p50_ms: number | null;
  ttft_p50_ms: number | null;
  output_tokens_per_second: number | null;
  max_tpm: number | null;
  max_rpm: number | null;
  bytes_per_vector: number | null;
}

export interface DbStack {
  id: string;
  name: string;
  description: string;
  target: string;
  cluster: Stack["cluster"];
  mission: string;
  tools: string[];
  flow: Stack["flow"];
  not_in_stack: Stack["not_in_stack"];
  kill_conditions: string[];
  graduates_to: string | null;
  tags: string[];
  why: string | null;
  tradeoffs: string | null;
  complexity: "beginner" | "intermediate" | "advanced" | null;
  monthly_cost: string | null;
  archetype: Stack["archetype"];
}

export interface DbSlot {
  id: string;
  name: string;
  description: string;
  tools: string[];
  priority: Slot["priority"];
  suggest: string | null;
  suggest_reason: string | null;
}

export interface DbRelationship {
  source: string;
  target: string;
  type: Relationship["type"];
  how: string | null;
  achieves: string | null;
}

// ── Shape mapping ─────────────────────────────────────────────────────────────

export const tools: DbTool[] = (toolsData as Tool[]).map((t) => ({
  id: t.id,
  name: t.name,
  category: t.category,
  tagline: t.tagline,
  description: t.description,
  type: t.type,
  pricing: t.pricing,
  cost_model: t.cost_model ?? null,
  github_stars: t.github_stars ?? null,
  slot: t.slot,
  prominent: t.prominent ?? false,
  provider: t.provider ?? null,
  choose_if: t.choose_if ?? [],
  aliases: t.aliases ?? { npm: [], pip: [], env_vars: [], config_files: [] },
  website_url: t.website_url ?? null,
  github_url: t.github_url ?? null,
  use_context: t.use_context ?? "both",
  latency_p50_ms: t.latency_p50_ms ?? null,
  ttft_p50_ms: t.ttft_p50_ms ?? null,
  output_tokens_per_second: t.output_tokens_per_second ?? null,
  max_tpm: t.max_tpm ?? null,
  max_rpm: t.max_rpm ?? null,
  bytes_per_vector: t.bytes_per_vector ?? null,
}));

export const stacks: DbStack[] = (stacksData as Stack[]).map((s) => ({
  id: s.id,
  name: s.name,
  description: s.description,
  target: s.target,
  cluster: s.cluster,
  mission: s.mission,
  tools: s.tools,
  flow: s.flow,
  not_in_stack: s.not_in_stack,
  kill_conditions: s.kill_conditions,
  graduates_to: s.graduates_to ?? null,
  tags: s.tags ?? [],
  why: s.why ?? null,
  tradeoffs: s.tradeoffs ?? null,
  complexity: s.complexity ?? null,
  monthly_cost: s.monthly_cost ?? null,
  archetype: s.archetype ?? "app-infrastructure",
}));

export const slots: DbSlot[] = (slotsData as Slot[]).map((s) => ({
  id: s.id,
  name: s.name,
  description: s.description,
  tools: s.tools,
  priority: s.priority,
  suggest: s.suggest ?? null,
  suggest_reason: s.suggest_reason ?? null,
}));

export const relationships: DbRelationship[] = (relationshipsData as Relationship[]).map((r) => ({
  source: r.source,
  target: r.target,
  type: r.type,
  how: r.how ?? null,
  achieves: r.achieves ?? null,
}));

// ── Validation ────────────────────────────────────────────────────────────────

export function validate(): void {
  const toolIds = new Set(tools.map((t) => t.id));
  const orphans: string[] = [];
  const scopeViolations: string[] = [];

  for (const r of relationships) {
    if (!toolIds.has(r.source)) orphans.push(`relationship source "${r.source}"`);
    if (!toolIds.has(r.target)) orphans.push(`relationship target "${r.target}"`);
  }
  for (const s of stacks) {
    for (const id of s.tools) {
      if (!toolIds.has(id)) orphans.push(`stack "${s.id}" → tool "${id}"`);
    }
  }
  for (const s of slots) {
    for (const id of s.tools) {
      if (!toolIds.has(id)) orphans.push(`slot "${s.id}" → tool "${id}"`);
    }
  }

  // ── PR 1: scope rule + lifecycle metadata are now required on every tool ──
  // The DbTool/DbStack maps above drop these fields (they're not part of the
  // current Supabase schema), so validate against the raw JSON imports.
  const rawTools = toolsData as Tool[];
  const rawStacks = stacksData as Stack[];
  for (const t of rawTools) {
    if (t.scope !== "ai-native" && t.scope !== "substrate") {
      scopeViolations.push(
        `tool "${t.id}" — invalid or missing scope (must be ai-native | substrate)`
      );
    }
    if (!Array.isArray(t.lifecycle_phases)) {
      scopeViolations.push(`tool "${t.id}" — missing lifecycle_phases array`);
    }
  }
  for (const s of rawStacks) {
    if (s.track !== "development" && s.track !== "runtime" && s.track !== "specialized") {
      scopeViolations.push(`stack "${s.id}" — invalid or missing track`);
    }
    if (!Array.isArray(s.phases)) {
      scopeViolations.push(`stack "${s.id}" — missing phases array`);
    }
  }

  const allFailures = [...orphans, ...scopeViolations];
  if (allFailures.length > 0) {
    console.error(`\n${allFailures.length} validation failure(s) — aborting:\n`);
    allFailures.forEach((o) => console.error(`  • ${o}`));
    process.exit(1);
  }

  const archivedCount = rawTools.filter((t) => t.archived).length;
  const substrateCount = rawTools.filter((t) => t.scope === "substrate").length;

  console.log(
    `✓ tools:         ${tools.length} rows (${substrateCount} substrate, ${archivedCount} archived)`
  );
  console.log(`✓ stacks:        ${stacks.length} rows`);
  console.log(`✓ slots:         ${slots.length} rows`);
  console.log(`✓ relationships: ${relationships.length} rows`);
  console.log(`✓ No orphaned references`);
  console.log(`✓ Scope + lifecycle metadata present on every tool and stack`);
}
