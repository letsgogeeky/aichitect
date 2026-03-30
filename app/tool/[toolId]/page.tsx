import { notFound } from "next/navigation";
import Link from "next/link";
import toolsData from "@/data/tools.json";
import relationshipsData from "@/data/relationships.json";
import stacksData from "@/data/stacks.json";
import slotsData from "@/data/slots.json";
import type { Tool, Relationship, Stack, Slot } from "@/lib/types";
import { getCategoryColor, CATEGORIES } from "@/lib/types";
import { getToolById } from "@/lib/data/tools";
import { pageMeta } from "@/lib/metadata";
import { healthColor, healthLabel } from "@/lib/health";
import { SITE_URL } from "@/lib/constants";

const allTools = toolsData as Tool[];
const allRelationships = relationshipsData as Relationship[];
const allStacks = stacksData as Stack[];
const allSlots = slotsData as Slot[];

const SLOT_PRIORITY_LABEL: Record<string, string> = {
  required: "Required",
  recommended: "Recommended",
  optional: "Optional",
  "not-applicable": "Not applicable",
};

const SLOT_PRIORITY_COLOR: Record<string, string> = {
  required: "#ff6b6b",
  recommended: "#fdcb6e",
  optional: "#74b9ff",
  "not-applicable": "#44446a",
};

const USE_CONTEXT_LABEL: Record<string, string> = {
  "dev-productivity": "Dev Productivity",
  "app-infrastructure": "App Infrastructure",
  both: "Dev Productivity & App Infrastructure",
};

interface Props {
  params: Promise<{ toolId: string }>;
}

// ─── Static params ────────────────────────────────────────────────────────────

