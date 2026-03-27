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
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "rgba(124, 107, 255, 0.55)",
          }}
        >
          {data.label}
        </span>
        <span
          style={{
            fontSize: 10,
            color: "rgba(160, 155, 210, 0.35)",
            fontStyle: "italic",
          }}
        >
          {data.question}
        </span>
      </div>
    </div>
  );
}
