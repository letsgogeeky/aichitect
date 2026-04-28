export const revalidate = 86400;

import { redirect } from "next/navigation";
import { loadStacksData } from "@/lib/data-loaders";
import StacksClient from "./StacksClient";

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
