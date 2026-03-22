import type { Metadata } from "next";
import stacksData from "@/data/stacks.json";
import { loadStacksData } from "@/lib/data-loaders";
import { pageMeta } from "@/lib/metadata";
import type { Stack } from "@/lib/types";
import StacksClient from "./StacksClient";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ stack?: string }>;
}): Promise<Metadata> {
  const { stack: stackId } = await searchParams;
  if (!stackId) return {};

  const stack = (stacksData as Stack[]).find((s) => s.id === stackId);
  if (!stack) return {};

  return pageMeta({
    title: stack.name,
    description: stack.description,
    path: `/stacks?stack=${stackId}`,
    ogImage: `/stacks/og?stack=${stackId}`,
    ogImageAlt: stack.name,
  });
}

export default async function StacksPage() {
  const { tools, stacks } = await loadStacksData();
  return <StacksClient stacks={stacks} tools={tools} />;
}
