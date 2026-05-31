import { describe, it, expect } from "vitest";
import {
  hydrateTool,
  hydrateTools,
  hydrateStack,
  hydrateStacks,
} from "@/lib/data/hydrateLifecycle";
import type { Stack, Tool } from "@/lib/types";

// ── Helpers — only fill what each test needs, cast the rest ────────────────────

function dbTool(id: string, overrides: Partial<Tool> = {}): Tool {
  return { id, ...overrides } as Tool;
}

function dbStack(id: string, overrides: Partial<Stack> = {}): Stack {
  return { id, ...overrides } as Stack;
}

// ── hydrateTool ───────────────────────────────────────────────────────────────

describe("hydrateTool", () => {
  it("merges scope, lifecycle_phases, archived from JSON when DB row is missing them", () => {
    const db = dbTool("cursor"); // raw DB shape — no new fields
    const json = new Map([
      [
        "cursor",
        { scope: "ai-native" as const, lifecycle_phases: ["coding" as const], archived: false },
      ],
    ]);
    const merged = hydrateTool(db, json);
    expect(merged.id).toBe("cursor");
    expect(merged.scope).toBe("ai-native");
    expect(merged.lifecycle_phases).toEqual(["coding"]);
    expect(merged.archived).toBe(false);
  });

  it("uses safe defaults when the tool is missing from JSON entirely (DB-only tool)", () => {
    const db = dbTool("ghost-tool");
    const merged = hydrateTool(db, new Map());
    expect(merged.scope).toBe("ai-native");
    expect(merged.lifecycle_phases).toEqual([]);
    expect(merged.archived).toBe(false);
  });

  it("respects DB value when DB row has the field defined (future-proof for column add)", () => {
    const db = dbTool("future-tool", {
      scope: "substrate",
      lifecycle_phases: ["specs"],
      archived: true,
    });
    const json = new Map([
      [
        "future-tool",
        {
          scope: "ai-native" as const,
          lifecycle_phases: ["coding" as const],
          archived: false,
        },
      ],
    ]);
    const merged = hydrateTool(db, json);
    // DB wins because it has the column populated
    expect(merged.scope).toBe("substrate");
    expect(merged.lifecycle_phases).toEqual(["specs"]);
    expect(merged.archived).toBe(true);
  });

  it("preserves all other DB fields unchanged", () => {
    const db = dbTool("cursor", {
      name: "Cursor",
      tagline: "fast",
      category: "coding-assistants",
    });
    const merged = hydrateTool(db, new Map());
    expect(merged.name).toBe("Cursor");
    expect(merged.tagline).toBe("fast");
    expect(merged.category).toBe("coding-assistants");
  });

  it("does not mutate the input DB row", () => {
    const db = dbTool("cursor");
    const before = { ...db };
    hydrateTool(db, new Map());
    expect(db).toEqual(before);
  });

  it("archived defaults to false (not undefined) so consumers can check === true safely", () => {
    const merged = hydrateTool(dbTool("x"), new Map());
    expect(merged.archived).toBe(false);
  });
});

// ── hydrateTools (batch) ──────────────────────────────────────────────────────

describe("hydrateTools", () => {
  it("hydrates each row using the JSON list as the source", () => {
    const dbRows = [dbTool("a"), dbTool("b"), dbTool("c")];
    const jsonRows = [
      { id: "a", scope: "ai-native" as const, lifecycle_phases: ["coding" as const] },
      { id: "b", scope: "substrate" as const, lifecycle_phases: ["specs" as const] },
      // c missing from JSON — hydrator falls back to defaults
    ];
    const merged = hydrateTools(dbRows, jsonRows);
    expect(merged[0].lifecycle_phases).toEqual(["coding"]);
    expect(merged[1].scope).toBe("substrate");
    expect(merged[2].lifecycle_phases).toEqual([]);
    expect(merged[2].scope).toBe("ai-native");
  });

  it("preserves order from the DB rows", () => {
    const dbRows = [dbTool("c"), dbTool("a"), dbTool("b")];
    const jsonRows = [
      { id: "a", scope: "ai-native" as const, lifecycle_phases: [] },
      { id: "b", scope: "ai-native" as const, lifecycle_phases: [] },
      { id: "c", scope: "ai-native" as const, lifecycle_phases: [] },
    ];
    const merged = hydrateTools(dbRows, jsonRows);
    expect(merged.map((t) => t.id)).toEqual(["c", "a", "b"]);
  });

  it("returns an empty array for empty input", () => {
    expect(hydrateTools([], [])).toEqual([]);
  });
});

// ── hydrateStack ──────────────────────────────────────────────────────────────

describe("hydrateStack", () => {
  it("merges track + phases from JSON when DB row is missing them", () => {
    const db = dbStack("indie-hacker");
    const json = new Map([
      [
        "indie-hacker",
        { track: "specialized" as const, phases: ["coding" as const, "design" as const] },
      ],
    ]);
    const merged = hydrateStack(db, json);
    expect(merged.track).toBe("specialized");
    expect(merged.phases).toEqual(["coding", "design"]);
  });

  it("uses safe defaults when stack is missing from JSON", () => {
    const merged = hydrateStack(dbStack("ghost-stack"), new Map());
    expect(merged.track).toBe("specialized");
    expect(merged.phases).toEqual([]);
  });

  it("respects DB value when DB has track + phases populated", () => {
    const db = dbStack("future-stack", {
      track: "development",
      phases: ["coding", "code-review"],
    });
    const json = new Map([
      ["future-stack", { track: "specialized" as const, phases: ["specs" as const] }],
    ]);
    const merged = hydrateStack(db, json);
    expect(merged.track).toBe("development");
    expect(merged.phases).toEqual(["coding", "code-review"]);
  });

  it("preserves all other DB fields unchanged", () => {
    const db = dbStack("indie-hacker", {
      name: "Indie Hacker",
      cluster: "build",
    });
    const merged = hydrateStack(db, new Map());
    expect(merged.name).toBe("Indie Hacker");
    expect(merged.cluster).toBe("build");
  });

  it("track defaults to 'specialized' so filter chips don't crash", () => {
    const merged = hydrateStack(dbStack("x"), new Map());
    expect(merged.track).toBe("specialized");
  });
});

// ── hydrateStacks (batch) ─────────────────────────────────────────────────────

describe("hydrateStacks", () => {
  it("hydrates each stack from the JSON list", () => {
    const dbRows = [dbStack("a"), dbStack("b")];
    const jsonRows = [
      { id: "a", track: "development" as const, phases: ["coding" as const] },
      { id: "b", track: "runtime" as const, phases: ["providers" as const] },
    ];
    const merged = hydrateStacks(dbRows, jsonRows);
    expect(merged[0].track).toBe("development");
    expect(merged[1].track).toBe("runtime");
  });

  it("returns an empty array for empty input", () => {
    expect(hydrateStacks([], [])).toEqual([]);
  });
});
