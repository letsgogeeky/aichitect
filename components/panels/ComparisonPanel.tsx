"use client";

import { useState } from "react";
import { Tool, Relationship, getCategoryColor, CATEGORIES } from "@/lib/types";
import relationshipsData from "@/data/relationships.json";
import toolsData from "@/data/tools.json";
import { healthColor, healthLabel, relLabel, relBadgeStyle } from "@/lib/health";
import { CloseButton } from "@/components/ui/CloseButton";
import { ColorDot } from "@/components/ui/ColorDot";
import {
  Row,
  CategoryPill,
  TypeBadge,
  FreeTierCell,
  PlanPills,
  DescriptionCard,
  LinksCard,
  ChooseIfCard,
  ToolPill,
} from "@/components/comparison";
import { formatRelativeTime } from "@/lib/format";

const relationships = relationshipsData as Relationship[];
const allTools = toolsData as Tool[];

interface ComparisonPanelProps {
  toolA: Tool;
  toolB: Tool;
  onClose: () => void;
  onSwap: () => void;
}

export default function ComparisonPanel({ toolA, toolB, onClose, onSwap }: ComparisonPanelProps) {
  const [copied, setCopied] = useState(false);

  function handleShare() {
    const url = `${window.location.origin}/explore?compare=${toolA.id},${toolB.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const colorA = getCategoryColor(toolA.category);
  const colorB = getCategoryColor(toolB.category);
  const catLabelA = CATEGORIES.find((c) => c.id === toolA.category)?.label;
  const catLabelB = CATEGORIES.find((c) => c.id === toolB.category)?.label;

  const connectedIdsA = new Set(
    relationships
      .filter((r) => r.source === toolA.id || r.target === toolA.id)
      .map((r) => (r.source === toolA.id ? r.target : r.source))
  );
  const connectedIdsB = new Set(
    relationships
      .filter((r) => r.source === toolB.id || r.target === toolB.id)
      .map((r) => (r.source === toolB.id ? r.target : r.source))
  );

  const sharedIds = [...connectedIdsA].filter((id) => connectedIdsB.has(id));
  const onlyAIds = [...connectedIdsA].filter((id) => !connectedIdsB.has(id));
  const onlyBIds = [...connectedIdsB].filter((id) => !connectedIdsA.has(id));

  const directRelationship = relationships.find(
    (r) =>
      (r.source === toolA.id && r.target === toolB.id) ||
      (r.source === toolB.id && r.target === toolA.id)
  );

  const sharedTools = sharedIds
    .map((id) => allTools.find((t) => t.id === id))
    .filter(Boolean) as Tool[];
  const onlyATools = onlyAIds
    .map((id) => allTools.find((t) => t.id === id))
    .filter(Boolean) as Tool[];
  const onlyBTools = onlyBIds
    .map((id) => allTools.find((t) => t.id === id))
    .filter(Boolean) as Tool[];

  return (
    <aside
      className="w-[520px] flex-shrink-0 border-l overflow-y-auto"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {/* Direct relationship badge */}
            {directRelationship && (
              <div
                className="inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full mb-2"
                style={relBadgeStyle(directRelationship.type)}
              >
                <span>These tools {relLabel(directRelationship.type)}</span>
              </div>
            )}
            {/* Tool names */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 min-w-0">
                <ColorDot color={colorA} />
                <span className="text-sm font-semibold text-[var(--text-primary)] truncate">
                  {toolA.name}
                </span>
              </div>
              <span className="text-[var(--text-muted)] text-xs flex-shrink-0">vs</span>
              <div className="flex items-center gap-1.5 min-w-0">
                <ColorDot color={colorB} />
                <span className="text-sm font-semibold text-[var(--text-primary)] truncate">
                  {toolB.name}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={handleShare}
              className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors p-1 text-[10px] font-medium"
              title="Copy share link"
              style={copied ? { color: "var(--success)" } : undefined}
            >
              {copied ? "Copied!" : "Share"}
            </button>
            <button
              onClick={onSwap}
              className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors p-1"
              title="Swap A and B"
            >
              ⇄
            </button>
            <CloseButton onClick={onClose} className="p-1" />
          </div>
        </div>

        {/* When to choose */}
        {(toolA.choose_if || toolB.choose_if) && (
          <div className="grid grid-cols-2 gap-3">
            <ChooseIfCard tool={toolA} color={colorA} />
            <ChooseIfCard tool={toolB} color={colorB} />
          </div>
        )}

        {/* Comparison grid */}
        <div className="rounded-md overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          {/* Column headers */}
          <div
            className="grid grid-cols-[120px_1fr_1fr] text-[10px] font-semibold uppercase tracking-wide"
            style={{ borderBottom: "1px solid var(--border)", background: "var(--surface-2)" }}
          >
            <div className="px-3 py-2 text-[var(--text-muted)]">Field</div>
            <div
              className="px-3 py-2 border-l flex items-center gap-1.5"
              style={{ borderColor: "var(--border)", color: colorA }}
            >
              {toolA.name}
              {toolA.is_stale && <span style={{ color: "#f39c12", fontSize: 10 }}>⚠</span>}
            </div>
            <div
              className="px-3 py-2 border-l flex items-center gap-1.5"
              style={{ borderColor: "var(--border)", color: colorB }}
            >
              {toolB.name}
              {toolB.is_stale && <span style={{ color: "#f39c12", fontSize: 10 }}>⚠</span>}
            </div>
          </div>

          {/* Category */}
          <Row label="Category">
            <CategoryPill label={catLabelA ?? toolA.category} color={colorA} />
            <CategoryPill label={catLabelB ?? toolB.category} color={colorB} />
          </Row>

          {/* Type */}
          <Row label="Type">
            <TypeBadge type={toolA.type} />
            <TypeBadge type={toolB.type} />
          </Row>

          {/* Free tier */}
          <Row label="Free Tier">
            <FreeTierCell has={toolA.pricing.free_tier} />
            <FreeTierCell has={toolB.pricing.free_tier} />
          </Row>

          {/* Pricing plans */}
          <Row label="Plans" align="top">
            <PlanPills plans={toolA.pricing.plans} />
            <PlanPills plans={toolB.pricing.plans} />
          </Row>

          {/* Stars */}
          <Row label="Stars">
            <span className="text-xs text-[var(--text-secondary)]">
              {toolA.github_stars ? `⭐ ${toolA.github_stars.toLocaleString()}` : "—"}
            </span>
            <span className="text-xs text-[var(--text-secondary)]">
              {toolB.github_stars ? `⭐ ${toolB.github_stars.toLocaleString()}` : "—"}
            </span>
          </Row>

          {/* Health */}
          <Row label="Health">
            {toolA.health_score != null ? (
              <span
                className="flex items-center gap-1.5 text-xs font-medium"
                style={{ color: healthColor(toolA.health_score) }}
              >
                <span style={{ fontSize: 8 }}>●</span>
                {toolA.health_score} — {healthLabel(toolA.health_score)}
              </span>
            ) : (
              <span className="text-xs text-[var(--text-muted)]">—</span>
            )}
            {toolB.health_score != null ? (
              <span
                className="flex items-center gap-1.5 text-xs font-medium"
                style={{ color: healthColor(toolB.health_score) }}
              >
                <span style={{ fontSize: 8 }}>●</span>
                {toolB.health_score} — {healthLabel(toolB.health_score)}
              </span>
            ) : (
              <span className="text-xs text-[var(--text-muted)]">—</span>
            )}
          </Row>

          {/* Synced */}
          {(toolA.last_synced_at || toolB.last_synced_at) && (
            <Row label="Synced">
              <span className="text-xs text-[var(--text-muted)]">
                {toolA.last_synced_at ? formatRelativeTime(toolA.last_synced_at) : "—"}
              </span>
              <span className="text-xs text-[var(--text-muted)]">
                {toolB.last_synced_at ? formatRelativeTime(toolB.last_synced_at) : "—"}
              </span>
            </Row>
          )}
        </div>

        {/* Descriptions */}
        <div className="grid grid-cols-2 gap-3">
          <DescriptionCard tool={toolA} color={colorA} />
          <DescriptionCard tool={toolB} color={colorB} />
        </div>

        {/* Links */}
        <div className="grid grid-cols-2 gap-3">
          <LinksCard tool={toolA} color={colorA} />
          <LinksCard tool={toolB} color={colorB} />
        </div>

        {/* Shared connections */}
        {sharedTools.length > 0 && (
          <div>
            <h3 className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-2">
              Shared Connections ({sharedTools.length})
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {sharedTools.slice(0, 12).map((t) => (
                <ToolPill key={t.id} tool={t} />
              ))}
            </div>
          </div>
        )}

        {/* Unique connections */}
        {(onlyATools.length > 0 || onlyBTools.length > 0) && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <h3
                className="text-[10px] font-semibold uppercase tracking-widest mb-2"
                style={{ color: colorA + "cc" }}
              >
                Only {toolA.name} ({onlyATools.length})
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {onlyATools.slice(0, 8).map((t) => (
                  <ToolPill key={t.id} tool={t} />
                ))}
              </div>
            </div>
            <div>
              <h3
                className="text-[10px] font-semibold uppercase tracking-widest mb-2"
                style={{ color: colorB + "cc" }}
              >
                Only {toolB.name} ({onlyBTools.length})
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {onlyBTools.slice(0, 8).map((t) => (
                  <ToolPill key={t.id} tool={t} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Deep-link to Explore */}
        <div className="pt-1" style={{ borderTop: "1px solid var(--border)" }}>
          <a
            href={`/explore?compare=${toolA.id},${toolB.id}`}
            className="block text-center text-[10px] py-1.5 px-3 rounded-md transition-colors hover:border-[var(--border-2)]"
            style={{ color: "var(--text-muted)", border: "1px solid var(--border)" }}
          >
            See full comparison in Explore →
          </a>
        </div>
      </div>
    </aside>
  );
}
