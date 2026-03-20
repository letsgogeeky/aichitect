"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Tool, getCategoryColor, CATEGORIES, RelationshipType } from "@/lib/types";
import { Relationship, Stack } from "@/lib/types";
import relationshipsData from "@/data/relationships.json";
import toolsData from "@/data/tools.json";
import stacksData from "@/data/stacks.json";
import { useSuggestTool } from "@/components/ui/SuggestToolContext";
import BottomSheet from "./BottomSheet";

const relationships = relationshipsData as Relationship[];
const allTools = toolsData as Tool[];
const stacks = stacksData as Stack[];

interface Props {
  tool: Tool | null;
  open: boolean;
  onClose: () => void;
}

export default function ToolDetailSheet({ tool, open, onClose }: Props) {
  const { openSuggest } = useSuggestTool();
  const searchParams = useSearchParams();
  const router = useRouter();

  const color = tool ? getCategoryColor(tool.category) : "#7c6bff";
  const stackIds = (searchParams.get("s") ?? "").split(",").filter(Boolean);
  const inStack = tool ? stackIds.includes(tool.id) : false;

  function toggleStack() {
    if (!tool) return;
    const next = inStack ? stackIds.filter((id) => id !== tool.id) : [...stackIds, tool.id];
    const url = new URL(window.location.href);
    if (next.length > 0) url.searchParams.set("s", next.join(","));
    else url.searchParams.delete("s");
    router.replace(url.pathname + url.search, { scroll: false });
  }

  const categoryLabel = tool ? CATEGORIES.find((c) => c.id === tool.category)?.label : null;

  const connected: { tool: Tool; type: RelationshipType }[] = tool
    ? (() => {
        const seen = new Set<string>();
        const raw = relationships
          .filter((r) => r.source === tool.id || r.target === tool.id)
          .map((r) => {
            const otherId = r.source === tool.id ? r.target : r.source;
            const other = allTools.find((t) => t.id === otherId);
            return other ? { tool: other, type: r.type } : null;
          })
          .filter((x): x is { tool: Tool; type: RelationshipType } => x !== null);
        return raw.filter(({ tool: other, type }) => {
          const key = `${other.id}-${type}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      })()
    : [];

  const featuredIn = tool ? stacks.filter((s) => s.tools.includes(tool.id)) : [];

  return (
    <BottomSheet open={open} onClose={onClose} snapPoints={[55, 92]}>
      {tool && (
        <div className="px-4 pt-2 pb-6 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ background: color }}
                />
                <span
                  className="text-[10px] font-semibold uppercase tracking-wide"
                  style={{ color }}
                >
                  {categoryLabel}
                </span>
                <span
                  className={`text-[9px] font-semibold px-1.5 py-0.5 rounded uppercase ${
                    tool.type === "oss"
                      ? "bg-[#26de8122] text-[#26de81]"
                      : "bg-[#4ecdc422] text-[#4ecdc4]"
                  }`}
                >
                  {tool.type === "oss" ? "OSS" : "SaaS"}
                </span>
              </div>
              <h2
                className="text-base font-semibold leading-tight"
                style={{ color: "var(--text-primary)" }}
              >
                {tool.name}
              </h2>
              {tool.github_stars && (
                <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  ⭐ {tool.github_stars.toLocaleString()} GitHub stars
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {tool.description}
          </p>

          {/* Pricing */}
          <div>
            <h3
              className="text-[10px] font-semibold uppercase tracking-widest mb-2"
              style={{ color: "var(--text-muted)" }}
            >
              Pricing
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {tool.pricing.free_tier && (
                <span
                  className="text-[10px] px-2 py-1 rounded-full border"
                  style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
                >
                  Free tier
                </span>
              )}
              {tool.pricing.plans.map((p, i) => (
                <span
                  key={i}
                  className="text-[10px] px-2 py-1 rounded-full border"
                  style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
                >
                  {p.name}: {p.price}
                </span>
              ))}
            </div>
          </div>

          {/* Links */}
          <div className="flex gap-2">
            {tool.urls.website && (
              <a
                href={tool.urls.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center text-xs py-2 px-3 rounded-md font-medium"
                style={{ background: color + "22", color, border: `1px solid ${color}44` }}
              >
                Website ↗
              </a>
            )}
            {tool.urls.github && (
              <a
                href={tool.urls.github}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center text-xs py-2 px-3 rounded-md font-medium border"
                style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
              >
                GitHub ↗
              </a>
            )}
          </div>

          {/* Add to My Stack */}
          <button
            onClick={toggleStack}
            className="w-full flex items-center justify-center gap-2"
            style={{
              padding: "10px 12px",
              borderRadius: 8,
              background: inStack ? "#00d4aa18" : "#7c6bff18",
              border: `1px solid ${inStack ? "#00d4aa44" : "#7c6bff44"}`,
              color: inStack ? "#00d4aa" : "#7c6bff",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {inStack ? "✓ In My Stack" : "+ Add to My Stack"}
          </button>

          {/* Connections */}
          {connected.length > 0 && (
            <div>
              <h3
                className="text-[10px] font-semibold uppercase tracking-widest mb-2"
                style={{ color: "var(--text-muted)" }}
              >
                Connections
              </h3>
              <div className="space-y-1">
                {connected.slice(0, 8).map(({ tool: other, type }) => (
                  <div
                    key={`${other.id}-${type}`}
                    className="flex items-center justify-between py-2 px-2 rounded-md"
                    style={{ background: "var(--surface-2)" }}
                  >
                    <span className="text-xs truncate" style={{ color: "var(--text-primary)" }}>
                      {other.name}
                    </span>
                    <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
                      <span
                        className="text-[9px] px-1.5 py-0.5 rounded"
                        style={{
                          background:
                            type === "integrates-with"
                              ? "#7c6bff22"
                              : type === "commonly-paired"
                                ? "#4a4a7a44"
                                : "#3a3a4a44",
                          color:
                            type === "integrates-with"
                              ? "#7c6bff"
                              : type === "commonly-paired"
                                ? "#8888aa"
                                : "#555577",
                        }}
                      >
                        {type === "integrates-with"
                          ? "integrates"
                          : type === "commonly-paired"
                            ? "paired"
                            : "competes"}
                      </span>
                      <Link
                        href={`/compare/${tool.id}/${other.id}`}
                        className="text-[9px] px-1.5 py-0.5 rounded"
                        style={{ background: "#7c6bff22", color: "#7c6bff" }}
                      >
                        vs →
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
              <h3
                className="text-[10px] font-semibold uppercase tracking-widest mb-2"
                style={{ color: "var(--text-muted)" }}
              >
                Featured in stacks
              </h3>
              <div className="space-y-1">
                {featuredIn.map((stack) => (
                  <div
                    key={stack.id}
                    className="text-xs px-2 py-1.5 rounded-md"
                    style={{ background: "var(--surface-2)", color: "var(--text-secondary)" }}
                  >
                    {stack.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggest */}
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
            <button
              onClick={() => openSuggest()}
              className="w-full text-left"
              style={{
                padding: "8px 10px",
                borderRadius: 7,
                background: "#1c1c28",
                border: "1px solid #2a2a3a",
                color: "#555577",
                fontSize: 11,
                cursor: "pointer",
              }}
            >
              Missing a related tool? <span style={{ color: "#7c6bff" }}>Suggest it →</span>
            </button>
          </div>
        </div>
      )}
    </BottomSheet>
  );
}
