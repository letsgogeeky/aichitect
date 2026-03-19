"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toolsData from "@/data/tools.json";
import relationshipsData from "@/data/relationships.json";
import { Tool, Relationship, getCategoryColor } from "@/lib/types";

const tools = toolsData as Tool[];
const relationships = relationshipsData as Relationship[];

function getSuggestedPairs(): { a: Tool; b: Tool; type: string }[] {
  const prominent = new Set(tools.filter((t) => t.prominent).map((t) => t.id));
  const seen = new Set<string>();
  const pairs: { a: Tool; b: Tool; type: string }[] = [];
  for (const r of relationships) {
    if (pairs.length >= 8) break;
    const key = [r.source, r.target].sort().join(":");
    if (seen.has(key)) continue;
    if (prominent.has(r.source) && prominent.has(r.target)) {
      const a = tools.find((t) => t.id === r.source);
      const b = tools.find((t) => t.id === r.target);
      if (a && b) {
        seen.add(key);
        pairs.push({ a, b, type: r.type });
      }
    }
  }
  return pairs;
}

function relLabel(type: string) {
  if (type === "integrates-with") return "integrates with";
  if (type === "commonly-paired") return "often paired with";
  return "competes with";
}

function relColor(type: string) {
  if (type === "integrates-with") return "#7c6bff";
  if (type === "commonly-paired") return "#8888aa";
  return "#ff6b6b";
}

function ToolPicker({
  label,
  value,
  exclude,
  onChange,
}: {
  label: string;
  value: Tool | null;
  exclude: Tool | null;
  onChange: (t: Tool | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return tools
      .filter((t) => t.id !== exclude?.id && t.name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [query, exclude]);

  const color = value ? getCategoryColor(value.category) : "#7c6bff";

  return (
    <div style={{ position: "relative", flex: 1 }}>
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "var(--text-muted)",
          marginBottom: 6,
        }}
      >
        {label}
      </div>

      {value ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 14px",
            borderRadius: 10,
            background: "var(--surface-2)",
            border: `1px solid ${color}55`,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: color,
              flexShrink: 0,
            }}
          />
          <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>
            {value.name}
          </span>
          <button
            onClick={() => {
              onChange(null);
              setQuery("");
            }}
            style={{
              fontSize: 14,
              color: "var(--text-muted)",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "0 2px",
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>
      ) : (
        <div style={{ position: "relative" }}>
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            placeholder="Search tools..."
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: 10,
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
              fontSize: 14,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          {open && filtered.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 4px)",
                left: 0,
                right: 0,
                borderRadius: 10,
                background: "#111118",
                border: "1px solid var(--border)",
                zIndex: 50,
                overflow: "hidden",
                boxShadow: "0 8px 24px #00000066",
              }}
            >
              {filtered.map((t) => {
                const c = getCategoryColor(t.category);
                return (
                  <button
                    key={t.id}
                    onMouseDown={() => {
                      onChange(t);
                      setQuery("");
                      setOpen(false);
                    }}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "9px 14px",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "background 100ms",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#1c1c28";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "none";
                    }}
                  >
                    <div
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: c,
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontSize: 13, color: "var(--text-primary)" }}>{t.name}</span>
                    <span style={{ fontSize: 10, color: c, marginLeft: "auto", opacity: 0.8 }}>
                      {t.category.replace(/-/g, " ")}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function CompareIndexPage() {
  const router = useRouter();
  const [toolA, setToolA] = useState<Tool | null>(null);
  const [toolB, setToolB] = useState<Tool | null>(null);

  const suggestedPairs = useMemo(() => getSuggestedPairs(), []);
  const canCompare = !!(toolA && toolB);

  function handleCompare() {
    if (canCompare) router.push(`/compare/${toolA.id}/${toolB.id}`);
  }

  function swap() {
    setToolA(toolB);
    setToolB(toolA);
  }

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "48px 24px" }}>
      {/* Heading */}
      <div style={{ marginBottom: 36 }}>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: -0.5,
            color: "var(--text-primary)",
            marginBottom: 8,
          }}
        >
          Compare AI tools
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6 }}>
          Pick two tools to see a side-by-side breakdown of pricing, integrations, and ecosystem
          connections.
        </p>
      </div>

      {/* Picker row */}
      <div style={{ display: "flex", alignItems: "flex-end", gap: 10, marginBottom: 12 }}>
        <ToolPicker label="Tool A" value={toolA} exclude={toolB} onChange={setToolA} />

        <button
          onClick={swap}
          title="Swap tools"
          style={{
            flexShrink: 0,
            width: 36,
            height: 42,
            marginBottom: 0,
            borderRadius: 8,
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            color: "var(--text-muted)",
            fontSize: 16,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "color 150ms",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--text-primary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--text-muted)";
          }}
        >
          ⇄
        </button>

        <ToolPicker label="Tool B" value={toolB} exclude={toolA} onChange={setToolB} />
      </div>

      <button
        onClick={handleCompare}
        disabled={!canCompare}
        style={{
          width: "100%",
          height: 44,
          borderRadius: 10,
          background: canCompare ? "#7c6bff" : "#1c1c28",
          border: "none",
          color: canCompare ? "#fff" : "var(--text-muted)",
          fontSize: 14,
          fontWeight: 600,
          cursor: canCompare ? "pointer" : "default",
          transition: "background 150ms, color 150ms",
          marginBottom: 52,
        }}
      >
        {canCompare ? `Compare ${toolA.name} vs ${toolB.name} →` : "Select two tools to compare"}
      </button>

      {/* Suggested pairs */}
      <div>
        <h2
          style={{
            fontSize: 10,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "var(--text-muted)",
            marginBottom: 12,
          }}
        >
          Suggested comparisons
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {suggestedPairs.map(({ a, b, type }) => {
            const cA = getCategoryColor(a.category);
            const cB = getCategoryColor(b.category);
            const rc = relColor(type);
            return (
              <Link
                key={`${a.id}-${b.id}`}
                href={`/compare/${a.id}/${b.id}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                  textDecoration: "none",
                  transition: "border-color 150ms",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "#2a2a3a";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 500, color: cA }}>{a.name}</span>
                <span style={{ fontSize: 10, color: rc, flex: 1, textAlign: "center" }}>
                  {relLabel(type)}
                </span>
                <span style={{ fontSize: 13, fontWeight: 500, color: cB }}>{b.name}</span>
                <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 6 }}>→</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
