import React from "react";

interface RowProps {
  label: string;
  children: [React.ReactNode, React.ReactNode];
  align?: "center" | "top";
}

export function Row({ label, children, align = "center" }: RowProps) {
  const [a, b] = children;
  return (
    <div
      className={`grid grid-cols-[120px_1fr_1fr] ${align === "top" ? "items-start" : "items-center"}`}
      style={{ borderTop: "1px solid var(--border)" }}
    >
      <div className="px-3 py-2 text-[10px] text-[var(--text-muted)]">{label}</div>
      <div className="px-3 py-2 border-l" style={{ borderColor: "var(--border)" }}>
        {a}
      </div>
      <div className="px-3 py-2 border-l" style={{ borderColor: "var(--border)" }}>
        {b}
      </div>
    </div>
  );
}
