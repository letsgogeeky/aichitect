import { describe, it, expect } from "vitest";
import { COMPLEXITY_META } from "@/app/stacks/stacksConstants";

describe("COMPLEXITY_META", () => {
  const LEVELS = ["beginner", "intermediate", "advanced"] as const;

  it("defines an entry for every complexity level", () => {
    for (const level of LEVELS) {
      expect(COMPLEXITY_META[level]).toBeDefined();
    }
  });

  it("every entry has a non-empty label", () => {
    for (const level of LEVELS) {
      expect(COMPLEXITY_META[level].label.length).toBeGreaterThan(0);
    }
  });

  it("every entry has a valid hex color", () => {
    const hexRe = /^#[0-9a-f]{6}$/i;
    for (const level of LEVELS) {
      const { color } = COMPLEXITY_META[level];
      expect(hexRe.test(color), `COMPLEXITY_META.${level}.color = "${color}" is not hex`).toBe(
        true
      );
    }
  });

  it("all three complexity levels have distinct colors", () => {
    const colors = LEVELS.map((l) => COMPLEXITY_META[l].color);
    const unique = new Set(colors);
    expect(unique.size).toBe(3);
  });
});
