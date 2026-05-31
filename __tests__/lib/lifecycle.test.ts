import { describe, it, expect } from "vitest";
import {
  LIFECYCLE_PHASE_LABEL,
  LIFECYCLE_PHASE_TRACK,
  PHASE_TRACK_COLOR,
  computeStackPhaseCoverage,
  computePhaseCoverage,
  getMissingPhasesByTrack,
  getSlotPhases,
  groupSlotsByPhase,
  classifyTrack,
} from "@/lib/lifecycle";
import { LIFECYCLE_PHASES, PHASES_BY_TRACK, type LifecyclePhase, type Tool } from "@/lib/types";

function makeTool(
  id: string,
  phases: LifecyclePhase[]
): Pick<Tool, "lifecycle_phases"> & { id: string } {
  return { id, lifecycle_phases: phases };
}

describe("LIFECYCLE_PHASE_LABEL", () => {
  it("has a label for every phase", () => {
    for (const phase of LIFECYCLE_PHASES) {
      expect(LIFECYCLE_PHASE_LABEL[phase]).toBeTruthy();
    }
  });

  it("labels are non-empty strings", () => {
    for (const phase of LIFECYCLE_PHASES) {
      expect(typeof LIFECYCLE_PHASE_LABEL[phase]).toBe("string");
      expect(LIFECYCLE_PHASE_LABEL[phase].length).toBeGreaterThan(0);
    }
  });
});

describe("LIFECYCLE_PHASE_TRACK", () => {
  it("classifies eval and observability as 'shared' (both tracks)", () => {
    expect(LIFECYCLE_PHASE_TRACK.eval).toBe("shared");
    expect(LIFECYCLE_PHASE_TRACK.observability).toBe("shared");
  });

  it("classifies requirements/specs/design/coding/code-review as 'development'", () => {
    expect(LIFECYCLE_PHASE_TRACK.requirements).toBe("development");
    expect(LIFECYCLE_PHASE_TRACK.specs).toBe("development");
    expect(LIFECYCLE_PHASE_TRACK.design).toBe("development");
    expect(LIFECYCLE_PHASE_TRACK.coding).toBe("development");
    expect(LIFECYCLE_PHASE_TRACK["code-review"]).toBe("development");
  });

  it("classifies providers/orchestration/retrieval-memory/tools-mcp/guardrails as 'runtime'", () => {
    expect(LIFECYCLE_PHASE_TRACK.providers).toBe("runtime");
    expect(LIFECYCLE_PHASE_TRACK.orchestration).toBe("runtime");
    expect(LIFECYCLE_PHASE_TRACK["retrieval-memory"]).toBe("runtime");
    expect(LIFECYCLE_PHASE_TRACK["tools-mcp"]).toBe("runtime");
    expect(LIFECYCLE_PHASE_TRACK.guardrails).toBe("runtime");
  });

  it("covers every phase (no orphans)", () => {
    for (const phase of LIFECYCLE_PHASES) {
      expect(["development", "runtime", "shared"]).toContain(LIFECYCLE_PHASE_TRACK[phase]);
    }
  });
});

