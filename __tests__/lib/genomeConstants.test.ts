import { describe, it, expect } from "vitest";
import {
  INPUT_TABS,
  WORKFLOW_GROUPS,
  PRIORITY_COLOR,
  type InputTab,
} from "@/app/genome/genomeConstants";

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

// ─── WORKFLOW_GROUPS ─────────────────────────────────────────────────────────

describe("WORKFLOW_GROUPS", () => {
  it("has seven groups", () => {
    expect(WORKFLOW_GROUPS).toHaveLength(7);
  });

  it("every group has a label and at least one tool id", () => {
    for (const group of WORKFLOW_GROUPS) {
      expect(group.label.length).toBeGreaterThan(0);
      expect(group.toolIds.length).toBeGreaterThan(0);
    }
  });

  it("no tool id appears in more than one group", () => {
    const seen = new Set<string>();
    for (const group of WORKFLOW_GROUPS) {
      for (const id of group.toolIds) {
        expect(seen.has(id), `Duplicate tool id "${id}" in WORKFLOW_GROUPS`).toBe(false);
        seen.add(id);
      }
    }
  });

  it("contains expected group labels", () => {
    const labels = WORKFLOW_GROUPS.map((g) => g.label);
    expect(labels).toContain("Code editor");
    expect(labels).toContain("CLI agent");
    expect(labels).toContain("Autonomous agent");
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
