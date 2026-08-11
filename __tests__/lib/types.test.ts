import { describe, it, expect } from "vitest";
import {
  getCategoryColor,
  CATEGORIES,
  LIFECYCLE_PHASES,
  LIFECYCLE_TRACKS,
  PHASES_BY_TRACK,
} from "@/lib/types";
import type { CategoryId, LifecyclePhase } from "@/lib/types";

describe("getCategoryColor", () => {
  it("returns the correct color for every defined category", () => {
    for (const cat of CATEGORIES) {
      expect(getCategoryColor(cat.id)).toBe(cat.color);
    }
  });

  it("returns the fallback color for an unknown id", () => {
    expect(getCategoryColor("unknown-category" as CategoryId)).toBe("#7f7fa4");
  });
});

describe("CATEGORIES", () => {
  it("has unique ids", () => {
    const ids = CATEGORIES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("renamed devops to AI-Augmented Code Quality (PR 1 scope narrowing)", () => {
    const devops = CATEGORIES.find((c) => c.id === "devops");
    expect(devops?.label).toBe("AI-Augmented Code Quality");
  });
});

describe("LIFECYCLE_PHASES", () => {
  it("contains exactly 12 canonical phases", () => {
    expect(LIFECYCLE_PHASES.length).toBe(12);
  });

  it("has no duplicates", () => {
    expect(new Set(LIFECYCLE_PHASES).size).toBe(LIFECYCLE_PHASES.length);
  });

  it("includes both dev-only and runtime-only phases", () => {
    expect(LIFECYCLE_PHASES).toContain("requirements");
    expect(LIFECYCLE_PHASES).toContain("code-review");
    expect(LIFECYCLE_PHASES).toContain("providers");
    expect(LIFECYCLE_PHASES).toContain("orchestration");
  });

  it("includes eval and observability — both span tracks", () => {
    expect(LIFECYCLE_PHASES).toContain("eval");
    expect(LIFECYCLE_PHASES).toContain("observability");
  });
});

describe("LIFECYCLE_TRACKS", () => {
  it("contains development, runtime, specialized", () => {
    expect([...LIFECYCLE_TRACKS]).toEqual(["development", "runtime", "specialized"]);
  });
});

describe("PHASES_BY_TRACK", () => {
  it("every phase in PHASES_BY_TRACK exists in LIFECYCLE_PHASES", () => {
    const allPhases = new Set<LifecyclePhase>(LIFECYCLE_PHASES);
    for (const phase of PHASES_BY_TRACK.development) expect(allPhases.has(phase)).toBe(true);
    for (const phase of PHASES_BY_TRACK.runtime) expect(allPhases.has(phase)).toBe(true);
  });

  it("eval is in both development and runtime tracks", () => {
    expect(PHASES_BY_TRACK.development).toContain("eval");
    expect(PHASES_BY_TRACK.runtime).toContain("eval");
  });

  it("observability is in both development and runtime tracks", () => {
    expect(PHASES_BY_TRACK.development).toContain("observability");
    expect(PHASES_BY_TRACK.runtime).toContain("observability");
  });

  it("requirements is dev-only", () => {
    expect(PHASES_BY_TRACK.development).toContain("requirements");
    expect(PHASES_BY_TRACK.runtime).not.toContain("requirements");
  });

  it("providers is runtime-only", () => {
    expect(PHASES_BY_TRACK.runtime).toContain("providers");
    expect(PHASES_BY_TRACK.development).not.toContain("providers");
  });

  it("union of dev and runtime covers all 12 phases (so no phase is orphaned)", () => {
    const union = new Set<LifecyclePhase>([
      ...PHASES_BY_TRACK.development,
      ...PHASES_BY_TRACK.runtime,
    ]);
    expect(union.size).toBe(LIFECYCLE_PHASES.length);
  });
});
