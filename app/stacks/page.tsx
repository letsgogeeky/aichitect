export const revalidate = 86400;

import { redirect } from "next/navigation";
import { loadStacksData } from "@/lib/data-loaders";
import { pageMeta } from "@/lib/metadata";
import { STACK_COUNT } from "@/lib/constants";
import StacksClient from "./StacksClient";

export const metadata = pageMeta({
  title: "Curated AI Stacks",
  description: `Browse ${STACK_COUNT} curated AI tool stacks, grouped by use case and team size.`,
  path: "/stacks",
});

export default async function StacksPage({
  searchParams,
}: {
  searchParams: Promise<{ stack?: string }>;
}) {
  const { stack: stackId } = await searchParams;
  if (stackId) {
    redirect(`/stacks/${stackId}`);
  }

  const { tools, stacks } = await loadStacksData();
  return <StacksClient stacks={stacks} tools={tools} />;
}
