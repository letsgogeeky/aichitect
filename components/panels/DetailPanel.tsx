"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Tool, getCategoryColor, CATEGORIES } from "@/lib/types";
import relationshipsData from "@/data/relationships.json";
import toolsData from "@/data/tools.json";
import stacksData from "@/data/stacks.json";
import { Relationship, Stack } from "@/lib/types";
import { useSuggestTool } from "@/components/ui/SuggestToolContext";
import { getToolHealthDetails, ToolHealthDetails } from "@/lib/data/tools";
import { formatRelativeTime, formatStarDelta } from "@/lib/format";
import { healthColor, healthLabel } from "@/lib/health";
import { CloseButton } from "@/components/ui/CloseButton";
import { ColorDot } from "@/components/ui/ColorDot";
import { ToolUsageButton } from "@/components/ui/ToolUsageButton";
import { SITE_URL } from "@/lib/constants";

const relationships = relationshipsData as Relationship[];
const allTools = toolsData as Tool[];
const stacks = stacksData as Stack[];

interface Props {
  tool: Tool | null;
  onClose: () => void;
}

export default function DetailPanel({ tool, onClose }: Props) {
  const { openSuggest } = useSuggestTool();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [healthDetails, setHealthDetails] = useState<ToolHealthDetails | null>(null);
  const [copiedBadge, setCopiedBadge] = useState(false);

  useEffect(() => {
    if (!tool) return;
    let cancelled = false;
    getToolHealthDetails(tool.id, tool.github_stars ?? null).then((details) => {
      if (!cancelled) setHealthDetails(details);
    });
    return () => {
      cancelled = true;
    };
    // tool?.id is intentional — re-fetch only when the selected tool changes, not on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tool?.id]);

  if (!tool) return null;

  const color = getCategoryColor(tool.category);

  const stackIds = (searchParams.get("s") ?? "").split(",").filter(Boolean);
  const inStack = stackIds.includes(tool.id);
  const toolId = tool.id;

  function copyBadge() {
    if (!tool) return;
    const badgeUrl = `${SITE_URL}/badge/tool/${tool.id}`;
    const markdown = `[![${tool.name}](${badgeUrl})](${SITE_URL}/explore)`;
    navigator.clipboard.writeText(markdown).then(() => {
      setCopiedBadge(true);
      setTimeout(() => setCopiedBadge(false), 2000);
    });
  }

  function toggleStack() {
    const next = inStack ? stackIds.filter((id) => id !== toolId) : [...stackIds, toolId];
    const url = new URL(window.location.href);
    if (next.length > 0) url.searchParams.set("s", next.join(","));
    else url.searchParams.delete("s");
    router.replace(url.pathname + url.search, { scroll: false });
  }
  const categoryLabel = CATEGORIES.find((c) => c.id === tool.category)?.label;

  const connectedRaw = relationships
    .filter((r) => r.source === tool.id || r.target === tool.id)
    .map((r) => {
      const otherId = r.source === tool.id ? r.target : r.source;
      const other = allTools.find((t) => t.id === otherId);
      return other ? { tool: other, type: r.type } : null;
    })
    .filter(Boolean) as { tool: Tool; type: string }[];

  // Deduplicate: same tool can appear in both directions (A→B and B→A)
  const seen = new Set<string>();
  const connected = connectedRaw.filter(({ tool: other, type }) => {
    const key = `${other.id}-${type}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const featuredIn = stacks.filter((s) => s.tools.includes(tool.id));

  const rejectedBy = stacks
    .map((s) => {
      const rejection = s.not_in_stack?.find((r) => r.tool === tool.id);
      return rejection ? { stack: s, reason: rejection.reason } : null;
    })
    .filter(Boolean) as { stack: (typeof stacks)[0]; reason: string }[];

  return (
    <aside
      className="w-72 flex-shrink-0 border-l overflow-y-auto"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <div className="p-4 space-y-4">
        {/* Stale warning banner */}
        {tool.is_stale && (
          <div
            className="type-body"
            style={{
              background: "#f39c1218",
              border: "1px solid #f39c1240",
              borderRadius: 8,
              padding: "8px 12px",
              color: "#f39c12",
              fontWeight: 500,
            }}
          >
            ⚠ This tool appears inactive (no commits in 90+ days)
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <ColorDot color={color} className="w-2.5 h-2.5" />
              <span className="type-overline" style={{ color }}>
                {categoryLabel}
              </span>
              <span
                className={`type-tag px-1.5 py-0.5 rounded uppercase ${
                  tool.type === "oss"
                    ? "bg-[#26de8122] text-[var(--success)]"
                    : "bg-[#4ecdc422] text-[#4ecdc4]"
                }`}
              >
                {tool.type === "oss" ? "OSS" : "SaaS"}
              </span>
            </div>
            <h2 className="type-title text-[var(--text-primary)] leading-tight">{tool.name}</h2>
            {tool.github_stars && (
              <div className="type-caption text-[var(--text-muted)] mt-0.5">
                ⭐ {tool.github_stars.toLocaleString()} GitHub stars
              </div>
            )}
            {tool.last_synced_at && (
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="type-caption text-[var(--text-muted)]">
                  Last commit:{" "}
                  {healthDetails?.lastCommitAt
                    ? formatRelativeTime(healthDetails.lastCommitAt)
                    : "—"}
                </span>
                {healthDetails?.starDelta != null && (
                  <span
                    className="type-caption"
                    style={{ color: formatStarDelta(healthDetails.starDelta).color }}
                  >
                    {formatStarDelta(healthDetails.starDelta).text}
                  </span>
                )}
                <span className="type-caption text-[var(--text-muted)] opacity-60">
                  · synced {formatRelativeTime(tool.last_synced_at)}
                </span>
              </div>
            )}
            {tool.health_score != null && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="type-caption text-[var(--text-muted)]">Health:</span>
                <span
                  className="type-caption font-semibold"
                  style={{ color: healthColor(tool.health_score) }}
                >
                  {tool.health_score} — {healthLabel(tool.health_score)}
                </span>
              </div>
            )}
          </div>
          <CloseButton onClick={onClose} className="ml-2 mt-0.5 flex-shrink-0" />
        </div>

        {/* Description */}
        <p className="type-body text-[var(--text-secondary)]">{tool.description}</p>

        {/* Pricing */}
        <div>
          <h3 className="type-overline text-[var(--text-muted)] mb-2">Pricing</h3>
          <div className="flex flex-wrap gap-1.5">
            {tool.pricing.free_tier && (
              <span className="type-tag px-2 py-1 rounded-full border border-[var(--border)] text-[var(--text-secondary)]">
                Free tier
              </span>
            )}
            {tool.pricing.plans.map((p, i) => (
              <span
                key={i}
                className="type-tag px-2 py-1 rounded-full border border-[var(--border)] text-[var(--text-secondary)]"
              >
                {p.name}: {p.price}
              </span>
            ))}
          </div>
        </div>

        {/* Links */}
        <div className="flex gap-2">
          {tool.website_url && (
            <a
              href={tool.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-center type-label py-1.5 px-3 rounded-md transition-colors"
              style={{
                background: color + "22",
                color,
                border: `1px solid ${color}44`,
              }}
            >
              Website ↗
            </a>
          )}
          {tool.github_url && (
            <a
              href={tool.github_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-center type-label py-1.5 px-3 rounded-md border border-[var(--border)] text-[var(--text-secondary)] transition-colors hover:border-[var(--border-2)]"
            >
              GitHub ↗
            </a>
          )}
        </div>

        {/* Add to My Stack */}
        <div className="flex gap-2">
          <button
            onClick={toggleStack}
            className="flex-1 flex items-center justify-center gap-2 type-label transition-all"
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              background: inStack ? "#00d4aa18" : "#7c6bff18",
              border: `1px solid ${inStack ? "#00d4aa44" : "#7c6bff44"}`,
              color: inStack ? "var(--accent-2)" : "var(--accent)",
              cursor: "pointer",
            }}
          >
            {inStack ? "✓ In My Stack" : "+ Add to My Stack"}
          </button>
          {stackIds.length > 0 && (
            <Link
              href={`/builder?s=${stackIds.join(",")}`}
              className="flex items-center justify-center px-3 rounded-lg type-label transition-colors"
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                color: "var(--text-secondary)",
                whiteSpace: "nowrap",
              }}
            >
              Build →
            </Link>
          )}
        </div>

        {/* I use this + copy badge */}
        <div className="flex gap-2">
          <div className="flex-1">
            <ToolUsageButton toolId={tool.id} color={color} />
          </div>
          <button
            onClick={copyBadge}
            title="Copy badge Markdown"
            className="type-label"
            style={{
              display: "flex",
              alignItems: "center",
              padding: "0 10px",
              height: 32,
              borderRadius: 7,
              cursor: "pointer",
              background: copiedBadge ? "#26de8118" : "var(--btn)",
              border: `1px solid ${copiedBadge ? "#26de8144" : "var(--btn-border)"}`,
              color: copiedBadge ? "var(--success)" : "var(--text-muted)",
              transition: "all 150ms",
              flexShrink: 0,
              whiteSpace: "nowrap",
            }}
          >
            {copiedBadge ? "Copied!" : "Badge"}
          </button>
        </div>

        {/* Connected tools */}
        {connected.length > 0 && (
          <div>
            <h3 className="type-overline text-[var(--text-muted)] mb-2">Connections</h3>
            <div className="space-y-1">
              {connected.slice(0, 8).map(({ tool: other, type }) => (
                <div
                  key={`${other.id}-${type}`}
                  className="flex items-center justify-between py-1 px-2 rounded-md group"
                  style={{ background: "var(--surface-2)" }}
                >
                  <span className="type-body text-[var(--text-primary)] truncate">
                    {other.name}
                  </span>
                  <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
                    <span
                      className="type-tag px-1.5 py-0.5 rounded group-hover:hidden"
                      style={{
                        background:
                          type === "integrates-with"
                            ? "#7c6bff22"
                            : type === "commonly-paired-with"
                              ? "#4a4a7a44"
                              : "#3a3a4a44",
                        color:
                          type === "integrates-with"
                            ? "var(--accent)"
                            : type === "commonly-paired-with"
                              ? "#8888aa"
                              : "#555577",
                      }}
                    >
                      {type === "integrates-with"
                        ? "integrates with"
                        : type === "commonly-paired-with"
                          ? "often used with"
                          : "competes with"}
                    </span>
                    <Link
                      href={`/compare/${tool.id}/${other.id}`}
                      className="hidden group-hover:block type-tag px-1.5 py-0.5 rounded"
                      style={{ background: "#7c6bff22", color: "var(--accent)" }}
                      title={`Compare ${tool.name} vs ${other.name}`}
                    >
                      Compare →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Featured in stacks */}
        {featuredIn.length > 0 && (
          <div>
            <h3 className="type-overline text-[var(--text-muted)] mb-2">Featured in stacks</h3>
            <div className="space-y-1">
              {featuredIn.map((stack) => (
                <div
                  key={stack.id}
                  className="type-body text-[var(--text-secondary)] px-2 py-1 rounded-md"
                  style={{ background: "var(--surface-2)" }}
                >
                  {stack.name}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rejected by stacks */}
        {rejectedBy.length > 0 && (
          <div>
            <h3 className="type-overline text-[var(--text-muted)] mb-2">
              Ruled out by {rejectedBy.length} stack{rejectedBy.length !== 1 ? "s" : ""}
            </h3>
            <div className="space-y-1.5">
              {rejectedBy.map(({ stack, reason }) => (
                <div
                  key={stack.id}
                  className="px-2 py-1.5 rounded-md"
                  style={{ background: "#ff6b6b08", border: "1px solid #ff6b6b18" }}
                >
                  <div className="type-label text-[var(--text-secondary)] mb-0.5">{stack.name}</div>
                  <div className="type-body-tight" style={{ color: "#ff6b6b99" }}>
                    &ldquo;{reason}&rdquo;
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Suggest a related tool */}
        <div
          style={{
            borderTop: "1px solid var(--border)",
            paddingTop: 12,
            marginTop: 4,
          }}
        >
          <button
            onClick={() => openSuggest()}
            className="w-full text-left type-label transition-colors"
            style={{
              padding: "8px 10px",
              borderRadius: 7,
              background: "var(--btn)",
              border: "1px solid var(--btn-border)",
              color: "#555577",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#8888aa";
              e.currentTarget.style.borderColor = "#3a3a4a";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#555577";
              e.currentTarget.style.borderColor = "var(--btn-border)";
            }}
          >
            Missing a related tool? <span style={{ color: "var(--accent)" }}>Suggest it →</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
