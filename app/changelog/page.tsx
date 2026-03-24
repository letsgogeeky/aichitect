import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/metadata";
import { getTools } from "@/lib/data/tools";
import { getCategoryColor } from "@/lib/types";

export const metadata: Metadata = pageMeta({
  title: "Changelog",
  description:
    "Recently added tools, new stacks, and pricing updates — see what's changed in the AI tool landscape.",
  path: "/changelog",
});

const NEW_WINDOW_DAYS = 30;

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
}

function relativeDate(iso: string): string {
  const days = daysSince(iso);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function ChangelogPage() {
  const tools = await getTools();

  const recentTools = tools
    .filter((t) => t.added_at && daysSince(t.added_at) <= NEW_WINDOW_DAYS)
    .sort((a, b) => new Date(b.added_at!).getTime() - new Date(a.added_at!).getTime());

  const syncedTools = tools
    .filter((t) => t.last_synced_at)
    .sort((a, b) => new Date(b.last_synced_at!).getTime() - new Date(a.last_synced_at!).getTime())
    .slice(0, 8);

  return (
    <div
      style={{
        maxWidth: 680,
        margin: "0 auto",
        padding: "48px 20px 80px",
      }}
    >
      {/* Page header */}
      <div style={{ marginBottom: 48 }}>
        <p
          style={{
            fontSize: 11,
            color: "var(--accent)",
            margin: "0 0 10px",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            fontWeight: 700,
          }}
        >
          Freshness Log
        </p>
        <h1
          style={{
            fontSize: 30,
            fontWeight: 800,
            color: "#f0f0f8",
            margin: "0 0 10px",
            letterSpacing: -0.5,
          }}
        >
          Changelog
        </h1>
        <p style={{ fontSize: 14, color: "#8888aa", lineHeight: 1.6, margin: 0 }}>
          The AI tool landscape changes weekly. Here&apos;s what&apos;s new, recently synced, and
          what&apos;s coming. Tools with no update in 90+ days are flagged as stale.
        </p>
      </div>

      {/* Recently added */}
      <Section
        title="Recently added"
        subtitle={`${recentTools.length > 0 ? recentTools.length : "No"} tools added in the last ${NEW_WINDOW_DAYS} days`}
        accent="var(--accent)"
      >
        {recentTools.length === 0 ? (
          <EmptyState message="No new tools added in the last 30 days. Check back soon or suggest one on GitHub." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {recentTools.map((tool) => {
              const color = getCategoryColor(tool.category);
              return (
                <div
                  key={tool.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 14px",
                    borderRadius: 10,
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: color,
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#f0f0f8" }}>
                        {tool.name}
                      </span>
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          color: "var(--accent)",
                          background: "#7c6bff20",
                          border: "1px solid #7c6bff44",
                          padding: "1px 6px",
                          borderRadius: 8,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        New
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          color: "#555577",
                          textTransform: "capitalize",
                        }}
                      >
                        {tool.category.replace(/-/g, " ")}
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: 11,
                        color: "#555577",
                        margin: 0,
                        lineHeight: 1.4,
                        overflow: "hidden",
                        display: "-webkit-box",
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {tool.tagline}
                    </p>
                  </div>
                  <div style={{ flexShrink: 0, textAlign: "right" }}>
                    <span style={{ fontSize: 10, color: "#555577" }}>
                      {relativeDate(tool.added_at!)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {/* Health syncs */}
      <Section
        title="Health syncs"
        subtitle="Tools with the most recent GitHub health data"
        accent="var(--accent-2)"
      >
        {syncedTools.length === 0 ? (
          <EmptyState message="Health sync pipeline not yet active. Coming in Phase 1 — AIC-9." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {syncedTools.map((tool) => (
              <div
                key={tool.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 14px",
                  borderRadius: 8,
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                }}
              >
                <div
                  title={`Health score: ${tool.health_score}`}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    flexShrink: 0,
                    background:
                      (tool.health_score ?? 0) >= 70
                        ? "var(--success)"
                        : (tool.health_score ?? 0) >= 40
                          ? "var(--warning)"
                          : "var(--danger)",
                  }}
                />
                <span style={{ flex: 1, fontSize: 12, color: "#c0c0d8" }}>{tool.name}</span>
                {tool.health_score != null && (
                  <span style={{ fontSize: 10, color: "#555577" }}>score {tool.health_score}</span>
                )}
                <span style={{ fontSize: 10, color: "#555577" }}>
                  {relativeDate(tool.last_synced_at!)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* What's coming */}
      <Section title="What's coming" subtitle="Planned freshness improvements" accent="#fd9644">
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { id: "AIC-9", label: "Nightly GitHub health sync cron job", status: "planned" },
            { id: "AIC-45", label: "Pricing change detection pipeline", status: "planned" },
            {
              id: "AIC-8",
              label: "GitHub API integration for star counts and commit activity",
              status: "planned",
            },
          ].map((item) => (
            <div
              key={item.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 14px",
                borderRadius: 8,
                background: "var(--surface)",
                border: "1px solid var(--border)",
              }}
            >
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: "#fd9644",
                  background: "#fd964418",
                  border: "1px solid #fd964433",
                  padding: "1px 6px",
                  borderRadius: 6,
                  fontFamily: "monospace",
                  flexShrink: 0,
                }}
              >
                {item.id}
              </span>
              <span style={{ flex: 1, fontSize: 12, color: "#8888aa" }}>{item.label}</span>
              <span
                style={{
                  fontSize: 9,
                  color: "#555577",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                {item.status}
              </span>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 11, color: "#444466", margin: "12px 0 0", lineHeight: 1.5 }}>
          Want to contribute or suggest a tool?{" "}
          <Link
            href="https://github.com/ramymoussa/aichitect"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--accent)", textDecoration: "none" }}
          >
            Open an issue on GitHub →
          </Link>
        </p>
      </Section>
    </div>
  );
}

// ─── Layout helpers ────────────────────────────────────────────────────────────

function Section({
  title,
  subtitle,
  accent,
  children,
}: {
  title: string;
  subtitle: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 44 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
        <div style={{ width: 3, height: 14, borderRadius: 2, background: accent, flexShrink: 0 }} />
        <h2 style={{ fontSize: 15, fontWeight: 700, color: "#f0f0f8", margin: 0 }}>{title}</h2>
      </div>
      <p style={{ fontSize: 11, color: "#555577", margin: "0 0 14px 13px" }}>{subtitle}</p>
      {children}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div
      style={{
        padding: "18px 16px",
        borderRadius: 10,
        background: "var(--surface)",
        border: "1px solid var(--border)",
        textAlign: "center",
      }}
    >
      <p style={{ fontSize: 12, color: "#555577", margin: 0, lineHeight: 1.5 }}>{message}</p>
    </div>
  );
}
