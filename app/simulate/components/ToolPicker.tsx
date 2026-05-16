"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import type { Tool } from "@/lib/types";
import { getCategoryColor } from "@/lib/types";

interface Props {
  label: string;
  tools: Tool[];
  value: string | undefined;
  onChange: (toolId: string | undefined) => void;
  /** Optional secondary text per option (e.g., "$0.0025 / 1k input"). Also shown on the collapsed button. */
  hintFor?: (tool: Tool) => string | undefined;
}

const SEARCH_THRESHOLD = 8;

export default function ToolPicker({ label, tools, value, onChange, hintFor }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = tools.find((t) => t.id === value);
  const showSearch = tools.length >= SEARCH_THRESHOLD;

  const filtered = useMemo(() => {
    if (!query) return tools;
    const q = query.toLowerCase();
    return tools.filter((t) => t.name.toLowerCase().includes(q) || t.id.includes(q));
  }, [tools, query]);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const selectedHint = selected ? hintFor?.(selected) : undefined;

  return (
    <div
      ref={rootRef}
      style={{ position: "relative", display: "flex", flexDirection: "column", gap: 6 }}
    >
      <label style={{ fontSize: 13, color: "var(--text-secondary)" }}>{label}</label>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          background: "var(--surface-2)",
          border: `1px solid ${selected ? getCategoryColor(selected.category) + "66" : "var(--border)"}`,
          borderRadius: 6,
          padding: "10px 12px",
          textAlign: "left",
          color: selected ? "var(--text-primary)" : "var(--text-muted)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
          fontSize: 14,
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
          {selected ? selected.name : "Pick one"}
        </span>
        {selectedHint && (
          <span
            style={{
              fontSize: 11,
              color: "var(--text-muted)",
              fontVariantNumeric: "tabular-nums",
              flexShrink: 0,
            }}
          >
            {selectedHint}
          </span>
        )}
        <span style={{ color: "var(--text-muted)", fontSize: 12, flexShrink: 0 }}>
          {open ? "▴" : "▾"}
        </span>
      </button>

      {open && (
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
          {showSearch && (
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${label.toLowerCase()}…`}
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
          )}
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
            <li>
              <button
                type="button"
                onClick={() => {
                  onChange(undefined);
                  setOpen(false);
                  setQuery("");
                }}
                style={optionStyle(value === undefined)}
              >
                <span style={{ color: "var(--text-muted)", fontSize: 13 }}>None</span>
              </button>
            </li>
            {filtered.length === 0 && (
              <li style={{ padding: "8px 10px", fontSize: 12, color: "var(--text-muted)" }}>
                No matches.
              </li>
            )}
            {filtered.map((t) => {
              const hint = hintFor?.(t);
              const active = value === t.id;
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(t.id);
                      setOpen(false);
                      setQuery("");
                    }}
                    style={optionStyle(active)}
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

function optionStyle(active: boolean): React.CSSProperties {
  return {
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
  };
}
