import { describe, it, expect } from "vitest";
import { getCategoryColor, CATEGORIES } from "@/lib/types";
import type { CategoryId } from "@/lib/types";

describe("getCategoryColor", () => {
  it("returns the correct color for every defined category", () => {
    for (const cat of CATEGORIES) {
      expect(getCategoryColor(cat.id)).toBe(cat.color);
    }
  });

  it("returns the fallback color for an unknown id", () => {
    expect(getCategoryColor("unknown-category" as CategoryId)).toBe("#555577");
  });
});
