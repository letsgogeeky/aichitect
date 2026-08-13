import { describe, it, expect } from "vitest";
import { formatRelativeTime } from "@/lib/format";

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

describe("formatRelativeTime", () => {
  it("returns 'today' for now and for future timestamps (clock skew)", () => {
    expect(formatRelativeTime(isoDaysAgo(0))).toBe("today");
    expect(formatRelativeTime(isoDaysAgo(-3))).toBe("today");
  });

  it("returns 'yesterday' for 1 day ago", () => {
    expect(formatRelativeTime(isoDaysAgo(1))).toBe("yesterday");
  });

  it("returns singular 'year ago' at the 1-year boundary", () => {
    expect(formatRelativeTime(isoDaysAgo(365))).toBe("1 year ago");
    expect(formatRelativeTime(isoDaysAgo(400))).toBe("1 year ago");
  });

  it("returns plural 'years ago' beyond 1.5 years", () => {
    expect(formatRelativeTime(isoDaysAgo(800))).toBe("2 years ago");
  });
});
