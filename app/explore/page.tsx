import { Suspense } from "react";
import { Metadata } from "next";
import ExploreGraph from "@/components/graph/ExploreGraph";
import { loadGraphData } from "@/lib/data-loaders";
import { getTools } from "@/lib/data/tools";
import { pageMeta } from "@/lib/metadata";

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
      alternates: { canonical: `https://aichitect.dev/compare/${aId}/${bId}` },
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
    <Suspense fallback={null}>
      <ExploreGraph initialTools={tools} initialRelationships={relationships} />
    </Suspense>
  );
}
