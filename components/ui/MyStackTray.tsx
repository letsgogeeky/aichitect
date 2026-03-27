"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import toolsData from "@/data/tools.json";
import { Tool, getCategoryColor } from "@/lib/types";

const allTools = toolsData as Tool[];

export default function MyStackTray() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [minimized, setMinimized] = useState(false);

  const stackIds = (searchParams.get("s") ?? "").split(",").filter(Boolean);
  const stackTools = stackIds
    .map((id) => allTools.find((t) => t.id === id))
    .filter(Boolean) as Tool[];

  if (stackTools.length === 0) return null;

  const builderUrl = `/builder?s=${stackIds.join(",")}`;
  const visible = stackTools.slice(0, 4);
  const overflow = stackTools.length - 4;

  function removeTool(toolId: string) {
    const next = stackIds.filter((id) => id !== toolId);
    const url = new URL(window.location.href);
    if (next.length > 0) url.searchParams.set("s", next.join(","));
    else url.searchParams.delete("s");
    router.replace(url.pathname + url.search, { scroll: false });
  }

  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-xl"
      style={{
        background: "#0e0e18ee",
        border: "1px solid var(--btn-border)",
        backdropFilter: "blur(12px)",
        boxShadow: "0 8px 32px #00000077",
        padding: minimized ? "6px 14px" : "8px 12px",
        maxWidth: "90vw",
        transition: "padding 150ms ease",
      }}
    >
      {minimized ? (
        <>
          {/* Minimized: count + expand */}
          <div className="flex items-center gap-2">
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--accent)",
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: 12, color: "#8888aa" }}>
              {stackTools.length} tool{stackTools.length !== 1 ? "s" : ""} in stack
            </span>
          </div>
          <div style={{ width: 1, height: 16, background: "var(--btn-border)", flexShrink: 0 }} />
          <Link
            href={builderUrl}
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "var(--accent)",
              textDecoration: "none",
              flexShrink: 0,
            }}
          >
            Open in Builder →
          </Link>
          <button
            onClick={() => setMinimized(false)}
            title="Expand"
            style={{ color: "#555577", lineHeight: 1, flexShrink: 0 }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M2 8L6 4L10 8"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </>
      ) : (
        <>
          {/* Tool pills */}
          <div className="flex items-center gap-1.5">
            {visible.map((t) => {
              const c = getCategoryColor(t.category);
              return (
                <div
                  key={t.id}
                  className="group/pill relative flex items-center gap-1.5 px-2 py-1 rounded-md flex-shrink-0"
                  style={{ background: c + "18", border: `1px solid ${c}33` }}
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
                  <span style={{ fontSize: 12, fontWeight: 500, color: c }}>{t.name}</span>
                  {/* Remove on hover */}
                  <button
                    onClick={() => removeTool(t.id)}
                    title={`Remove ${t.name}`}
                    className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full items-center justify-center hidden group-hover/pill:flex transition-all"
                    style={{
                      background: "#1e1e2e",
                      border: "1px solid #3a3a4a",
                      color: "#8888aa",
                      fontSize: 8,
                      lineHeight: 1,
                    }}
                  >
                    ✕
                  </button>
                </div>
              );
            })}
            {overflow > 0 && (
              <span style={{ fontSize: 12, color: "#555577", flexShrink: 0 }}>
                +{overflow} more
              </span>
            )}
          </div>

          <div style={{ width: 1, height: 20, background: "var(--btn-border)", flexShrink: 0 }} />

          {/* Open in Builder */}
          <Link
            href={builderUrl}
            className="flex items-center flex-shrink-0 transition-all"
            style={{
              padding: "0 12px",
              height: 28,
              borderRadius: 7,
              background: "var(--accent)",
              color: "#fff",
              fontSize: 12,
              fontWeight: 600,
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            Open in Builder →
          </Link>

          {/* Minimize */}
          <button
            onClick={() => setMinimized(true)}
            title="Minimize"
            style={{ color: "#555577", lineHeight: 1, flexShrink: 0 }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M2 4L6 8L10 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </>
      )}
    </div>
  );
}
