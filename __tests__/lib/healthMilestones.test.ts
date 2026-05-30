import { describe, it, expect } from "vitest";
import { selectCrossedMilestones, STAR_MILESTONES } from "@/lib/healthMilestones";

describe("selectCrossedMilestones", () => {
  it("returns an empty array when no milestones are crossed", () => {
    expect(selectCrossedMilestones(900, 950)).toEqual([]);
    expect(selectCrossedMilestones(1500, 1600)).toEqual([]);
  });

  it("returns a single milestone when one is crossed exactly", () => {
    expect(selectCrossedMilestones(999, 1000)).toEqual([1000]);
    expect(selectCrossedMilestones(4999, 5000)).toEqual([5000]);
  });

  it("returns the milestone for any jump above the threshold", () => {
    expect(selectCrossedMilestones(800, 1200)).toEqual([1000]);
  });

  it("returns multiple milestones when a fast grower crosses several at once", () => {
    expect(selectCrossedMilestones(800, 6000)).toEqual([1000, 5000]);
  });

  it("returns all defined milestones when the baseline is well below the lowest", () => {
    expect(selectCrossedMilestones(0, 200_000)).toEqual([1000, 5000, 10000, 25000, 50000, 100000]);
  });

  it("treats null baseline as 0 — first-sight tools fire historical milestones", () => {
    expect(selectCrossedMilestones(null, 12_000)).toEqual([1000, 5000, 10000]);
  });

  it("treats undefined baseline as 0", () => {
    expect(selectCrossedMilestones(undefined, 1500)).toEqual([1000]);
  });

  it("does not fire on a star decline (never re-fires when stars drop)", () => {
    expect(selectCrossedMilestones(5500, 4900)).toEqual([]);
    expect(selectCrossedMilestones(5500, 5000)).toEqual([]);
  });

  it("excludes a milestone the baseline already sits exactly on (no double-fire)", () => {
    expect(selectCrossedMilestones(1000, 1100)).toEqual([]);
    expect(selectCrossedMilestones(5000, 5100)).toEqual([]);
  });

  it("includes a milestone when curr equals it exactly", () => {
    expect(selectCrossedMilestones(999, 1000)).toEqual([1000]);
    expect(selectCrossedMilestones(99_999, 100_000)).toEqual([100_000]);
  });

  it("uses STAR_MILESTONES by default — list is non-empty and ascending", () => {
    expect(STAR_MILESTONES.length).toBeGreaterThan(0);
    for (let i = 1; i < STAR_MILESTONES.length; i++) {
      expect(STAR_MILESTONES[i]).toBeGreaterThan(STAR_MILESTONES[i - 1]);
    }
  });

  it("accepts a custom milestone list", () => {
    expect(selectCrossedMilestones(50, 150, [100, 200, 300])).toEqual([100]);
    expect(selectCrossedMilestones(50, 350, [100, 200, 300])).toEqual([100, 200, 300]);
  });

  it("returns an empty array when curr === baseline", () => {
    expect(selectCrossedMilestones(1500, 1500)).toEqual([]);
  });
});
