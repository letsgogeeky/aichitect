import { Suspense } from "react";
import { Metadata } from "next";
import ExploreGraph from "@/components/graph/ExploreGraph";
import toolsData from "@/data/tools.json";
import { Tool } from "@/lib/types";

const tools = toolsData as Tool[];

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ compare?: string }>;
}): Promise<Metadata> {
  const { compare } = await searchParams;
  if (!compare) return {};

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

export default function ExplorePage() {
  return (
    <Suspense fallback={null}>
      <ExploreGraph />
    </Suspense>
  );
}
