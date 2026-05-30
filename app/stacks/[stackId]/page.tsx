import { notFound } from "next/navigation";
import { Suspense } from "react";
import stacksData from "@/data/stacks.json";
import toolsData from "@/data/tools.json";
import { loadStacksData } from "@/lib/data-loaders";
import { pageMeta } from "@/lib/metadata";
import { SITE_URL } from "@/lib/constants";
import { STACK_CLUSTERS, type Stack, type Tool } from "@/lib/types";
import StacksClient from "../StacksClient";

/**
 * Server-rendered shell that gives Lighthouse a real LCP element before
 * StacksClient hydrates ReactFlow on the client. Mirrors what the user
 * sees post-hydration so there's no layout shift.
 */
function StackShellSkeleton({ stack }: { stack: Stack }) {
  const cluster = STACK_CLUSTERS.find((c) => c.id === stack.cluster);
  return (
    <div
      className="flex h-[calc(100vh-56px)] w-full flex-col px-6 py-8"
      style={{ background: "var(--bg)" }}
    >
      <div
        className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-widest"
        style={{ color: "var(--text-muted)" }}
      >
        {cluster && <span>{cluster.label}</span>}
        <span>· {stack.tools.length} tools</span>
      </div>
      <h1
        className="mb-2 text-2xl font-semibold tracking-tight"
        style={{ color: "var(--text-primary)" }}
      >
        {stack.name}
      </h1>
      <p className="max-w-2xl text-sm" style={{ color: "var(--text-secondary)" }}>
        {stack.description}
      </p>
      <div
        className="mt-8 inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-[11px]"
        style={{ background: "var(--surface)", color: "var(--text-muted)" }}
      >
        <span
          className="inline-block h-1.5 w-1.5 animate-pulse rounded-full"
          style={{ background: "var(--accent)" }}
        />
        Loading stack…
      </div>
    </div>
  );
}

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
      <Suspense fallback={<StackShellSkeleton stack={stack} />}>
        <StacksClient stacks={stacks} tools={tools} initialStackId={stackId} />
      </Suspense>
    </>
  );
}
