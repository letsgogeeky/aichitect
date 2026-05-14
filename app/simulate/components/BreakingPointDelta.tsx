"use client";

import type { BreakingPoint } from "@/lib/simulate";

interface Props {
  currentFirstBreak: BreakingPoint | null;
  shadowFirstBreak: BreakingPoint | null;
}

function formatUsers(n: number): string {
  if (n >= 1_000_000) return `${n / 1_000_000}M users`;
  if (n >= 1_000) return `${n / 1_000}k users`;
  return `${n} users`;
}

export default function BreakingPointDelta({ currentFirstBreak, shadowFirstBreak }: Props) {
  if (!currentFirstBreak && !shadowFirstBreak) {
    return (
      <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
        Neither stack hits a breaking point in the projected scale range.
      </p>
    );
  }

  if (currentFirstBreak && !shadowFirstBreak) {
    return (
      <p style={{ fontSize: 13, color: "var(--text-primary)", lineHeight: 1.5 }}>
        Current stack first breaks at{" "}
        <strong style={{ color: "var(--danger)" }}>{formatUsers(currentFirstBreak.users)}</strong>.
        Shadow stack scales cleanly across the projected range.
      </p>
    );
  }

  if (!currentFirstBreak && shadowFirstBreak) {
    return (
      <p style={{ fontSize: 13, color: "var(--text-primary)", lineHeight: 1.5 }}>
        Shadow stack first breaks at{" "}
        <strong style={{ color: "var(--danger)" }}>{formatUsers(shadowFirstBreak.users)}</strong>.
        Current stack scales cleanly — the shadow doesn&apos;t buy you headroom.
      </p>
    );
  }

  // Both breaks
  const c = currentFirstBreak!;
  const s = shadowFirstBreak!;
  if (c.users === s.users) {
    return (
      <p style={{ fontSize: 13, color: "var(--text-primary)", lineHeight: 1.5 }}>
        Both stacks break at <strong>{formatUsers(c.users)}</strong> — no scaling headroom gained.
      </p>
    );
  }
  const winner = c.users < s.users ? "shadow" : "current";
  const headroom = Math.abs(s.users - c.users);

  return (
    <p style={{ fontSize: 13, color: "var(--text-primary)", lineHeight: 1.5 }}>
      Current stack first breaks at{" "}
      <strong style={{ color: "var(--danger)" }}>{formatUsers(c.users)}</strong>; shadow holds to{" "}
      <strong style={{ color: winner === "shadow" ? "var(--success)" : "var(--danger)" }}>
        {formatUsers(s.users)}
      </strong>
      .{" "}
      <span style={{ color: "var(--text-secondary)" }}>
        {winner === "shadow"
          ? `Shadow gains ${formatUsers(headroom)} of headroom.`
          : `Current gains ${formatUsers(headroom)} of headroom.`}
      </span>
    </p>
  );
}
