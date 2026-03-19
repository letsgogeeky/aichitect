import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";

import toolsData from "@/data/tools.json";
import relationshipsData from "@/data/relationships.json";
import { Tool, Relationship, getCategoryColor, CATEGORIES } from "@/lib/types";
import { TOOL_COUNT, RELATIONSHIP_COUNT } from "@/lib/constants";

const tools = toolsData as Tool[];
const relationships = relationshipsData as Relationship[];

interface Props {
  params: Promise<{ toolA: string; toolB: string }>;
}

// ─── Metadata ────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { toolA: aId, toolB: bId } = await params;
  const a = tools.find((t) => t.id === aId);
  const b = tools.find((t) => t.id === bId);
  if (!a || !b) return {};

  const title = `${a.name} vs ${b.name}`;
  const description = `Compare ${a.name} and ${b.name}: pricing, integrations, shared ecosystem connections, and how they relate in the AI stack. ${a.tagline} vs ${b.tagline}`;
  const canonical = `https://aichitect.dev/compare/${aId}/${bId}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical },
    twitter: { card: "summary_large_image", title, description },
  };
}

// ─── Static params (prominent tool pairs with direct relationships) ──────────

export function generateStaticParams() {
  const prominentIds = new Set(tools.filter((t) => t.prominent).map((t) => t.id));
  const pairs: { toolA: string; toolB: string }[] = [];
  for (const r of relationships) {
    if (prominentIds.has(r.source) && prominentIds.has(r.target)) {
      pairs.push({ toolA: r.source, toolB: r.target });
    }
  }
  return pairs;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function relLabel(type: string) {
  if (type === "integrates-with") return "integrates with";
  if (type === "commonly-paired") return "often paired with";
  return "competes with";
}

function relBadgeStyle(type: string): React.CSSProperties {
  if (type === "integrates-with")
    return { background: "#7c6bff22", color: "#7c6bff", border: "1px solid #7c6bff44" };
  if (type === "commonly-paired")
    return { background: "#4a4a7a44", color: "#8888aa", border: "1px solid #4a4a7a88" };
  return { background: "#ff6b6b22", color: "#ff6b6b", border: "1px solid #ff6b6b44" };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ComparePage({ params }: Props) {
  const { toolA: aId, toolB: bId } = await params;
  const a = tools.find((t) => t.id === aId);
  const b = tools.find((t) => t.id === bId);
  if (!a || !b) notFound();

  const colorA = getCategoryColor(a.category);
  const colorB = getCategoryColor(b.category);
  const catLabelA = CATEGORIES.find((c) => c.id === a.category)?.label ?? a.category;
  const catLabelB = CATEGORIES.find((c) => c.id === b.category)?.label ?? b.category;

  const connectedIdsA = new Set(
    relationships
      .filter((r) => r.source === a.id || r.target === a.id)
      .map((r) => (r.source === a.id ? r.target : r.source))
  );
  const connectedIdsB = new Set(
    relationships
      .filter((r) => r.source === b.id || r.target === b.id)
      .map((r) => (r.source === b.id ? r.target : r.source))
  );

  const sharedTools = [...connectedIdsA]
    .filter((id) => connectedIdsB.has(id))
    .map((id) => tools.find((t) => t.id === id))
    .filter(Boolean) as Tool[];
  const onlyATools = [...connectedIdsA]
    .filter((id) => !connectedIdsB.has(id))
    .map((id) => tools.find((t) => t.id === id))
    .filter(Boolean) as Tool[];
  const onlyBTools = [...connectedIdsB]
    .filter((id) => !connectedIdsA.has(id))
    .map((id) => tools.find((t) => t.id === id))
    .filter(Boolean) as Tool[];

  const directRel = relationships.find(
    (r) => (r.source === a.id && r.target === b.id) || (r.source === b.id && r.target === a.id)
  );

  const description = `Compare ${a.name} and ${b.name}: pricing, integrations, shared ecosystem connections, and how they relate in the AI stack. ${a.tagline} vs ${b.tagline}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${a.name} vs ${b.name}`,
    description,
    url: `https://aichitect.dev/compare/${aId}/${bId}`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          item: {
            "@type": "SoftwareApplication",
            name: a.name,
            description: a.description,
            applicationCategory: catLabelA,
            ...(a.urls.website && { url: a.urls.website }),
            ...(a.github_stars && {
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: "5",
                reviewCount: a.github_stars,
              },
            }),
          },
        },
        {
          "@type": "ListItem",
          position: 2,
          item: {
            "@type": "SoftwareApplication",
            name: b.name,
            description: b.description,
            applicationCategory: catLabelB,
            ...(b.urls.website && { url: b.urls.website }),
            ...(b.github_stars && {
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: "5",
                reviewCount: b.github_stars,
              },
            }),
          },
        },
      ],
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <nav
          className="flex items-center gap-1.5 text-[11px] mb-6"
          style={{ color: "var(--text-muted)" }}
        >
          <Link href="/" className="hover:underline">
            AIchitect
          </Link>
          <span>/</span>
          <Link href="/explore" className="hover:underline">
            Explore
          </Link>
          <span>/</span>
          <span style={{ color: "var(--text-secondary)" }}>
            {a.name} vs {b.name}
          </span>
        </nav>

        {/* Hero */}
        <div className="mb-10">
          {directRel && (
            <div
              className="inline-flex items-center gap-1.5 text-[10px] font-medium px-2.5 py-1 rounded-full mb-4"
              style={relBadgeStyle(directRel.type)}
            >
              These tools {relLabel(directRel.type)}
            </div>
          )}
          <h1
            className="text-3xl font-bold mb-3 leading-tight"
            style={{ color: "var(--text-primary)" }}
          >
            <span style={{ color: colorA }}>{a.name}</span>
            <span className="mx-4" style={{ color: "var(--text-muted)" }}>
              vs
            </span>
            <span style={{ color: colorB }}>{b.name}</span>
          </h1>
          <p
            className="text-sm leading-relaxed max-w-2xl mb-5"
            style={{ color: "var(--text-secondary)" }}
          >
            {a.tagline} versus {b.tagline}
          </p>
          <Link
            href={`/explore?compare=${a.id},${b.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md transition-colors"
            style={{ background: "#7c6bff18", border: "1px solid #7c6bff44", color: "#7c6bff" }}
          >
            Compare interactively in Explore →
          </Link>
        </div>

        {/* Comparison grid */}
        <section
          className="mb-8 rounded-xl overflow-hidden"
          style={{ border: "1px solid var(--border)" }}
        >
          <h2 className="sr-only">Side-by-side comparison</h2>

          {/* Column headers */}
          <div
            className="grid grid-cols-[160px_1fr_1fr] text-[11px] font-semibold uppercase tracking-wide"
            style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}
          >
            <div className="px-4 py-3 text-[var(--text-muted)]">Field</div>
            <div
              className="px-4 py-3 border-l"
              style={{ borderColor: "var(--border)", color: colorA }}
            >
              {a.name}
            </div>
            <div
              className="px-4 py-3 border-l"
              style={{ borderColor: "var(--border)", color: colorB }}
            >
              {b.name}
            </div>
          </div>

          {[
            {
              label: "Category",
              cellA: (
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{ background: colorA + "22", color: colorA }}
                >
                  {catLabelA}
                </span>
              ),
              cellB: (
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{ background: colorB + "22", color: colorB }}
                >
                  {catLabelB}
                </span>
              ),
            },
            {
              label: "Type",
              cellA: (
                <span
                  className="text-[11px] font-semibold px-1.5 py-0.5 rounded uppercase"
                  style={
                    a.type === "oss"
                      ? { background: "#26de8122", color: "#26de81" }
                      : { background: "#4ecdc422", color: "#4ecdc4" }
                  }
                >
                  {a.type === "oss" ? "Open Source" : "Commercial"}
                </span>
              ),
              cellB: (
                <span
                  className="text-[11px] font-semibold px-1.5 py-0.5 rounded uppercase"
                  style={
                    b.type === "oss"
                      ? { background: "#26de8122", color: "#26de81" }
                      : { background: "#4ecdc422", color: "#4ecdc4" }
                  }
                >
                  {b.type === "oss" ? "Open Source" : "Commercial"}
                </span>
              ),
            },
            {
              label: "Free Tier",
              cellA: (
                <span
                  className={`text-sm font-medium ${a.pricing.free_tier ? "text-[#26de81]" : "text-[var(--text-muted)]"}`}
                >
                  {a.pricing.free_tier ? "✓ Yes" : "✗ No"}
                </span>
              ),
              cellB: (
                <span
                  className={`text-sm font-medium ${b.pricing.free_tier ? "text-[#26de81]" : "text-[var(--text-muted)]"}`}
                >
                  {b.pricing.free_tier ? "✓ Yes" : "✗ No"}
                </span>
              ),
            },
            {
              label: "Pricing Plans",
              align: "top" as const,
              cellA:
                a.pricing.plans.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {a.pricing.plans.map((p, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-1.5 py-0.5 rounded border border-[var(--border)] text-[var(--text-secondary)]"
                      >
                        {p.name}: {p.price}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-[var(--text-muted)]">—</span>
                ),
              cellB:
                b.pricing.plans.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {b.pricing.plans.map((p, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-1.5 py-0.5 rounded border border-[var(--border)] text-[var(--text-secondary)]"
                      >
                        {p.name}: {p.price}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-[var(--text-muted)]">—</span>
                ),
            },
            {
              label: "GitHub Stars",
              cellA: a.github_stars ? (
                <span className="text-xs text-[var(--text-secondary)]">
                  ⭐ {a.github_stars.toLocaleString()}
                </span>
              ) : (
                <span className="text-xs text-[var(--text-muted)]">—</span>
              ),
              cellB: b.github_stars ? (
                <span className="text-xs text-[var(--text-secondary)]">
                  ⭐ {b.github_stars.toLocaleString()}
                </span>
              ) : (
                <span className="text-xs text-[var(--text-muted)]">—</span>
              ),
            },
          ].map(({ label, cellA, cellB, align }) => (
            <div
              key={label}
              className={`grid grid-cols-[160px_1fr_1fr] ${align === "top" ? "items-start" : "items-center"}`}
              style={{ borderTop: "1px solid var(--border)" }}
            >
              <div className="px-4 py-3 text-xs text-[var(--text-muted)]">{label}</div>
              <div className="px-4 py-3 border-l" style={{ borderColor: "var(--border)" }}>
                {cellA}
              </div>
              <div className="px-4 py-3 border-l" style={{ borderColor: "var(--border)" }}>
                {cellB}
              </div>
            </div>
          ))}
        </section>

        {/* Descriptions */}
        <section className="grid grid-cols-2 gap-4 mb-8">
          {[
            { tool: a, color: colorA },
            { tool: b, color: colorB },
          ].map(({ tool, color }) => (
            <div
              key={tool.id}
              className="rounded-xl p-5 space-y-2"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderTop: `3px solid ${color}`,
              }}
            >
              <h3 className="text-sm font-semibold" style={{ color }}>
                {tool.name}
              </h3>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {tool.description}
              </p>
              <div className="flex gap-2 pt-1">
                {tool.urls.website && (
                  <a
                    href={tool.urls.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-medium px-2 py-1 rounded transition-colors"
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
                    className="text-[10px] font-medium px-2 py-1 rounded border border-[var(--border)] transition-colors"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    GitHub ↗
                  </a>
                )}
              </div>
            </div>
          ))}
        </section>

        {/* Ecosystem connections */}
        {sharedTools.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
              Shared Connections
              <span className="ml-2 text-[10px] font-normal" style={{ color: "var(--text-muted)" }}>
                {sharedTools.length} tools both integrate with
              </span>
            </h2>
            <div className="flex flex-wrap gap-2">
              {sharedTools.map((t) => {
                const c = getCategoryColor(t.category);
                return (
                  <Link
                    key={t.id}
                    href={`/explore?compare=${a.id},${t.id}`}
                    className="text-xs px-2.5 py-1 rounded-full transition-colors"
                    style={{ background: c + "18", border: `1px solid ${c}33`, color: c }}
                  >
                    {t.name}
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {(onlyATools.length > 0 || onlyBTools.length > 0) && (
          <section className="grid grid-cols-2 gap-4 mb-8">
            {[
              { label: `Only ${a.name}`, tools: onlyATools, color: colorA },
              { label: `Only ${b.name}`, tools: onlyBTools, color: colorB },
            ].map(({ label, tools: tList, color }) => (
              <div key={label}>
                <h2
                  className="text-xs font-semibold uppercase tracking-widest mb-2"
                  style={{ color: color + "cc" }}
                >
                  {label} ({tList.length})
                </h2>
                <div className="flex flex-wrap gap-1.5">
                  {tList.slice(0, 10).map((t) => {
                    const c = getCategoryColor(t.category);
                    return (
                      <span
                        key={t.id}
                        className="text-[10px] px-2 py-0.5 rounded-full"
                        style={{ background: c + "18", border: `1px solid ${c}33`, color: c }}
                      >
                        {t.name}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Footer CTA */}
        <div
          className="rounded-xl p-5 flex items-center justify-between"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <div>
            <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
              Explore the full AI landscape
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              See how {a.name} and {b.name} fit into the bigger picture — {TOOL_COUNT} tools,{" "}
              {RELATIONSHIP_COUNT} relationships, all mapped.
            </p>
          </div>
          <Link
            href={`/explore?compare=${a.id},${b.id}`}
            className="flex-shrink-0 ml-4 text-xs font-semibold px-4 py-2 rounded-md transition-colors"
            style={{ background: "#7c6bff", color: "#fff" }}
          >
            Open in Explore →
          </Link>
        </div>
      </div>
    </>
  );
}
