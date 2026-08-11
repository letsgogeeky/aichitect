"use client";

import { NodeProps } from "reactflow";

export default function LaneLabel({ data }: NodeProps) {
  return (
    <div
      style={{
        width: data.width,
        height: data.height,
        background: "rgba(124, 107, 255, 0.025)",
        border: "1px solid rgba(124, 107, 255, 0.09)",
        borderRadius: 10,
        pointerEvents: "none",
        userSelect: "none",
        boxSizing: "border-box",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 11,
          left: 14,
          display: "flex",
          alignItems: "baseline",
          gap: 8,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--accent)",
          }}
        >
          {data.label}
        </span>
        <span
          style={{
            fontSize: 11,
            color: "var(--text-muted)",
            fontStyle: "italic",
          }}
        >
          {data.question}
        </span>
      </div>
    </div>
  );
}
