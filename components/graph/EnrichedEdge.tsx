"use client";

import { useState } from "react";
import { EdgeProps, getBezierPath } from "reactflow";

export interface EnrichedEdgeData {
  how?: string;
  color?: string;
  strokeWidth?: number;
}

/**
 * Custom edge for integrates-with relationships.
 * Shows a tooltip with the `how` description on hover.
 * Visually heavier when the relationship is enriched (has a `how` field).
 */
export default function EnrichedEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
}: EdgeProps<EnrichedEdgeData>) {
  const [hovered, setHovered] = useState(false);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const color = data?.color ?? "var(--accent)";
  const strokeWidth = data?.strokeWidth ?? 1.5;
  const how = data?.how;

  return (
    <>
      {/* Invisible wider hit area for hover detection */}
      <path
        id={`${id}-hitarea`}
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={12}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ cursor: how ? "help" : "default" }}
      />
      {/* Visible edge */}
      <path
        id={id}
        d={edgePath}
        fill="none"
        stroke={color}
        strokeWidth={hovered ? strokeWidth + 0.5 : strokeWidth}
        markerEnd={markerEnd}
        style={{
          transition: "stroke-width 120ms ease, opacity 120ms ease",
          opacity: hovered ? 1 : 0.75,
          pointerEvents: "none",
        }}
      />
      {/* Tooltip — only shown when hovered and how text is available */}
      {hovered && how && (
        <foreignObject
          x={labelX - 110}
          y={labelY - 44}
          width={220}
          height={80}
          style={{ overflow: "visible", pointerEvents: "none" }}
        >
          <div
            style={{
              background: "#0e0e18ee",
              border: "1px solid #7c6bff33",
              borderRadius: 6,
              padding: "6px 9px",
              fontSize: 10,
              color: "#c0c0d8",
              lineHeight: 1.5,
              backdropFilter: "blur(6px)",
              maxWidth: 220,
              whiteSpace: "normal",
              wordBreak: "break-word",
              pointerEvents: "none",
            }}
          >
            {how}
          </div>
        </foreignObject>
      )}
    </>
  );
}