describe("PHASE_TRACK_COLOR", () => {
  it("has a color for every track variant", () => {
    expect(PHASE_TRACK_COLOR.development).toMatch(/^#/);
    expect(PHASE_TRACK_COLOR.runtime).toMatch(/^#/);
    expect(PHASE_TRACK_COLOR.shared).toMatch(/^#/);
  });
});

describe("computeStackPhaseCoverage", () => {
  it("returns empty when stack has no tools", () => {
    const coverage = computeStackPhaseCoverage({ tools: [] }, new Map());
    expect(coverage.size).toBe(0);
  });

  it("unions phases across all tools in the stack", () => {
    const toolsById = new Map([
      ["a", makeTool("a", ["coding"])],
      ["b", makeTool("b", ["eval", "observability"])],
      ["c", makeTool("c", ["specs"])],
    ]);
    const coverage = computeStackPhaseCoverage({ tools: ["a", "b", "c"] }, toolsById);
    expect([...coverage].sort()).toEqual(["coding", "eval", "observability", "specs"]);
  });

  it("dedupes phases shared by multiple tools", () => {
    const toolsById = new Map([
      ["a", makeTool("a", ["coding"])],
      ["b", makeTool("b", ["coding", "code-review"])],
    ]);
    const coverage = computeStackPhaseCoverage({ tools: ["a", "b"] }, toolsById);
    expect(coverage.size).toBe(2);
    expect(coverage.has("coding")).toBe(true);
    expect(coverage.has("code-review")).toBe(true);
  });

  it("ignores tool IDs that don't exist in the map (gracefully)", () => {
    const toolsById = new Map([["a", makeTool("a", ["coding"])]]);
    const coverage = computeStackPhaseCoverage({ tools: ["a", "ghost"] }, toolsById);
    expect(coverage.size).toBe(1);
    expect(coverage.has("coding")).toBe(true);
  });
});

describe("getSlotPhases", () => {
  it("returns empty for a slot with no tools", () => {
    expect(getSlotPhases({ tools: [] }, new Map())).toEqual([]);
  });

  it("returns the union of all tool phases in canonical order", () => {
    const toolsById = new Map([
      ["a", makeTool("a", ["observability"])],
      ["b", makeTool("b", ["coding"])],
      ["c", makeTool("c", ["specs"])],
    ]);
    // canonical order: specs comes before coding which comes before observability
    expect(getSlotPhases({ tools: ["a", "b", "c"] }, toolsById)).toEqual([
      "specs",
      "coding",
      "observability",
    ]);
  });

  it("dedupes phases when multiple tools share the same one", () => {
    const toolsById = new Map([
      ["a", makeTool("a", ["coding"])],
      ["b", makeTool("b", ["coding"])],
      ["c", makeTool("c", ["coding"])],
    ]);
    expect(getSlotPhases({ tools: ["a", "b", "c"] }, toolsById)).toEqual(["coding"]);
  });
});

describe("groupSlotsByPhase", () => {
  it("buckets each slot under its first phase in canonical order", () => {
    const toolsById = new Map([
      ["a", makeTool("a", ["coding"])],
      ["b", makeTool("b", ["specs"])],
      ["c", makeTool("c", ["coding"])],
    ]);
    const slots = [
      { id: "s1", tools: ["a"] },
      { id: "s2", tools: ["b"] },
      { id: "s3", tools: ["c"] },
    ];
    const grouped = groupSlotsByPhase(slots, toolsById);
    expect(grouped).toEqual([
      { phase: "specs", slots: [{ id: "s2", tools: ["b"] }] },
      {
        phase: "coding",
        slots: [
          { id: "s1", tools: ["a"] },
          { id: "s3", tools: ["c"] },
        ],
      },
    ]);
  });

  it("drops slots whose tools have no phases", () => {
    const toolsById = new Map([["a", makeTool("a", ["coding"])]]);
    const slots = [
      { id: "s1", tools: ["a"] },
      { id: "s2", tools: ["missing"] },
    ];
    const grouped = groupSlotsByPhase(slots, toolsById);
    expect(grouped).toEqual([{ phase: "coding", slots: [{ id: "s1", tools: ["a"] }] }]);
  });

  it("returns groups in canonical phase order regardless of input order", () => {
    const toolsById = new Map([
      ["a", makeTool("a", ["observability"])],
      ["b", makeTool("b", ["requirements"])],
      ["c", makeTool("c", ["providers"])],
    ]);
    const slots = [
      { id: "s1", tools: ["a"] },
      { id: "s2", tools: ["b"] },
      { id: "s3", tools: ["c"] },
    ];
    const grouped = groupSlotsByPhase(slots, toolsById);
    expect(grouped.map((g) => g.phase)).toEqual(["requirements", "providers", "observability"]);
  });
});

describe("computePhaseCoverage", () => {
  it("returns empty for an empty tool ID list", () => {
    expect(computePhaseCoverage([], new Map()).size).toBe(0);
  });

  it("ignores null/undefined entries (Builder passes Object.values(selected))", () => {
    const toolsById = new Map([["a", makeTool("a", ["coding"])]]);
    const covered = computePhaseCoverage(["a", null, undefined, ""], toolsById);
    expect([...covered]).toEqual(["coding"]);
  });

  it("unions phases across tools", () => {
    const toolsById = new Map([
      ["a", makeTool("a", ["coding"])],
      ["b", makeTool("b", ["specs", "design"])],
    ]);
    const covered = computePhaseCoverage(["a", "b"], toolsById);
    expect([...covered].sort()).toEqual(["coding", "design", "specs"]);
  });

  it("ignores tool IDs missing from the map", () => {
    const toolsById = new Map([["a", makeTool("a", ["coding"])]]);
    const covered = computePhaseCoverage(["a", "ghost"], toolsById);
    expect([...covered]).toEqual(["coding"]);
  });
});

describe("getMissingPhasesByTrack", () => {
  it("returns all phases as missing when nothing is covered", () => {
    const missing = getMissingPhasesByTrack(new Set());
    expect(missing.development).toEqual([...PHASES_BY_TRACK.development]);
    expect(missing.runtime).toEqual([...PHASES_BY_TRACK.runtime]);
  });

  it("returns empty arrays when both tracks are fully covered", () => {
    const covered = new Set<LifecyclePhase>(LIFECYCLE_PHASES);
    const missing = getMissingPhasesByTrack(covered);
    expect(missing.development).toEqual([]);
    expect(missing.runtime).toEqual([]);
  });

  it("correctly excludes only the phases in the covered set", () => {
    const covered = new Set<LifecyclePhase>(["coding", "providers", "eval"]);
    const missing = getMissingPhasesByTrack(covered);
    expect(missing.development).not.toContain("coding");
    expect(missing.development).not.toContain("eval");
    expect(missing.runtime).not.toContain("providers");
    expect(missing.runtime).not.toContain("eval");
  });

  it("eval covered → removed from BOTH track missing lists", () => {
    const missing = getMissingPhasesByTrack(new Set(["eval"]));
    expect(missing.development).not.toContain("eval");
    expect(missing.runtime).not.toContain("eval");
  });

  it("preserves canonical phase order in missing lists", () => {
    const missing = getMissingPhasesByTrack(new Set(["specs"]));
    // dev track without specs: requirements, design, coding, code-review, eval, observability
    expect(missing.development).toEqual([
      "requirements",
      "design",
      "coding",
      "code-review",
      "eval",
      "observability",
    ]);
  });
});

describe("classifyTrack", () => {
  it("returns 'development' for ≥2 dev-only with ≤1 runtime-only", () => {
    expect(classifyTrack(["specs", "coding"])).toBe("development");
    expect(classifyTrack(["requirements", "specs", "design", "eval"])).toBe("development");
    expect(classifyTrack(["specs", "coding", "providers"])).toBe("development"); // 1 runtime ok
  });

  it("returns 'runtime' for ≥3 runtime-only with ≤1 dev-only", () => {
    expect(classifyTrack(["providers", "orchestration", "retrieval-memory"])).toBe("runtime");
    expect(classifyTrack(["providers", "orchestration", "guardrails", "eval"])).toBe("runtime");
    expect(classifyTrack(["providers", "orchestration", "guardrails", "coding"])).toBe("runtime"); // 1 dev ok
  });

  it("returns 'specialized' when stack mixes 2+ dev with 2+ runtime", () => {
    expect(classifyTrack(["coding", "design", "providers", "orchestration"])).toBe("specialized");
  });

  it("returns 'specialized' for narrow stacks (single phase)", () => {
    expect(classifyTrack(["coding"])).toBe("specialized");
    expect(classifyTrack(["providers"])).toBe("specialized");
    expect(classifyTrack(["eval", "observability"])).toBe("specialized");
  });

  it("returns 'specialized' for an empty phase set", () => {
    expect(classifyTrack([])).toBe("specialized");
  });
});
