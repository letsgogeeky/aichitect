import type { Tool } from "@/lib/types";

export interface ResolvedTool {
  tool: Tool;
  input: string; // the original name/id the user provided
}

export interface ResolveResult {
  resolved: ResolvedTool[];
  skipped: string[]; // inputs that had no catalog match
}

/** Normalize a string to a comparable slug for matching. */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

/**
 * Resolves a list of user-provided tool names or IDs against the catalog.
 *
 * Match priority:
 *  1. Exact id match          ("cursor"     → cursor)
 *  2. Normalized id match     ("Claude Code" → claude-code)
 *  3. Case-insensitive name   ("Cursor"     → cursor)
 *  4. npm alias match         ("@langchain/langgraph" → langgraph)
 *  5. pip alias match         ("langchain-core" → langchain)
 *  6. env_var alias match     ("OPENAI_API_KEY" → openai)
 */
export function resolveTools(inputs: string[], catalog: Tool[]): ResolveResult {
  const resolved: ResolvedTool[] = [];
  const skipped: string[] = [];
  const usedIds = new Set<string>();

  for (const input of inputs) {
    const norm = normalize(input);
    const lower = input.toLowerCase();

    const match =
      // 1. Exact id
      catalog.find((t) => t.id === input) ??
      // 2. Normalized id
      catalog.find((t) => normalize(t.id) === norm) ??
      // 3. Case-insensitive name
      catalog.find((t) => t.name.toLowerCase() === lower) ??
      // 4. Normalized name
      catalog.find((t) => normalize(t.name) === norm) ??
      // 5. npm aliases
      catalog.find((t) => t.aliases?.npm?.some((a) => normalize(a) === norm)) ??
      // 6. pip aliases
      catalog.find((t) => t.aliases?.pip?.some((a) => normalize(a) === norm)) ??
      // 7. env_var aliases
      catalog.find((t) => t.aliases?.env_vars?.some((a) => normalize(a) === norm));

    if (match && !usedIds.has(match.id)) {
      usedIds.add(match.id);
      resolved.push({ tool: match, input });
    } else if (!match) {
      skipped.push(input);
    }
    // if match but already used (duplicate input), silently skip
  }

  return { resolved, skipped };
}
