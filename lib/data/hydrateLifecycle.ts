/**
 * Hydration shims for the JSON-only lifecycle metadata (PR 1-7).
 *
 * The new fields — `scope`, `lifecycle_phases`, `archived` on Tool;
 * `track`, `phases` on Stack — live only in the static JSON. The Supabase
 * tables haven't gained columns for them yet, so when the data loaders hit
 * the DB they get rows where those fields are `undefined`.
 *
 * This module merges the JSON-side fields onto DB rows so every consumer of
 * `getTools()` / `getStacks()` sees a complete Tool/Stack regardless of
 * whether the source was the DB or the JSON fallback. Pure, no React, fully
 * unit-tested. Drop this module once the Supabase schema catches up — that's
 * the proper fix (Option A in the dep review); this is the safe hotfix
 * (Option B).
 *
 * Precedence:
 *   1. Whatever the DB returned (if defined — future-proofs for when columns land).
 *   2. JSON value for the matching id.
 *   3. Hard default that won't crash any consumer.
 */

import type { LifecyclePhase, LifecycleTrack, Stack, Tool, ToolScope } from "@/lib/types";

export function hydrateTool(
  dbTool: Tool,
  jsonToolsById: Map<string, Pick<Tool, "scope" | "lifecycle_phases" | "archived">>
): Tool {
  const json = jsonToolsById.get(dbTool.id);
  return {
    ...dbTool,
    scope: (dbTool.scope ?? json?.scope ?? "ai-native") as ToolScope,
    lifecycle_phases: (dbTool.lifecycle_phases ?? json?.lifecycle_phases ?? []) as LifecyclePhase[],
    archived: dbTool.archived ?? json?.archived ?? false,
  };
}

export function hydrateTools(
  dbTools: Tool[],
  jsonTools: Pick<Tool, "id" | "scope" | "lifecycle_phases" | "archived">[]
): Tool[] {
  const byId = new Map(jsonTools.map((t) => [t.id, t]));
  return dbTools.map((t) => hydrateTool(t, byId));
}

export function hydrateStack(
  dbStack: Stack,
  jsonStacksById: Map<string, Pick<Stack, "track" | "phases">>
): Stack {
  const json = jsonStacksById.get(dbStack.id);
  return {
    ...dbStack,
    track: (dbStack.track ?? json?.track ?? "specialized") as LifecycleTrack,
    phases: (dbStack.phases ?? json?.phases ?? []) as LifecyclePhase[],
  };
}

export function hydrateStacks(
  dbStacks: Stack[],
  jsonStacks: Pick<Stack, "id" | "track" | "phases">[]
): Stack[] {
  const byId = new Map(jsonStacks.map((s) => [s.id, s]));
  return dbStacks.map((s) => hydrateStack(s, byId));
}
