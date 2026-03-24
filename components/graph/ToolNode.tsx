"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Tool, getCategoryColor } from "@/lib/types";
import { ColorDot } from "@/components/ui/ColorDot";

export interface ToolNodeData extends Tool {
  dimmed?: boolean;
  highlighted?: boolean;
  /** When true, card expands in-place (used by Builder + Stacks). Explore never sets this. */
  expanded?: boolean;
  onRemove?: () => void;
}

function formatStars(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(0)}k`;
  return String(n);
}

function isNewTool(added_at: string | null | undefined): boolean {
  if (!added_at) return false;
  const ms = Date.now() - new Date(added_at).getTime();
  return ms < 30 * 24 * 60 * 60 * 1000;
}

function formatSyncedDate(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function ToolNode({ data, selected }: NodeProps<ToolNodeData>) {
  const color = getCategoryColor(data.category);
  // Expansion is explicit only — driven by data.expanded, never by ReactFlow's selected state.
  // This keeps Explore cards fixed-size while Builder/Stacks can still expand nodes.
  const isExpanded = !!data.expanded;
  const isSelected = data.highlighted || selected;
  const isProminent = data.prominent;
  const nodeWidth = isExpanded ? 280 : isProminent ? 220 : 190;
  const isOss = data.type === "oss";
  const hasFree = data.pricing.free_tier;
  const isNew = isNewTool(data.added_at);

  return (
    <div
      style={{
        opacity: data.dimmed ? 0.2 : 1,
        borderColor: isExpanded || isSelected ? color : "var(--border)",
        boxShadow: isExpanded
          ? `0 0 0 1px ${color}, 0 0 20px ${color}22`
          : isSelected
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
          opacity: isExpanded || isSelected ? 1 : 0.4,
          transition: "opacity 180ms ease",
        }}
      />

      {/* Health dot */}
      {data.health_score != null && (
        <div
          title={`Health score: ${data.health_score} — ${
            data.health_score >= 70
              ? "active, well-maintained"
              : data.health_score >= 40
                ? "slowing down"
                : "low activity"
          }`}
          style={{
            position: "absolute",
            top: 8,
            right: data.onRemove ? 28 : 8,
            width: 8,
            height: 8,
            borderRadius: "50%",
            background:
              data.health_score >= 70
                ? "var(--success)"
                : data.health_score >= 40
                  ? "var(--warning)"
                  : "var(--danger)",
            zIndex: 10,
            cursor: "help",
          }}
        />
      )}

      {/* Remove button — visible on hover */}
      {data.onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            data.onRemove!();
          }}
          title="Remove from stack"
          className="absolute top-2 right-2 w-4 h-4 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 transition-opacity z-20"
          style={{
            background: "#ff6b6b18",
            border: "1px solid #ff6b6b44",
            color: "var(--danger)",
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
        {/* Top row: category label + stars */}
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <ColorDot color={color} />
            <span
              className="text-[10px] font-medium uppercase tracking-wide truncate"
              style={{ color }}
            >
              {data.category.replace(/-/g, " ")}
            </span>
          </div>
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

        {/* OSS + Free Tier + Stale + New tags */}
        {(isOss || hasFree || data.is_stale || isNew) && (
          <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
            {isOss && (
              <span
                style={{
                  fontSize: 9,
                  padding: "2px 7px",
                  borderRadius: 4,
                  background: "#26de8120",
                  color: "var(--success)",
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
                  color: "var(--accent-2)",
                  border: "1px solid #00d4aa40",
                  fontWeight: 600,
                  letterSpacing: 0.3,
                  lineHeight: 1.6,
                }}
              >
                ✦ Free Tier
              </span>
            )}
            {data.is_stale && (
              <span
                style={{
                  fontSize: 9,
                  padding: "2px 7px",
                  borderRadius: 4,
                  background: "#f39c1220",
                  color: "#f39c12",
                  border: "1px solid #f39c1240",
                  fontWeight: 600,
                  letterSpacing: 0.3,
                  lineHeight: 1.6,
                }}
              >
                ⚠ Stale
              </span>
            )}
            {isNew && (
              <span
                style={{
                  fontSize: 9,
                  padding: "2px 7px",
                  borderRadius: 4,
                  background: "#7c6bff20",
                  color: "var(--accent)",
                  border: "1px solid #7c6bff44",
                  fontWeight: 600,
                  letterSpacing: 0.3,
                  lineHeight: 1.6,
                }}
              >
                ✦ New
              </span>
            )}
          </div>
        )}

        {/* Tagline — 2-line clamp normally, full when expanded */}
        <p
          className="text-[11px] text-[var(--text-secondary)] leading-snug"
          style={{
            overflow: isExpanded ? "visible" : "hidden",
            display: isExpanded ? "block" : "-webkit-box",
            WebkitLineClamp: isExpanded ? undefined : 2,
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

        {/* Sync timestamp — only when expanded and data is present */}
        {isExpanded && data.last_synced_at && (
          <p
            className="text-[9px] text-[var(--text-muted)]"
            style={{ marginBottom: 6, opacity: 0.6 }}
          >
            Synced {formatSyncedDate(data.last_synced_at)}
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
