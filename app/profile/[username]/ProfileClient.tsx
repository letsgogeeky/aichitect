"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/db";
import toolsData from "@/data/tools.json";
import { Tool, getCategoryColor } from "@/lib/types";
import { SITE_URL } from "@/lib/constants";

const allTools = toolsData as Tool[];

interface ToolUsageRow {
  tool_id: string;
  avatar_url: string | null;
  used_at: string;
}

interface Props {
  username: string;
}

export default function ProfileClient({ username }: Props) {
  const [rows, setRows] = useState<ToolUsageRow[]>([]);
  const [loading, setLoading] = useState(createSupabaseBrowserClient() !== null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;
    supabase
      .from("tool_usage")
      .select("tool_id, avatar_url, used_at")
      .eq("github_username", username)
      .order("used_at", { ascending: false })
      .then(({ data }) => {
        setRows((data as ToolUsageRow[]) ?? []);
        setLoading(false);
      });
  }, [username]);

  const tools = rows.map((r) => allTools.find((t) => t.id === r.tool_id)).filter(Boolean) as Tool[];

  const avatarUrl = rows.find((r) => r.avatar_url)?.avatar_url ?? null;

  function badgeUrl(toolId: string) {
    return `${SITE_URL}/badge/tool/${toolId}`;
  }

  function badgeMarkdown(tool: Tool) {
    return `[![${tool.name}](${badgeUrl(tool.id)})](${SITE_URL}/explore)`;
  }

  function copyBadge(tool: Tool) {
    navigator.clipboard.writeText(badgeMarkdown(tool)).then(() => {
      setCopiedId(tool.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

  function copyAll() {
    const markdown = tools.map(badgeMarkdown).join("\n");
    navigator.clipboard.writeText(markdown).then(() => {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    });
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      {/* Breadcrumb */}
      <nav
        className="flex items-center gap-1.5 text-[11px] mb-8"
        style={{ color: "var(--text-muted)" }}
      >
        <Link href="/" className="hover:underline">
          AIchitect
        </Link>
        <span>/</span>
        <span style={{ color: "var(--text-secondary)" }}>{username}</span>
      </nav>

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={username}
            className="w-12 h-12 rounded-full"
            style={{ border: "2px solid var(--border)" }}
          />
        ) : (
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
            style={{
              background: "#7c6bff22",
              color: "var(--accent)",
              border: "2px solid #7c6bff44",
            }}
          >
            {username[0]?.toUpperCase()}
          </div>
        )}
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            @{username}
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            AI tools I use
          </p>
        </div>
      </div>

      {loading && (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Loading…
        </p>
      )}

      {!loading && tools.length === 0 && (
        <div
          className="rounded-xl p-8 text-center"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            No tools marked yet.
          </p>
          <Link
            href="/explore"
            className="inline-block mt-3 text-xs font-medium px-3 py-1.5 rounded-md"
            style={{
              background: "#7c6bff18",
              color: "var(--accent)",
              border: "1px solid #7c6bff44",
            }}
          >
            Explore tools →
          </Link>
        </div>
      )}

      {!loading && tools.length > 0 && (
        <>
          {/* Badge wall */}
          <div className="flex flex-wrap gap-2 mb-6">
            {tools.map((tool) => {
              const color = getCategoryColor(tool.category);
              const isCopied = copiedId === tool.id;
              return (
                <button
                  key={tool.id}
                  onClick={() => copyBadge(tool)}
                  title={isCopied ? "Copied!" : `Copy badge for ${tool.name}`}
                  className="group relative"
                  style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={badgeUrl(tool.id)}
                    alt={`${tool.name} badge`}
                    className="h-5 transition-opacity"
                    style={{ opacity: isCopied ? 0.6 : 1 }}
                  />
                  <span
                    className="absolute inset-0 flex items-center justify-center text-[9px] font-semibold rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{
                      background: color + "dd",
                      color: "#fff",
                      fontSize: 9,
                    }}
                  >
                    {isCopied ? "Copied!" : "Copy"}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Copy all section */}
          <div
            className="rounded-xl p-4 space-y-3"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <div>
              <p className="text-[11px] font-semibold" style={{ color: "var(--text-primary)" }}>
                Add to your GitHub README
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                Paste all {tools.length} badge{tools.length !== 1 ? "s" : ""} as Markdown — each
                links back to AIchitect.
              </p>
            </div>
            <div
              className="rounded px-2 py-2 font-mono text-[9px] break-all leading-relaxed max-h-24 overflow-y-auto"
              style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}
            >
              {tools.map(badgeMarkdown).join("\n")}
            </div>
            <button
              onClick={copyAll}
              className="w-full py-2 rounded text-[10px] font-semibold transition-all"
              style={{
                background: copiedAll ? "#26de8122" : "var(--accent)",
                color: copiedAll ? "var(--success)" : "#fff",
                border: copiedAll ? "1px solid #26de8144" : "none",
              }}
            >
              {copiedAll
                ? "Copied!"
                : `Copy all ${tools.length} badge${tools.length !== 1 ? "s" : ""}`}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
