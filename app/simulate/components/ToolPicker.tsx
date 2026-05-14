"use client";

import { useState, useRef, useEffect } from "react";
import type { Tool } from "@/lib/types";
import { getCategoryColor } from "@/lib/types";

interface Props {
  label: string;
  tools: Tool[];
  value: string | undefined;
  onChange: (toolId: string | undefined) => void;
  /** When true, show a "None" option that clears the selection. */
  optional?: boolean;
  /** Optional secondary text per option (e.g., "$0.0025 / 1k input"). */
  hintFor?: (tool: Tool) => string | undefined;
  required?: boolean;
}

export default function ToolPicker({
  label,
  tools,
  value,
  onChange,
  optional,
  hintFor,
  required,
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = tools.find((t) => t.id === value);

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

  return (
    <div
      ref={rootRef}
      style={{ position: "relative", display: "flex", flexDirection: "column", gap: 6 }}
    >
      <label style={{ fontSize: 13, color: "var(--text-secondary)" }}>
        {label}
        {required && <span style={{ color: "var(--danger)", marginLeft: 4 }}>*</span>}
        {optional && (
          <span style={{ color: "var(--text-muted)", fontSize: 11, marginLeft: 6 }}>optional</span>
        )}
      </label>
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
          fontSize: 14,
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>{selected ? selected.name : `Choose ${label.toLowerCase()}…`}</span>
        <span style={{ color: "var(--text-muted)", fontSize: 12 }}>{open ? "▴" : "▾"}</span>
      </button>

      {open && (
        <ul
          role="listbox"
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
            padding: 4,
            listStyle: "none",
            maxHeight: 260,
            overflowY: "auto",
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
          }}
        >
          {optional && (
            <li>
              <button
                type="button"
                onClick={() => {
                  onChange(undefined);
                  setOpen(false);
                }}
                style={optionStyle(value === undefined)}
              >
                <span style={{ color: "var(--text-muted)" }}>None</span>
              </button>
            </li>
          )}
          {tools.map((t) => {
            const hint = hintFor?.(t);
            const active = value === t.id;
            return (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(t.id);
                    setOpen(false);
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
