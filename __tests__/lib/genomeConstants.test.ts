import { describe, it, expect } from "vitest";
import { INPUT_TABS, PRIORITY_COLOR, type InputTab } from "@/app/genome/genomeConstants";

// ─── INPUT_TABS ─────────────────────────────────────────────────────────────

describe("INPUT_TABS", () => {
  const EXPECTED_IDS: InputTab[] = [
    "package.json",
    "requirements.txt",
    "pyproject.toml",
    ".env.example",
  ];

  it("covers all four dependency file types", () => {
    const ids = INPUT_TABS.map((t) => t.id);
    expect(ids).toEqual(EXPECTED_IDS);
  });

  it("every tab has a non-empty label and placeholder", () => {
    for (const tab of INPUT_TABS) {
      expect(tab.label.length).toBeGreaterThan(0);
      expect(tab.placeholder.length).toBeGreaterThan(0);
    }
  });

  it("tab ids match their labels", () => {
    for (const tab of INPUT_TABS) {
      expect(tab.label).toBe(tab.id);
    }
  });
});

// ─── PRIORITY_COLOR ──────────────────────────────────────────────────────────

describe("PRIORITY_COLOR", () => {
  it("defines a color for every slot priority level", () => {
    expect(PRIORITY_COLOR.required).toBeDefined();
    expect(PRIORITY_COLOR.recommended).toBeDefined();
    expect(PRIORITY_COLOR.optional).toBeDefined();
    expect(PRIORITY_COLOR["not-applicable"]).toBeDefined();
  });

  it("all values are valid hex color strings", () => {
    const hexRe = /^#[0-9a-f]{6}$/i;
    for (const [priority, color] of Object.entries(PRIORITY_COLOR)) {
      expect(hexRe.test(color), `PRIORITY_COLOR.${priority} = "${color}" is not a hex color`).toBe(
        true
      );
    }
  });

  it("required is visually distinct from optional", () => {
    expect(PRIORITY_COLOR.required).not.toBe(PRIORITY_COLOR.optional);
  });
});
