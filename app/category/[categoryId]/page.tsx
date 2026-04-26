import { notFound } from "next/navigation";
import Link from "next/link";
import toolsData from "@/data/tools.json";
import { CATEGORIES, getCategoryColor, type CategoryId } from "@/lib/types";
import type { Tool } from "@/lib/types";
import { pageMeta } from "@/lib/metadata";
import { SITE_URL } from "@/lib/constants";
import { healthColor, healthLabel } from "@/lib/health";

const allTools = toolsData as Tool[];

interface Props {
  params: Promise<{ categoryId: string }>;
}

// ─── Static params ────────────────────────────────────────────────────────────

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ categoryId: c.id }));
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props) {
  const { categoryId } = await params;
  const cat = CATEGORIES.find((c) => c.id === categoryId);
  if (!cat) return {};

  const toolCount = allTools.filter((t) => t.category === categoryId).length;

  return pageMeta({
    title: `${cat.label} Tools`,
    description: `Browse ${toolCount} ${cat.label} tools. Compare pricing, integrations, and health scores to pick the right tool for your AI stack.`,
    path: `/category/${categoryId}`,
    ogImage: `/category/${categoryId}/opengraph-image`,
    ogImageAlt: `${cat.label} — AI Tools`,
  });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CategoryPage({ params }: Props) {
  const { categoryId } = await params;
  const cat = CATEGORIES.find((c) => c.id === categoryId);
  if (!cat) notFound();

  const color = getCategoryColor(categoryId as CategoryId);
  const tools = allTools
    .filter((t) => t.category === categoryId)
    .sort((a, b) => {
      // Prominent first, then by stars descending
      if (a.prominent && !b.prominent) return -1;
      if (!a.prominent && b.prominent) return 1;
      return (b.github_stars ?? 0) - (a.github_stars ?? 0);
    });

  const relatedCategories = CATEGORIES.filter((c) => c.id !== categoryId);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${cat.label} AI Tools`,
    description: `${tools.length} tools in the ${cat.label} category on AIchitect`,
    url: `${SITE_URL}/category/${categoryId}`,
    numberOfItems: tools.length,
    itemListElement: tools.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.name,
      url: `${SITE_URL}/tool/${t.id}`,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <nav
          className="flex items-center gap-1.5 text-xs mb-6"
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
          <span style={{ color: "var(--text-secondary)" }}>{cat.label}</span>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: color }} />
            <h1
              className="text-3xl font-bold leading-tight"
              style={{ color: "var(--text-primary)" }}
            >
              {cat.label}
            </h1>
            <span
              className="text-sm font-medium px-2.5 py-0.5 rounded-full"
              style={{ background: color + "18", color, border: `1px solid ${color}33` }}
            >
              {tools.length} tools
            </span>
          </div>
          <div className="flex flex-wrap gap-3 mt-4">
            <Link
              href={`/explore?category=${categoryId}`}
              className="text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              style={{ background: color, color: "#fff" }}
            >
              View in Explore graph →
            </Link>
            <Link
              href={`/builder`}
              className="text-sm font-medium px-4 py-2 rounded-lg"
              style={{
                background: color + "18",
                color,
                border: `1px solid ${color}44`,
              }}
            >
              Open Builder →
            </Link>
          </div>
        </div>

        {/* Accent bar */}
        <div
          className="h-px mb-8"
          style={{
            background: `linear-gradient(to right, ${color}cc, ${color}22, transparent)`,
          }}
        />

        {/* Tool grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {tools.map((tool) => {
            const isOss = tool.type === "oss";
            return (
              <Link
                key={tool.id}
                href={`/tool/${tool.id}`}
                className="block rounded-xl p-5 transition-colors group"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderTop: `3px solid ${color}`,
                  textDecoration: "none",
                }}
              >
                {/* Badges */}
                <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                  {isOss && (
                    <span
                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase"
                      style={{ background: "#26de8118", color: "#26de81" }}
                    >
                      OSS
                    </span>
                  )}
                  {tool.pricing.free_tier && (
                    <span
                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                      style={{ background: "#00d4aa18", color: "#00d4aa" }}
                    >
                      Free
                    </span>
                  )}
                  {tool.prominent && (
                    <span
                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                      style={{ background: color + "18", color }}
                    >
                      Popular
                    </span>
                  )}
                  {tool.is_stale && (
                    <span
                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                      style={{ background: "#f39c1218", color: "#f39c12" }}
                    >
                      ⚠ Stale
                    </span>
                  )}
                </div>

                {/* Name */}
                <h2
                  className="text-sm font-semibold mb-1 group-hover:underline"
                  style={{ color: "var(--text-primary)" }}
                >
                  {tool.name}
                </h2>

                {/* Tagline */}
                <p
                  className="text-xs leading-relaxed mb-3 line-clamp-2"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {tool.tagline}
                </p>

                {/* Footer row */}
                <div className="flex items-center justify-between mt-auto">
                  {tool.github_stars ? (
                    <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                      ⭐ {tool.github_stars.toLocaleString()}
                    </span>
                  ) : (
                    <span />
                  )}
                  {tool.health_score != null && (
                    <span
                      className="text-[11px] font-medium"
                      style={{ color: healthColor(tool.health_score) }}
                    >
                      ● {healthLabel(tool.health_score)}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Related categories */}
        <section>
          <h2
            className="text-xs font-semibold uppercase tracking-widest mb-4"
            style={{ color: "var(--text-muted)" }}
          >
            Other categories
          </h2>
          <div className="flex flex-wrap gap-2">
            {relatedCategories.map((c) => {
              const c_color = getCategoryColor(c.id as CategoryId);
              const count = allTools.filter((t) => t.category === c.id).length;
              return (
                <Link
                  key={c.id}
                  href={`/category/${c.id}`}
                  className="text-xs px-3 py-1.5 rounded-full transition-colors"
                  style={{
                    background: c_color + "12",
                    border: `1px solid ${c_color}30`,
                    color: c_color,
                  }}
                >
                  {c.label} ({count})
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </>
  );
}
