"use client";

import { useState } from "react";
import { Tool, Relationship, getCategoryColor, CATEGORIES } from "@/lib/types";
import relationshipsData from "@/data/relationships.json";
import toolsData from "@/data/tools.json";
import { healthColor, healthLabel, relLabel, relBadgeStyle } from "@/lib/health";

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
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: colorA }}
                />
                <span className="text-sm font-semibold text-[var(--text-primary)] truncate">
                  {toolA.name}
                </span>
              </div>
              <span className="text-[var(--text-muted)] text-xs flex-shrink-0">vs</span>
              <div className="flex items-center gap-1.5 min-w-0">
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: colorB }}
                />
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
              style={copied ? { color: "#26de81" } : undefined}
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
            <button
              onClick={onClose}
              className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors p-1"
            >
              ✕
            </button>
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

// ─── Sub-components ──────────────────────────────────────────────────────────

function Row({
  label,
  children,
  align = "center",
}: {
  label: string;
  children: [React.ReactNode, React.ReactNode];
  align?: "center" | "top";
}) {
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

function CategoryPill({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="text-[10px] px-2 py-0.5 rounded-full font-medium"
      style={{ background: color + "22", color }}
    >
      {label}
    </span>
  );
}

function TypeBadge({ type }: { type: string }) {
  const isOss = type === "oss";
  return (
    <span
      className="text-[9px] font-semibold px-1.5 py-0.5 rounded uppercase"
      style={
        isOss
          ? { background: "#26de8122", color: "#26de81" }
          : { background: "#4ecdc422", color: "#4ecdc4" }
      }
    >
      {isOss ? "OSS" : "SaaS"}
    </span>
  );
}

function FreeTierCell({ has }: { has: boolean }) {
  return (
    <span className={`text-xs font-medium ${has ? "text-[#26de81]" : "text-[var(--text-muted)]"}`}>
      {has ? "✓ Yes" : "✗ No"}
    </span>
  );
}

function PlanPills({ plans }: { plans: { name: string; price: string }[] }) {
  if (plans.length === 0) return <span className="text-xs text-[var(--text-muted)]">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {plans.slice(0, 3).map((p, i) => (
        <span
          key={i}
          className="text-[9px] px-1.5 py-0.5 rounded border border-[var(--border)] text-[var(--text-secondary)]"
        >
          {p.name}: {p.price}
        </span>
      ))}
    </div>
  );
}

function DescriptionCard({ tool, color }: { tool: Tool; color: string }) {
  return (
    <div
      className="rounded-md p-3 space-y-1"
      style={{ background: "var(--surface-2)", borderTop: `2px solid ${color}` }}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color }}>
        {tool.name}
      </p>
      <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">{tool.description}</p>
    </div>
  );
}

function LinksCard({ tool, color }: { tool: Tool; color: string }) {
  const hasAny = tool.website_url || tool.github_url;
  if (!hasAny) return <div />;
  return (
    <div className="flex flex-col gap-1.5">
      {tool.website_url && (
        <a
          href={tool.website_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-center text-[11px] py-1.5 px-3 rounded-md font-medium transition-colors"
          style={{ background: color + "22", color, border: `1px solid ${color}44` }}
        >
          {tool.name} Website ↗
        </a>
      )}
      {tool.github_url && (
        <a
          href={tool.github_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-center text-[11px] py-1.5 px-3 rounded-md font-medium border border-[var(--border)] text-[var(--text-secondary)] transition-colors hover:border-[var(--border-2)]"
        >
          GitHub ↗
        </a>
      )}
    </div>
  );
}

function ChooseIfCard({ tool, color }: { tool: Tool; color: string }) {
  if (!tool.choose_if || tool.choose_if.length === 0) {
    return (
      <div
        className="rounded-md p-3"
        style={{ background: "var(--surface-2)", borderTop: `2px solid ${color}` }}
      >
        <p className="text-[10px] font-semibold uppercase tracking-wide mb-2" style={{ color }}>
          Choose {tool.name} when…
        </p>
        <p className="text-[10px] text-[var(--text-muted)] italic">No signals added yet</p>
      </div>
    );
  }
  return (
    <div
      className="rounded-md p-3"
      style={{ background: "var(--surface-2)", borderTop: `2px solid ${color}` }}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide mb-2" style={{ color }}>
        Choose {tool.name} when…
      </p>
      <ul className="space-y-1.5">
        {tool.choose_if.map((signal, i) => (
          <li key={i} className="flex items-start gap-1.5">
            <span className="text-[9px] mt-0.5 flex-shrink-0" style={{ color }}>
              •
            </span>
            <span className="text-[11px] text-[var(--text-secondary)] leading-snug">{signal}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ToolPill({ tool }: { tool: Tool }) {
  const color = getCategoryColor(tool.category);
  return (
    <span
      className="text-[10px] px-2 py-0.5 rounded-full"
      style={{ background: color + "18", color, border: `1px solid ${color}33` }}
    >
      {tool.name}
    </span>
  );
}
