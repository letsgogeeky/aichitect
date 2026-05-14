"use client";

interface Props {
  current: 1 | 2 | 3;
  total?: number;
}

export default function StepDots({ current, total = 3 }: Props) {
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
      {Array.from({ length: total }, (_, i) => i + 1).map((i) => (
        <span
          key={i}
          style={{
            width: i === current ? 22 : 8,
            height: 8,
            borderRadius: 999,
            background: i <= current ? "var(--accent)" : "var(--border)",
            transition: "width 0.2s ease, background 0.2s ease",
          }}
          aria-current={i === current ? "step" : undefined}
        />
      ))}
      <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 8 }}>
        Step {current} of {total}
      </span>
    </div>
  );
}
