"use client";

import { useState } from "react";
import { CATEGORIES, STACK_LAYERS, RelationshipType } from "@/lib/types";
import { ColorDot } from "@/components/ui/ColorDot";
import { useSuggestTool } from "@/components/ui/SuggestToolContext";

interface Props {
  activeCategories: Set<string>;
  setActiveCategories: (v: Set<string>) => void;
  activeRelTypes: Set<RelationshipType>;
  setActiveRelTypes: (v: Set<RelationshipType>) => void;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
}

const REL_TYPES: { id: RelationshipType; label: string; style: string }[] = [
  { id: "integrates-with", label: "Integrates with", style: "solid" },
  { id: "commonly-paired-with", label: "Often used together", style: "dashed" },
  { id: "competes-with", label: "Competes with", style: "dotted" },
];

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      style={{
        transform: open ? "rotate(0deg)" : "rotate(-90deg)",
        transition: "transform 180ms ease",
        flexShrink: 0,
      }}
    >
      <path
        d="M2 3.5L5 6.5L8 3.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function FilterPanel({
  activeCategories,
  setActiveCategories,
  activeRelTypes,
  setActiveRelTypes,
  searchQuery,
  setSearchQuery,
}: Props) {
  const { openSuggest } = useSuggestTool();
  const allOn = activeCategories.size === CATEGORIES.length;

  // Each layer starts open; track collapsed state per layer id
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [edgesCollapsed, setEdgesCollapsed] = useState(false);

  function toggleLayerCollapsed(layerId: string) {
    setCollapsed((prev) => ({ ...prev, [layerId]: !prev[layerId] }));
  }

  function toggleCategory(id: string) {
    const next = new Set(activeCategories);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setActiveCategories(next);
  }

  function toggleLayerCategories(categoryIds: string[]) {
    const allActive = categoryIds.every((id) => activeCategories.has(id));
    const next = new Set(activeCategories);
    if (allActive) {
      categoryIds.forEach((id) => next.delete(id));
    } else {
      categoryIds.forEach((id) => next.add(id));
    }
    setActiveCategories(next);
  }

  function toggleAll() {
    if (allOn) setActiveCategories(new Set());
    else setActiveCategories(new Set(CATEGORIES.map((c) => c.id)));
  }

  function toggleRelType(id: RelationshipType) {
    const next = new Set(activeRelTypes);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setActiveRelTypes(next);
  }

  return (
    <aside
      data-tour="filter-panel"
      className="w-52 flex-shrink-0 border-r overflow-y-auto"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <div className="p-3 space-y-3">
        {/* Search */}
        <input
          type="text"
          placeholder="Search tools…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-md px-2.5 py-1.5 text-xs outline-none placeholder:text-[var(--text-muted)]"
          style={{
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            color: "var(--text-primary)",
          }}
        />

        {/* Categories grouped by stack layer */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
              Stack Layers
            </span>
            <button
              onClick={toggleAll}
              className="text-[10px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
            >
              {allOn ? "None" : "All"}
            </button>
          </div>

          <div className="space-y-1">
            {STACK_LAYERS.map((layer) => {
              const layerCats = CATEGORIES.filter((c) => layer.categories.includes(c.id));
              const isOpen = !collapsed[layer.id];
              const allLayerActive = layerCats.every((c) => activeCategories.has(c.id));
              const someLayerActive = layerCats.some((c) => activeCategories.has(c.id));

              return (
                <div key={layer.id}>
                  {/* Layer header — click to collapse, dot toggles all in layer */}
                  <div
                    className="flex items-center gap-1.5 px-2 py-1 rounded-md cursor-pointer hover:bg-[var(--surface-2)] transition-colors group"
                    onClick={() => toggleLayerCollapsed(layer.id)}
                    title={layer.description}
                  >
                    <ChevronIcon open={isOpen} />
                    <span
                      className="text-[10px] font-semibold flex-1 leading-tight"
                      style={{
                        color: someLayerActive ? "var(--text-secondary)" : "var(--text-muted)",
                        opacity: someLayerActive ? 1 : 0.5,
                      }}
                    >
                      {layer.question}
                    </span>
                    {/* Toggle all in layer */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLayerCategories(layer.categories as string[]);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-[9px] text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                    >
                      {allLayerActive ? "−" : "+"}
                    </button>
                  </div>

                  {/* Category list — collapsible */}
                  {isOpen && (
                    <div className="ml-3 mt-0.5 space-y-0.5 mb-1">
                      {layerCats.map((cat) => {
                        const active = activeCategories.has(cat.id);
                        return (
                          <button
                            key={cat.id}
                            onClick={() => toggleCategory(cat.id)}
                            className="w-full flex items-center gap-2 px-2 py-1 rounded-md text-left transition-colors hover:bg-[var(--surface-2)]"
                            style={{ opacity: active ? 1 : 0.35 }}
                          >
                            <ColorDot color={cat.color} />
                            <span className="text-[11px] text-[var(--text-secondary)] truncate">
                              {cat.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Relationship types — collapsible */}
        <div>
          <button
            className="w-full flex items-center gap-1.5 mb-1.5"
            onClick={() => setEdgesCollapsed((v) => !v)}
          >
            <ChevronIcon open={!edgesCollapsed} />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
              Edges
            </span>
          </button>

          {!edgesCollapsed && (
            <div className="space-y-0.5">
              {REL_TYPES.map((rt) => {
                const active = activeRelTypes.has(rt.id);
                return (
                  <button
                    key={rt.id}
                    onClick={() => toggleRelType(rt.id)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-colors hover:bg-[var(--surface-2)]"
                    style={{ opacity: active ? 1 : 0.35 }}
                  >
                    <div className="w-6 flex items-center flex-shrink-0">
                      <div
                        className="w-full"
                        style={{
                          height: rt.style === "solid" ? 1.5 : 0,
                          background: rt.style === "solid" ? "#8888aa" : "transparent",
                          borderTop:
                            rt.style === "dashed"
                              ? "1px dashed #8888aa"
                              : rt.style === "dotted"
                                ? "1px dotted #8888aa"
                                : "none",
                        }}
                      />
                    </div>
                    <span className="text-[11px] text-[var(--text-secondary)]">{rt.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Suggest a Tool footer */}
      <div
        style={{
          borderTop: "1px solid var(--border)",
          padding: "10px 12px",
          marginTop: 4,
        }}
      >
        <button
          onClick={() => openSuggest(searchQuery)}
          style={{
            width: "100%",
            padding: "7px 10px",
            borderRadius: 7,
            background: "var(--btn)",
            border: "1px solid var(--btn-border)",
            color: "#555577",
            fontSize: 11,
            cursor: "pointer",
            textAlign: "center",
            transition: "color 150ms, border-color 150ms",
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
          + Suggest a missing tool
        </button>
      </div>
    </aside>
  );
}
