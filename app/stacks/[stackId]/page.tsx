import { notFound } from "next/navigation";
import stacksData from "@/data/stacks.json";
import toolsData from "@/data/tools.json";
import { loadStacksData } from "@/lib/data-loaders";
import { pageMeta } from "@/lib/metadata";
import { SITE_URL } from "@/lib/constants";
import type { Stack, Tool } from "@/lib/types";
import StacksClient from "../StacksClient";

export async function generateStaticParams() {
  return (stacksData as Stack[]).map((s) => ({ stackId: s.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ stackId: string }> }) {
  const { stackId } = await params;
  const stack = (stacksData as Stack[]).find((s) => s.id === stackId);
  if (!stack) return {};

  return pageMeta({
    title: `${stack.name} — AI Stack`,
    description: stack.description,
    path: `/stacks/${stackId}`,
    ogImage: `/stacks/${stackId}/opengraph-image`,
    ogImageAlt: stack.name,
  });
}

export default async function StackPage({ params }: { params: Promise<{ stackId: string }> }) {
  const { stackId } = await params;
  const stack = (stacksData as Stack[]).find((s) => s.id === stackId);
  if (!stack) notFound();

  const { tools, stacks } = await loadStacksData();

  const toolList = stack.tools
    .map((id) => (toolsData as Tool[]).find((t) => t.id === id))
    .filter((t): t is Tool => Boolean(t));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: stack.name,
    description: stack.description,
    url: `${SITE_URL}/stacks/${stackId}`,
    numberOfItems: toolList.length,
    itemListElement: toolList.map((t, i) => ({
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
      <StacksClient stacks={stacks} tools={tools} initialStackId={stackId} />
    </>
  );
}
