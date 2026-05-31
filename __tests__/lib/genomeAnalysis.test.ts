import { describe, it, expect } from "vitest";
import { computeTrackScores } from "@/lib/genomeAnalysis";
import { PHASES_BY_TRACK, type LifecyclePhase, type Tool } from "@/lib/types";

function toolWith(phases: LifecyclePhase[]): Pick<Tool, "lifecycle_phases"> {
  return { lifecycle_phases: phases };
}

describe("computeTrackScores", () => {
  it("returns zeros for an empty tool list", () => {
    const { development, runtime } = computeTrackScores([]);
    expect(development.covered).toBe(0);
    expect(development.score).toBe(0);
    expect(development.missingPhases).toEqual([...PHASES_BY_TRACK.development]);
    expect(runtime.covered).toBe(0);
    expect(runtime.score).toBe(0);
    expect(runtime.missingPhases).toEqual([...PHASES_BY_TRACK.runtime]);
  });

  it("counts a tool toward the correct track", () => {
    const { development, runtime } = computeTrackScores([toolWith(["coding"])]);
    expect(development.covered).toBe(1);
    expect(development.coveredPhases).toEqual(["coding"]);
    expect(runtime.covered).toBe(0);
  });

  it("eval counts toward BOTH dev and runtime tracks", () => {
    const { development, runtime } = computeTrackScores([toolWith(["eval"])]);
    expect(development.coveredPhases).toContain("eval");
    expect(runtime.coveredPhases).toContain("eval");
  });

  it("observability counts toward BOTH dev and runtime tracks", () => {
    const { development, runtime } = computeTrackScores([toolWith(["observability"])]);
    expect(development.coveredPhases).toContain("observability");
    expect(runtime.coveredPhases).toContain("observability");
  });

  it("dedupes phases shared by multiple tools (each phase counted once)", () => {
    const tools = [toolWith(["coding"]), toolWith(["coding", "code-review"]), toolWith(["coding"])];
    const { development } = computeTrackScores(tools);
    expect(development.covered).toBe(2);
    expect(development.coveredPhases.sort()).toEqual(["code-review", "coding"]);
  });

  it("computes 100 when all 7 dev phases are covered", () => {
    const tools = PHASES_BY_TRACK.development.map((p) => toolWith([p]));
    const { development } = computeTrackScores(tools);
    expect(development.covered).toBe(7);
    expect(development.score).toBe(100);
    expect(development.missingPhases).toEqual([]);
  });

  it("computes 100 when all 7 runtime phases are covered", () => {
    const tools = PHASES_BY_TRACK.runtime.map((p) => toolWith([p]));
    const { runtime } = computeTrackScores(tools);
    expect(runtime.covered).toBe(7);
    expect(runtime.score).toBe(100);
    expect(runtime.missingPhases).toEqual([]);
  });

  it("score is rounded to integer percent", () => {
    // 3 / 7 = 42.857...
    const { development } = computeTrackScores([
      toolWith(["coding"]),
      toolWith(["specs"]),
      toolWith(["design"]),
    ]);
    expect(development.covered).toBe(3);
    expect(development.score).toBe(43);
  });

  it("dev-only repo: high dev score, low runtime score", () => {
    const { development, runtime } = computeTrackScores([
      toolWith(["requirements"]),
      toolWith(["coding"]),
      toolWith(["code-review"]),
      toolWith(["specs"]),
    ]);
    expect(development.covered).toBe(4);
    expect(development.score).toBeGreaterThanOrEqual(55);
    expect(runtime.covered).toBe(0);
    expect(runtime.score).toBe(0);
  });

  it("runtime-only repo: high runtime score, low dev score", () => {
    const { development, runtime } = computeTrackScores([
      toolWith(["providers"]),
      toolWith(["orchestration"]),
      toolWith(["retrieval-memory"]),
      toolWith(["guardrails"]),
    ]);
    expect(runtime.covered).toBe(4);
    expect(runtime.score).toBeGreaterThanOrEqual(55);
    expect(development.covered).toBe(0);
    expect(development.score).toBe(0);
  });

  it("balanced repo: both scores meaningful", () => {
    const { development, runtime } = computeTrackScores([
      toolWith(["coding"]),
      toolWith(["specs"]),
      toolWith(["providers"]),
      toolWith(["orchestration"]),
      toolWith(["eval"]),
      toolWith(["observability"]),
    ]);
    // Dev: coding, specs, eval, observability = 4/7
    expect(development.covered).toBe(4);
    // Runtime: providers, orchestration, eval, observability = 4/7
    expect(runtime.covered).toBe(4);
  });

  it("missingPhases preserves canonical order", () => {
    // Cover middle phases, miss bookends
    const { development } = computeTrackScores([
      toolWith(["specs"]),
      toolWith(["coding"]),
      toolWith(["code-review"]),
    ]);
    // requirements should come first, design should come second among missing
    const expectedMissing = ["requirements", "design", "eval", "observability"];
    expect(development.missingPhases).toEqual(expectedMissing);
  });

  it("ignores phases on tools that aren't in either track (defensive)", () => {
    // No phase should fall outside the two tracks given the canonical enum,
    // but verify the function doesn't crash if someone hand-rolls a tool.
    const { development, runtime } = computeTrackScores([
      toolWith(["coding"]),
      toolWith(["providers"]),
    ]);
    expect(development.covered).toBe(1);
    expect(runtime.covered).toBe(1);
  });
});
