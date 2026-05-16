"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import type { Tool } from "@/lib/types";
import { getCategoryColor } from "@/lib/types";

interface Props {
  tools: Tool[];
  value: string | undefined;
  onChange: (toolId: string) => void;
}

function priceHint(tool: Tool): string | undefined {
  const cm = tool.cost_model;
  if (!cm || cm.type !== "per_token") return undefined;
  const i = cm.input_cost_per_1k_tokens;
  if (i == null) return undefined;
  return `$${i.toFixed(4)} / 1k in`;
}

export default function LlmChipPicker({ tools, value, onChange }: Props) {
  const [moreOpen, setMoreOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  const prominent = useMemo(
    () => tools.filter((t) => t.prominent).sort((a, b) => a.name.localeCompare(b.name)),
    [tools]
  );
  const rest = useMemo(
    () => tools.filter((t) => !t.prominent).sort((a, b) => a.name.localeCompare(b.name)),
    [tools]
  );

  const selected = tools.find((t) => t.id === value);
  const selectedIsProminent = selected ? prominent.some((t) => t.id === selected.id) : false;
  const chips = useMemo(() => {
    if (selected && !selectedIsProminent) return [selected, ...prominent];
    return prominent;
  }, [selected, selectedIsProminent, prominent]);

  const filteredRest = useMemo(() => {
    if (!query) return rest;
    const q = query.toLowerCase();
    return rest.filter((t) => t.name.toLowerCase().includes(q) || t.id.includes(q));
  }, [rest, query]);

  useEffect(() => {
    if (!moreOpen) return;
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setMoreOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMoreOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [moreOpen]);

  return (
    <div
      ref={rootRef}
      style={{ position: "relative", display: "flex", flexDirection: "column", gap: 8 }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        {chips.map((t) => {
          const active = value === t.id;
          const color = getCategoryColor(t.category);
          const hint = priceHint(t);
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onChange(t.id)}
              aria-pressed={active}
              style={{
                textAlign: "left",
                background: active ? "var(--surface-2)" : "transparent",
                border: `1px solid ${active ? color + "aa" : "var(--border)"}`,
                borderRadius: 6,
                padding: "8px 10px",
                color: "var(--text-primary)",
                display: "flex",
                flexDirection: "column",
                gap: 2,
                cursor: "pointer",
                transition: "border-color 0.15s ease, background 0.15s ease",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 999,
                    background: color,
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: 13, fontWeight: 500 }}>{t.name}</span>
              </span>
              {hint && (
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--text-muted)",
                    fontVariantNumeric: "tabular-nums",
                    paddingLeft: 12,
                  }}
                >
                  {hint}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => setMoreOpen((v) => !v)}
        style={{
          background: "transparent",
          border: "none",
          color: "var(--text-muted)",
          fontSize: 12,
          textAlign: "left",
          cursor: "pointer",
          padding: "2px 0",
          alignSelf: "start",
        }}
        aria-expanded={moreOpen}
      >
        {moreOpen ? "Hide other providers ▴" : `More providers (${rest.length}) ▾`}
      </button>

      {moreOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            zIndex: 10,
            marginTop: 4,
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            padding: 6,
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search providers…"
            autoFocus
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 4,
              padding: "6px 8px",
              fontSize: 13,
              color: "var(--text-primary)",
              outline: "none",
            }}
          />
          <ul
            role="listbox"
            style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
              maxHeight: 240,
              overflowY: "auto",
            }}
          >
            {filteredRest.length === 0 && (
              <li
                style={{
                  padding: "8px 10px",
                  fontSize: 12,
                  color: "var(--text-muted)",
                }}
              >
                No matches.
              </li>
            )}
            {filteredRest.map((t) => {
              const active = value === t.id;
              const hint = priceHint(t);
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(t.id);
                      setMoreOpen(false);
                      setQuery("");
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      width: "100%",
                      padding: "8px 10px",
                      background: active ? "var(--btn)" : "transparent",
                      border: "none",
                      borderRadius: 4,
                      color: "var(--text-primary)",
                      textAlign: "left",
                      cursor: "pointer",
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 999,
                        background: getCategoryColor(t.category),
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ flex: 1, fontSize: 13 }}>{t.name}</span>
                    {hint && (
                      <span
                        style={{
                          fontSize: 11,
                          color: "var(--text-muted)",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {hint}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
