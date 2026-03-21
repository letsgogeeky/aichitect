"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Tool, getCategoryColor } from "@/lib/types";

export interface ToolNodeData extends Tool {
  dimmed?: boolean;
  highlighted?: boolean;
  expanded?: boolean;
  onRemove?: () => void;
}

function formatStars(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(0)}k`;
  return String(n);
}

function ToolNode({ data, selected }: NodeProps<ToolNodeData>) {
  const color = getCategoryColor(data.category);
  const isExpanded = data.expanded || selected;
  const isProminent = data.prominent;

  const nodeWidth = isExpanded ? 280 : isProminent ? 220 : 190;
  const isOss = data.type === "oss";
  const hasFree = data.pricing.free_tier;

  return (
    <div
      style={{
        opacity: data.dimmed ? 0.2 : 1,
        borderColor: isExpanded ? color : data.highlighted ? color : "var(--border)",
        boxShadow: isExpanded
          ? `0 0 0 1px ${color}, 0 0 20px ${color}22`
          : data.highlighted
            ? `0 0 0 1px ${color}88`
            : "none",
        width: nodeWidth,
        transition:
          "width 220ms ease, box-shadow 180ms ease, border-color 180ms ease, opacity 180ms ease",
        zIndex: isExpanded ? 10 : 1,
        position: "relative",
      }}
      className="group rounded-lg border bg-[var(--surface)] cursor-pointer hover:border-[var(--border-2)]"
    >
      {/* Colored top accent */}
      <div
        style={{
          height: 2,
          background: color,
          borderRadius: "6px 6px 0 0",
          opacity: isExpanded ? 1 : 0.4,
          transition: "opacity 180ms ease",
        }}
      />

      {/* Remove button — visible on hover or when expanded */}
      {data.onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            data.onRemove!();
          }}
          title="Remove from stack"
          className={`absolute top-2 right-2 w-4 h-4 flex items-center justify-center rounded transition-opacity z-20 ${
            isExpanded ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          }`}
          style={{
            background: "#ff6b6b18",
            border: "1px solid #ff6b6b44",
            color: "#ff6b6b",
            fontSize: 10,
            lineHeight: 1,
          }}
        >
          ×
        </button>
      )}

      <Handle
        type="target"
        position={Position.Left}
        style={{ background: color, width: 6, height: 6, border: "none" }}
      />

      <div className="px-3 pt-2 pb-2.5">
        {/* Top row: category label */}
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
            <span
              className="text-[10px] font-medium uppercase tracking-wide truncate"
              style={{ color }}
            >
              {data.category.replace(/-/g, " ")}
            </span>
          </div>

          {/* Stars */}
          {data.github_stars ? (
            <span className="text-[10px] text-[var(--text-muted)] flex-shrink-0 ml-1">
              ⭐ {formatStars(data.github_stars)}
            </span>
          ) : null}
        </div>

        {/* Name */}
        <div className="mb-1">
          <span
            className="font-semibold text-[var(--text-primary)] leading-tight"
            style={{ fontSize: isProminent || isExpanded ? 13 : 12 }}
          >
            {data.name}
          </span>
        </div>

        {/* OSS + Free Tier special tags */}
        {(isOss || hasFree) && (
          <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
            {isOss && (
              <span
                style={{
                  fontSize: 9,
                  padding: "2px 7px",
                  borderRadius: 4,
                  background: "#26de8120",
                  color: "#26de81",
                  border: "1px solid #26de8140",
                  fontWeight: 600,
                  letterSpacing: 0.3,
                  lineHeight: 1.6,
                }}
              >
                ◆ Open Source
              </span>
            )}
            {hasFree && (
              <span
                style={{
                  fontSize: 9,
                  padding: "2px 7px",
                  borderRadius: 4,
                  background: "#00d4aa15",
                  color: "#00d4aa",
                  border: "1px solid #00d4aa40",
                  fontWeight: 600,
                  letterSpacing: 0.3,
                  lineHeight: 1.6,
                }}
              >
                ✦ Free Tier
              </span>
            )}
          </div>
        )}

        {/* Tagline */}
        <p
          className="text-[11px] text-[var(--text-secondary)] leading-snug"
          style={{
            overflow: isExpanded ? "visible" : "hidden",
            display: isExpanded ? "block" : "-webkit-box",
            WebkitLineClamp: isExpanded ? undefined : 1,
            WebkitBoxOrient: "vertical",
            marginBottom: isExpanded ? 6 : 8,
          }}
        >
          {data.tagline}
        </p>

        {/* Description — only when expanded */}
        {isExpanded && (
          <p
            className="text-[10px] text-[var(--text-muted)] leading-relaxed mb-2"
            style={{ animation: "fadeIn 180ms ease" }}
          >
            {data.description}
          </p>
        )}

        {/* Bottom row: plan price + visit link */}
        <div className="flex items-center gap-1 flex-wrap">
          {data.pricing.plans[0] && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full border border-[var(--border)] text-[var(--text-muted)]">
              {data.pricing.plans[0].price}
            </span>
          )}
          {isExpanded && data.website_url && (
            <a
              href={data.website_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="ml-auto text-[9px] px-2 py-0.5 rounded-full font-medium"
              style={{
                background: color + "22",
                color,
                border: `1px solid ${color}44`,
              }}
            >
              Visit ↗
            </a>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        style={{ background: color, width: 6, height: 6, border: "none" }}
      />
    </div>
  );
}

export default memo(ToolNode);