export async function generateStaticParams() {
  return allTools.map((t) => ({ toolId: t.id }));
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props) {
  const { toolId } = await params;
  const tool = allTools.find((t) => t.id === toolId);
  if (!tool) return {};

  const catLabel = CATEGORIES.find((c) => c.id === tool.category)?.label ?? tool.category;

  return pageMeta({
    title: `${tool.name} — ${catLabel} AI Tool`,
    description: `${tool.tagline}. ${tool.description.slice(0, 120)}… Compare, explore integrations, and add ${tool.name} to your AI stack.`,
    path: `/tool/${toolId}`,
    ogImage: `/tool/${toolId}/opengraph-image`,
    ogImageAlt: `${tool.name} — ${catLabel}`,
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isNew(addedAt: string | null | undefined): boolean {
  if (!addedAt) return false;
  const diffDays = (Date.now() - new Date(addedAt).getTime()) / (1000 * 60 * 60 * 24);
  return diffDays <= 60;
}

function hasAliases(tool: Tool): boolean {
  const a = tool.aliases;
  if (!a) return false;
  return (
    (a.npm?.length ?? 0) > 0 ||
    (a.pip?.length ?? 0) > 0 ||
    (a.env_vars?.length ?? 0) > 0 ||
    (a.config_files?.length ?? 0) > 0
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ToolPage({ params }: Props) {
  const { toolId } = await params;

  // Prefer DB data (has health fields); fall back to static JSON
  const tool = (await getToolById(toolId)) ?? allTools.find((t) => t.id === toolId);
  if (!tool) notFound();

  const color = getCategoryColor(tool.category);
  const catLabel = CATEGORIES.find((c) => c.id === tool.category)?.label ?? tool.category;

  // ── Slot ──────────────────────────────────────────────────────────────────
  const slot = allSlots.find((s) => s.id === tool.slot);
  const slotPeers = slot
    ? (slot.tools
        .filter((id) => id !== tool.id)
        .map((id) => allTools.find((t) => t.id === id))
        .filter(Boolean) as Tool[])
    : [];

  // ── Relationships ──────────────────────────────────────────────────────────
  const rawRels = allRelationships.filter((r) => r.source === tool.id || r.target === tool.id);

  // Deduplicate: A→B and B→A can both exist
  const seen = new Set<string>();
  const rels = rawRels
    .map((r) => {
      const otherId = r.source === tool.id ? r.target : r.source;
      const other = allTools.find((t) => t.id === otherId);
      if (!other) return null;
      const key = `${other.id}-${r.type}`;
      if (seen.has(key)) return null;
      seen.add(key);
      return { other, type: r.type, how: r.how, achieves: r.achieves };
    })
    .filter(Boolean) as { other: Tool; type: string; how?: string; achieves?: string }[];

  const integrates = rels.filter((r) => r.type === "integrates-with");
  const paired = rels.filter((r) => r.type === "commonly-paired-with");
  const competes = rels.filter((r) => r.type === "competes-with");

  // ── Stacks ────────────────────────────────────────────────────────────────
  const featuredIn = allStacks.filter((s) => s.tools.includes(tool.id));
  const rejectedBy = allStacks
    .map((s) => {
      const rejection = s.not_in_stack?.find((r) => r.tool === tool.id);
      return rejection ? { stack: s, reason: rejection.reason } : null;
    })
    .filter(Boolean) as { stack: Stack; reason: string }[];

  // ── JSON-LD ───────────────────────────────────────────────────────────────
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: tool.name,
    description: tool.description,
    applicationCategory: catLabel,
    ...(tool.website_url && { url: tool.website_url }),
    ...(tool.github_stars && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "5",
        reviewCount: tool.github_stars,
      },
    }),
    offers: tool.pricing.free_tier
      ? { "@type": "Offer", price: "0", priceCurrency: "USD" }
      : undefined,
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
          <span style={{ color: "var(--text-secondary)" }}>{tool.name}</span>
        </nav>

        {/* Stale warning */}
        {tool.is_stale && (
          <div
            className="mb-6 text-sm font-medium px-4 py-3 rounded-xl"
            style={{ background: "#f39c1218", border: "1px solid #f39c1240", color: "#f39c12" }}
          >
            ⚠ This tool appears inactive — no commits in 90+ days. Consider an alternative.
          </div>
        )}

        {/* Hero */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ background: color + "22", color, border: `1px solid ${color}44` }}
            >
              {catLabel}
            </span>
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded uppercase"
              style={
                tool.type === "oss"
                  ? { background: "#26de8122", color: "var(--success)" }
                  : { background: "#4ecdc422", color: "#4ecdc4" }
              }
            >
              {tool.type === "oss" ? "Open Source" : "Commercial"}
            </span>
            {tool.pricing.free_tier && (
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded"
                style={{ background: "#00d4aa18", color: "#00d4aa", border: "1px solid #00d4aa33" }}
              >
                ✦ Free Tier
              </span>
            )}
            {isNew(tool.added_at) && (
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded"
                style={{ background: "#a29bfe18", color: "#a29bfe", border: "1px solid #a29bfe33" }}
              >
                New
              </span>
            )}
          </div>

          <h1
            className="text-4xl font-bold mb-2 leading-tight"
            style={{
              color: "var(--text-primary)",
              borderLeft: `4px solid ${color}`,
              paddingLeft: 16,
            }}
          >
            {tool.name}
          </h1>
          <p className="text-base mb-4" style={{ color: "var(--text-secondary)" }}>
            {tool.tagline}
          </p>

          {/* Health + stars + use context row */}
          <div className="flex items-center gap-4 flex-wrap mb-6 text-sm">
            {tool.github_stars && (
              <span style={{ color: "var(--text-muted)" }}>
                ⭐ {tool.github_stars.toLocaleString()} stars
              </span>
            )}
            {tool.health_score != null && (
              <span className="font-medium" style={{ color: healthColor(tool.health_score) }}>
                ● Health {tool.health_score} — {healthLabel(tool.health_score)}
              </span>
            )}
            {tool.provider && (
              <span style={{ color: "var(--text-muted)" }}>by {tool.provider}</span>
            )}
            {tool.use_context && (
              <span
                className="text-xs px-2 py-0.5 rounded"
                style={{
                  background: "var(--surface-2)",
                  color: "var(--text-muted)",
                  border: "1px solid var(--border)",
                }}
              >
                {USE_CONTEXT_LABEL[tool.use_context]}
              </span>
            )}
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/builder?s=${tool.id}`}
              className="text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
              style={{ background: color, color: "#fff" }}
            >
              Open in Builder →
            </Link>
            {tool.website_url && (
              <a
                href={tool.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                style={{ background: color + "18", color, border: `1px solid ${color}44` }}
              >
                Website ↗
              </a>
            )}
            {tool.github_url && (
              <a
                href={tool.github_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium px-4 py-2 rounded-lg border transition-colors"
                style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
              >
                GitHub ↗
              </a>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-6">
            {/* About */}
            <section
              className="rounded-xl p-6"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderTop: `3px solid ${color}`,
              }}
            >
              <h2
                className="text-xs font-semibold uppercase tracking-widest mb-3"
                style={{ color }}
              >
                About
              </h2>
              <p
                className="text-sm leading-relaxed mb-4"
                style={{ color: "var(--text-secondary)" }}
              >
                {tool.description}
              </p>
              {tool.choose_if && tool.choose_if.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold mb-2" style={{ color: "var(--text-muted)" }}>
                    Choose {tool.name} when…
                  </h3>
                  <ul className="space-y-1.5">
                    {tool.choose_if.map((signal, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="mt-0.5 flex-shrink-0" style={{ color }}>
                          •
                        </span>
                        <span style={{ color: "var(--text-secondary)" }}>{signal}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>

            {/* Builder slot context */}
            {slot && (
              <section
                className="rounded-xl p-6"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
              >
                <h2
                  className="text-xs font-semibold uppercase tracking-widest mb-1"
                  style={{ color: "var(--text-muted)" }}
                >
                  Builder Slot
                </h2>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    {slot.name}
                  </span>
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded"
                    style={{
                      background: SLOT_PRIORITY_COLOR[slot.priority["hybrid"]] + "22",
                      color: SLOT_PRIORITY_COLOR[slot.priority["hybrid"]],
                      border: `1px solid ${SLOT_PRIORITY_COLOR[slot.priority["hybrid"]]}44`,
                    }}
                  >
                    {SLOT_PRIORITY_LABEL[slot.priority["hybrid"]]} for most stacks
                  </span>
                </div>
                <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
                  {slot.description}
                </p>

                {/* Per-archetype priority */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {(["dev-productivity", "app-infrastructure", "hybrid"] as const).map((arch) => (
                    <div
                      key={arch}
                      className="text-center px-2 py-2 rounded-lg"
                      style={{ background: "var(--surface-2)" }}
                    >
                      <div className="text-[10px] mb-1" style={{ color: "var(--text-muted)" }}>
                        {arch === "dev-productivity"
                          ? "Dev Tools"
                          : arch === "app-infrastructure"
                            ? "App Infra"
                            : "Hybrid"}
                      </div>
                      <div
                        className="text-[10px] font-semibold"
                        style={{ color: SLOT_PRIORITY_COLOR[slot.priority[arch]] }}
                      >
                        {SLOT_PRIORITY_LABEL[slot.priority[arch]]}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Slot peers */}
                {slotPeers.length > 0 && (
                  <div>
                    <p className="text-[10px] mb-2" style={{ color: "var(--text-muted)" }}>
                      Other tools in this slot:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {slotPeers.slice(0, 8).map((peer) => {
                        const c = getCategoryColor(peer.category);
                        return (
                          <Link
                            key={peer.id}
                            href={`/tool/${peer.id}`}
                            className="text-[11px] px-2 py-0.5 rounded-full transition-colors"
                            style={{ background: c + "18", border: `1px solid ${c}33`, color: c }}
                          >
                            {peer.name}
                          </Link>
                        );
                      })}
                      {slotPeers.length > 8 && (
                        <Link
                          href={`/builder?s=${tool.id}`}
                          className="text-[11px] px-2 py-0.5 rounded-full"
                          style={{
                            background: "var(--surface-2)",
                            color: "var(--text-muted)",
                            border: "1px solid var(--border)",
                          }}
                        >
                          +{slotPeers.length - 8} more
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Genome detection signals */}
            {hasAliases(tool) && (
              <section
                className="rounded-xl p-6"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
              >
                <h2
                  className="text-xs font-semibold uppercase tracking-widest mb-1"
                  style={{ color: "var(--text-muted)" }}
                >
                  Stack Genome Detection
                </h2>
                <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
                  AIchitect&apos;s{" "}
                  <Link href="/genome" style={{ color: "var(--accent)" }}>
                    Genome scanner
                  </Link>{" "}
                  detects {tool.name} in your project via these signals:
                </p>
                <div className="space-y-3">
                  {tool.aliases?.npm && tool.aliases.npm.length > 0 && (
                    <div>
                      <span
                        className="text-[10px] font-semibold uppercase tracking-wider"
                        style={{ color: "var(--text-muted)" }}
                      >
                        npm packages
                      </span>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {tool.aliases.npm.map((pkg) => (
                          <code
                            key={pkg}
                            className="text-[11px] px-2 py-0.5 rounded"
                            style={{
                              background: "#fdcb6e18",
                              color: "#fdcb6e",
                              border: "1px solid #fdcb6e33",
                            }}
                          >
                            {pkg}
                          </code>
                        ))}
                      </div>
                    </div>
                  )}
                  {tool.aliases?.pip && tool.aliases.pip.length > 0 && (
                    <div>
                      <span
                        className="text-[10px] font-semibold uppercase tracking-wider"
                        style={{ color: "var(--text-muted)" }}
                      >
                        pip packages
                      </span>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {tool.aliases.pip.map((pkg) => (
                          <code
                            key={pkg}
                            className="text-[11px] px-2 py-0.5 rounded"
                            style={{
                              background: "#26de8118",
                              color: "#26de81",
                              border: "1px solid #26de8133",
                            }}
                          >
                            {pkg}
                          </code>
                        ))}
                      </div>
                    </div>
                  )}
                  {tool.aliases?.env_vars && tool.aliases.env_vars.length > 0 && (
                    <div>
                      <span
                        className="text-[10px] font-semibold uppercase tracking-wider"
                        style={{ color: "var(--text-muted)" }}
                      >
                        env vars
                      </span>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {tool.aliases.env_vars.map((v) => (
                          <code
                            key={v}
                            className="text-[11px] px-2 py-0.5 rounded"
                            style={{
                              background: "#4ecdc418",
                              color: "#4ecdc4",
                              border: "1px solid #4ecdc433",
                            }}
                          >
                            {v}
                          </code>
                        ))}
                      </div>
                    </div>
                  )}
                  {tool.aliases?.config_files && tool.aliases.config_files.length > 0 && (
                    <div>
                      <span
                        className="text-[10px] font-semibold uppercase tracking-wider"
                        style={{ color: "var(--text-muted)" }}
                      >
                        config files
                      </span>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {tool.aliases.config_files.map((f) => (
                          <code
                            key={f}
                            className="text-[11px] px-2 py-0.5 rounded"
                            style={{
                              background: "#a29bfe18",
                              color: "#a29bfe",
                              border: "1px solid #a29bfe33",
                            }}
                          >
                            {f}
                          </code>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Integrations */}
            {integrates.length > 0 && (
              <section
                className="rounded-xl p-6"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
              >
                <h2
                  className="text-xs font-semibold uppercase tracking-widest mb-4"
                  style={{ color: "var(--text-muted)" }}
                >
                  Integrates with ({integrates.length})
                </h2>
                <div className="space-y-2">
                  {integrates.map(({ other, how, achieves }) => {
                    const c = getCategoryColor(other.category);
                    return (
                      <div
                        key={other.id}
                        className="flex items-start justify-between gap-3 p-3 rounded-lg"
                        style={{ background: "var(--surface-2)" }}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Link
                              href={`/tool/${other.id}`}
                              className="text-sm font-medium hover:underline"
                              style={{ color: "var(--text-primary)" }}
                            >
                              {other.name}
                            </Link>
                            <span
                              className="text-[10px] px-1.5 py-0.5 rounded-full"
                              style={{ background: c + "22", color: c }}
                            >
                              {CATEGORIES.find((cat) => cat.id === other.category)?.label}
                            </span>
                          </div>
                          {how && (
                            <p
                              className="text-xs leading-snug"
                              style={{ color: "var(--text-muted)" }}
                            >
                              {how}
                            </p>
                          )}
                          {achieves && (
                            <p
                              className="text-xs leading-snug mt-0.5"
                              style={{ color: "var(--text-muted)", opacity: 0.7 }}
                            >
                              → {achieves}
                            </p>
                          )}
                        </div>
                        <Link
                          href={`/compare/${tool.id}/${other.id}`}
                          className="flex-shrink-0 text-[10px] px-2 py-1 rounded transition-colors"
                          style={{
                            background: "#7c6bff18",
                            color: "var(--accent)",
                            border: "1px solid #7c6bff33",
                          }}
                        >
                          Compare →
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Commonly paired with */}
            {paired.length > 0 && (
              <section
                className="rounded-xl p-6"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
              >
                <h2
                  className="text-xs font-semibold uppercase tracking-widest mb-4"
                  style={{ color: "var(--text-muted)" }}
                >
                  Often paired with ({paired.length})
                </h2>
                <div className="flex flex-wrap gap-2">
                  {paired.map(({ other }) => {
                    const c = getCategoryColor(other.category);
                    return (
                      <Link
                        key={other.id}
                        href={`/tool/${other.id}`}
                        className="text-xs px-3 py-1.5 rounded-full transition-colors"
                        style={{ background: c + "18", border: `1px solid ${c}33`, color: c }}
                      >
                        {other.name}
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Competes with / alternatives */}
            {competes.length > 0 && (
              <section
                className="rounded-xl p-6"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
              >
                <h2
                  className="text-xs font-semibold uppercase tracking-widest mb-4"
                  style={{ color: "var(--text-muted)" }}
                >
                  Alternatives to consider ({competes.length})
                </h2>
                <div className="grid grid-cols-2 gap-2">
                  {competes.map(({ other }) => {
                    const c = getCategoryColor(other.category);
                    return (
                      <Link
                        key={other.id}
                        href={`/compare/${tool.id}/${other.id}`}
                        className="flex items-center justify-between p-3 rounded-lg text-sm transition-colors"
                        style={{
                          background: "var(--surface-2)",
                          border: "1px solid var(--border)",
                          color: "var(--text-primary)",
                        }}
                      >
                        <span>{other.name}</span>
                        <span className="text-[10px] ml-2 flex-shrink-0" style={{ color: c }}>
                          compare →
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Pricing */}
            <section
              className="rounded-xl p-5"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <h2
                className="text-xs font-semibold uppercase tracking-widest mb-3"
                style={{ color: "var(--text-muted)" }}
              >
                Pricing
              </h2>
              <div className="space-y-2">
                {tool.pricing.free_tier && (
                  <div
                    className="text-xs font-medium px-2.5 py-1.5 rounded-lg"
                    style={{
                      background: "#00d4aa18",
                      color: "#00d4aa",
                      border: "1px solid #00d4aa33",
                    }}
                  >
                    ✦ Free tier available
                  </div>
                )}
                {tool.pricing.plans.map((p, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg"
                    style={{ background: "var(--surface-2)", color: "var(--text-secondary)" }}
                  >
                    <span className="font-medium">{p.name}</span>
                    <span style={{ color: "var(--text-muted)" }}>{p.price}</span>
                  </div>
                ))}
                {!tool.pricing.free_tier && tool.pricing.plans.length === 0 && (
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    No pricing info available.
                  </p>
                )}
              </div>
            </section>

            {/* Featured in stacks */}
            {featuredIn.length > 0 && (
              <section
                className="rounded-xl p-5"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
              >
                <h2
                  className="text-xs font-semibold uppercase tracking-widest mb-3"
                  style={{ color: "var(--text-muted)" }}
                >
                  In {featuredIn.length} stack{featuredIn.length !== 1 ? "s" : ""}
                </h2>
                <div className="space-y-1.5">
                  {featuredIn.map((stack) => (
                    <Link
                      key={stack.id}
                      href="/stacks"
                      className="block text-xs px-2.5 py-1.5 rounded-lg transition-colors"
                      style={{
                        background: "var(--surface-2)",
                        color: "var(--text-secondary)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      {stack.name}
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Ruled out by */}
            {rejectedBy.length > 0 && (
              <section
                className="rounded-xl p-5"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
              >
                <h2
                  className="text-xs font-semibold uppercase tracking-widest mb-3"
                  style={{ color: "#ff6b6b99" }}
                >
                  Ruled out by {rejectedBy.length} stack{rejectedBy.length !== 1 ? "s" : ""}
                </h2>
                <div className="space-y-2">
                  {rejectedBy.map(({ stack, reason }) => (
                    <div
                      key={stack.id}
                      className="px-2.5 py-2 rounded-lg"
                      style={{ background: "#ff6b6b08", border: "1px solid #ff6b6b18" }}
                    >
                      <div
                        className="text-xs font-medium mb-0.5"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {stack.name}
                      </div>
                      <div className="text-[11px] leading-snug" style={{ color: "#ff6b6b99" }}>
                        &ldquo;{reason}&rdquo;
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Badge */}
            <section
              className="rounded-xl p-5"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <h2
                className="text-xs font-semibold uppercase tracking-widest mb-2"
                style={{ color: "var(--text-muted)" }}
              >
                Badge
              </h2>
              <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
                Add to your GitHub README
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${SITE_URL}/badge/tool/${tool.id}`}
                alt={`${tool.name} on AIchitect`}
                className="mb-2"
              />
              <code
                className="block text-[10px] px-2 py-1.5 rounded break-all"
                style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}
              >
                {`[![${tool.name}](${SITE_URL}/badge/tool/${tool.id})](${SITE_URL}/tool/${tool.id})`}
              </code>
            </section>
          </div>
        </div>

        {/* Footer CTA */}
        <div
          className="mt-8 rounded-xl p-5 flex items-center justify-between"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <div>
            <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
              Explore the full AI landscape
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              See how {tool.name} fits into the bigger picture — browse all 207 tools and their
              relationships.
            </p>
          </div>
          <Link
            href="/explore"
            className="flex-shrink-0 ml-4 text-xs font-semibold px-4 py-2 rounded-md transition-colors"
            style={{ background: "var(--accent)", color: "#fff" }}
          >
            Explore graph →
          </Link>
        </div>
      </div>
    </>
  );
}
