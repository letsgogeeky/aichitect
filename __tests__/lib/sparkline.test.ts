import { describe, it, expect } from "vitest";
import { computeSparklinePath } from "@/lib/sparkline";

const OPTS = { width: 200, height: 40, padding: 2 };

describe("computeSparklinePath", () => {
  it("returns path=null for an empty series", () => {
    const geom = computeSparklinePath([], OPTS);
    expect(geom.path).toBeNull();
    expect(geom.pointCount).toBe(0);
  });

  it("returns path=null for a single point — can't draw a line", () => {
    const geom = computeSparklinePath([500], OPTS);
    expect(geom.path).toBeNull();
    expect(geom.pointCount).toBe(1);
  });

  it("filters null and zero entries (AA returns 0 for unmeasured)", () => {
    const geom = computeSparklinePath([null, 0, 400, null, 600, 0], OPTS);
    expect(geom.pointCount).toBe(2);
    expect(geom.firstValue).toBe(400);
    expect(geom.lastValue).toBe(600);
  });

  it("returns path=null when only one value survives filtering", () => {
    const geom = computeSparklinePath([null, 0, 500], OPTS);
    expect(geom.path).toBeNull();
    expect(geom.pointCount).toBe(1);
  });

  it("emits an SVG path with one M and N-1 L commands", () => {
    const geom = computeSparklinePath([100, 200, 300, 400], OPTS);
    expect(geom.path).not.toBeNull();
    const moves = geom.path!.match(/M/g) ?? [];
    const lines = geom.path!.match(/L/g) ?? [];
    expect(moves.length).toBe(1);
    expect(lines.length).toBe(3);
  });

  it("anchors the first point at left padding and the last at width - padding", () => {
    const geom = computeSparklinePath([100, 500], { width: 200, height: 40, padding: 2 });
    // First M at x=2, last L at x=198
    expect(geom.path).toMatch(/^M 2.0 /);
    expect(geom.path).toMatch(/L 198\.0 /);
  });

  it("flags trendUp=true when latest > first (worse latency)", () => {
    const geom = computeSparklinePath([100, 200, 600], OPTS);
    expect(geom.trendUp).toBe(true);
  });

  it("flags trendUp=false when latest < first (improving latency)", () => {
    const geom = computeSparklinePath([600, 400, 100], OPTS);
    expect(geom.trendUp).toBe(false);
  });

  it("trendUp=false on a flat series (no change is not 'up')", () => {
    const geom = computeSparklinePath([500, 500, 500], OPTS);
    expect(geom.trendUp).toBe(false);
  });

  it("does not divide by zero on a flat series — path is valid", () => {
    const geom = computeSparklinePath([500, 500, 500], OPTS);
    expect(geom.path).not.toBeNull();
    expect(geom.path).not.toContain("NaN");
    expect(geom.path).not.toContain("Infinity");
  });

  it("reports correct min/max", () => {
    const geom = computeSparklinePath([300, 100, 500, 200], OPTS);
    expect(geom.min).toBe(100);
    expect(geom.max).toBe(500);
  });

  it("respects custom padding", () => {
    const geom = computeSparklinePath([100, 200], { width: 100, height: 20, padding: 5 });
    expect(geom.path).toMatch(/^M 5.0 /);
    expect(geom.path).toMatch(/L 95\.0 /);
  });

  it("defaults padding to 2 when omitted", () => {
    const geom = computeSparklinePath([100, 200], { width: 100, height: 20 });
    expect(geom.path).toMatch(/^M 2.0 /);
    expect(geom.path).toMatch(/L 98\.0 /);
  });

  it("y-coordinate of the max value sits at the top edge (height - padding for max)", () => {
    const geom = computeSparklinePath([100, 500], { width: 200, height: 40, padding: 2 });
    // 500 is the max, so its y = padding = 2.0
    expect(geom.path).toContain("L 198.0 2.0");
  });

  it("y-coordinate of the min value sits at the bottom (height - padding)", () => {
    const geom = computeSparklinePath([100, 500], { width: 200, height: 40, padding: 2 });
    // 100 is the min, so its y = height - padding = 38.0
    expect(geom.path).toContain("M 2.0 38.0");
  });
});
