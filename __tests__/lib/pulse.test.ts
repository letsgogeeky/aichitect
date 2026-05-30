import { describe, it, expect } from "vitest";
import { summarizeIncidents } from "@/lib/pulse";
import type { ToolIncident } from "@/lib/pulse";

function incident(overrides: Partial<ToolIncident> = {}): ToolIncident {
  return {
    id: "fake-id",
    title: "Elevated errors",
    severity: "minor",
    started_at: "2026-05-20T00:00:00Z",
    ended_at: "2026-05-20T01:00:00Z",
    url: "https://status.example.com/incidents/x",
    ...overrides,
  };
}

describe("summarizeIncidents", () => {
  it("returns zeroed counts for an empty list", () => {
    const s = summarizeIncidents([]);
    expect(s.total_90d).toBe(0);
    expect(s.major_or_worse_90d).toBe(0);
    expect(s.ongoing).toBe(0);
    expect(s.last_major_at).toBeNull();
    expect(s.recent).toEqual([]);
  });

  it("counts total incidents regardless of severity", () => {
    const s = summarizeIncidents([
      incident({ id: "1", severity: "minor" }),
      incident({ id: "2", severity: "major" }),
      incident({ id: "3", severity: "none" }),
    ]);
    expect(s.total_90d).toBe(3);
  });

  it("counts major and critical toward major_or_worse_90d but not minor or none", () => {
    const s = summarizeIncidents([
      incident({ id: "1", severity: "minor" }),
      incident({ id: "2", severity: "major" }),
      incident({ id: "3", severity: "critical" }),
      incident({ id: "4", severity: "none" }),
    ]);
    expect(s.major_or_worse_90d).toBe(2);
  });

  it("counts ongoing as incidents with ended_at === null", () => {
    const s = summarizeIncidents([
      incident({ id: "1", ended_at: null }),
      incident({ id: "2", ended_at: "2026-05-20T01:00:00Z" }),
      incident({ id: "3", ended_at: null }),
    ]);
    expect(s.ongoing).toBe(2);
  });

  it("picks last_major_at from the FIRST major-or-worse entry (input is newest-first)", () => {
    const s = summarizeIncidents([
      incident({ id: "1", severity: "minor", started_at: "2026-05-29T00:00:00Z" }),
      incident({ id: "2", severity: "major", started_at: "2026-05-20T00:00:00Z" }),
      incident({ id: "3", severity: "critical", started_at: "2026-05-10T00:00:00Z" }),
    ]);
    expect(s.last_major_at).toBe("2026-05-20T00:00:00Z");
  });

  it("returns last_major_at=null when there are only minor/none incidents", () => {
    const s = summarizeIncidents([
      incident({ id: "1", severity: "minor" }),
      incident({ id: "2", severity: "none" }),
    ]);
    expect(s.last_major_at).toBeNull();
  });

  it("returns at most 3 recent incidents, preserving input order", () => {
    const s = summarizeIncidents([
      incident({ id: "1" }),
      incident({ id: "2" }),
      incident({ id: "3" }),
      incident({ id: "4" }),
      incident({ id: "5" }),
    ]);
    expect(s.recent.map((i) => i.id)).toEqual(["1", "2", "3"]);
  });

  it("returns all incidents under the cap (no padding)", () => {
    const s = summarizeIncidents([incident({ id: "1" }), incident({ id: "2" })]);
    expect(s.recent.map((i) => i.id)).toEqual(["1", "2"]);
  });

  it("counts an ongoing major incident in both ongoing AND major_or_worse_90d", () => {
    const s = summarizeIncidents([incident({ id: "1", severity: "major", ended_at: null })]);
    expect(s.major_or_worse_90d).toBe(1);
    expect(s.ongoing).toBe(1);
    expect(s.last_major_at).toBe("2026-05-20T00:00:00Z");
  });
});
