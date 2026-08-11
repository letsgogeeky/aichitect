import { describe, it, expect } from "vitest";
import {
  getCategoryColor,
  getReadableTextColor,
  CATEGORIES,
  LIFECYCLE_PHASES,
  LIFECYCLE_TRACKS,
  PHASES_BY_TRACK,
} from "@/lib/types";
import type { CategoryId, LifecyclePhase } from "@/lib/types";

function relativeLuminance(hex: string): number {
  const h = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrastRatio(hexA: string, hexB: string): number {
  const [l1, l2] = [relativeLuminance(hexA), relativeLuminance(hexB)].sort((a, b) => b - a);
  return (l1 + 0.05) / (l2 + 0.05);
}

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

describe("getReadableTextColor", () => {
  // Regression test: a solid category-colored button/badge paired with a
  // fixed "#fff" text color was found to fail WCAG AA for 15 of 16
  // category colors (as low as 1.45:1). This asserts every category color
  // actually gets a text color choice that clears 4.5:1 — not just that
  // the function returns *something*.
  it("picks a text color that clears 4.5:1 contrast for every category color", () => {
    for (const cat of CATEGORIES) {
      const textColor = getReadableTextColor(cat.color);
      const resolved = textColor === "var(--bg)" ? "#0a0a0f" : textColor;
      const ratio = contrastRatio(cat.color, resolved);
      expect(
        ratio,
        `${cat.id} (${cat.color}) only got ${ratio.toFixed(2)}:1`
      ).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("picks dark text for a light background and light text for a dark one", () => {
    expect(getReadableTextColor("#fdcb6e")).toBe("var(--bg)");
    expect(getReadableTextColor("#6c5ce7")).toBe("#ffffff");
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
