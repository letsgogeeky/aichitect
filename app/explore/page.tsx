export const revalidate = 86400;

import { Suspense } from "react";
import { Metadata } from "next";
import ExploreGraph from "@/components/graph/ExploreGraph";
import { loadGraphData } from "@/lib/data-loaders";
import { getTools } from "@/lib/data/tools";
import { pageMeta } from "@/lib/metadata";
import { SITE_URL, TOOL_COUNT, CATEGORY_COUNT, RELATIONSHIP_COUNT } from "@/lib/constants";

/**
 * Server-rendered placeholder that gives the browser real DOM to paint before
 * the ReactFlow client bundle hydrates. Without this Lighthouse's LCP candidate
 * is the post-hydration graph render, which charged us 47 points on /explore.
 */
function GraphSkeleton() {
  return (
    <div
      className="flex h-[calc(100vh-56px)] w-full items-center justify-center"
      style={{ background: "var(--bg)" }}
    >
      <div className="px-6 text-center">
        <h1
          className="mb-2 text-2xl font-semibold tracking-tight"
          style={{ color: "var(--text-primary)" }}
        >
          The AI tool landscape
        </h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          {TOOL_COUNT} tools · {CATEGORY_COUNT} categories · {RELATIONSHIP_COUNT} relationships
        </p>
        <div
          className="mt-6 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px]"
          style={{ background: "var(--surface)", color: "var(--text-muted)" }}
        >
          <span
            className="inline-block h-1.5 w-1.5 animate-pulse rounded-full"
            style={{ background: "var(--accent)" }}
          />
          Loading graph…
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ compare?: string; tool?: string }>;
}): Promise<Metadata> {
  const { compare, tool: toolId } = await searchParams;

  const tools = await getTools();

  if (compare) {
    const [aId, bId] = compare.split(",");
    const a = tools.find((t) => t.id === aId);
    const b = tools.find((t) => t.id === bId);
    if (!a || !b) return {};

    const title = `${a.name} vs ${b.name}`;
    const description = `Compare ${a.name} and ${b.name} — pricing, integrations, and shared connections in the AI ecosystem. ${a.tagline} vs ${b.tagline}`;

    return {
      title,
      description,
      openGraph: { title, description },
      twitter: { card: "summary_large_image", title, description },
      alternates: { canonical: `${SITE_URL}/compare/${aId}/${bId}` },
    };
  }

  if (toolId) {
    const tool = tools.find((t) => t.id === toolId);
    if (!tool) return {};

    return pageMeta({
      title: tool.name,
      description: `${tool.name} — ${tool.tagline}. Explore integrations, connections, and alternatives in the AI ecosystem.`,
      path: `/explore?tool=${toolId}`,
      ogImage: `/explore/og?tool=${toolId}`,
      ogImageAlt: tool.name,
    });
  }

  return {};
}

export default async function ExplorePage() {
  const { tools, relationships } = await loadGraphData();
  return (
    <Suspense fallback={<GraphSkeleton />}>
      <ExploreGraph initialTools={tools} initialRelationships={relationships} />
    </Suspense>
  );
}
