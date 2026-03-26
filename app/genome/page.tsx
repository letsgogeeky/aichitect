import type { Metadata } from "next";
import { loadGenomeData } from "@/lib/data-loaders";
import { pageMeta } from "@/lib/metadata";
import GenomeClient from "./GenomeClient";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ deps?: string }>;
}): Promise<Metadata> {
  const { deps } = await searchParams;
  if (!deps?.trim()) return {};

  const count = deps.split(",").filter(Boolean).length;
  return pageMeta({
    title: `Stack Genome — ${count} tool${count !== 1 ? "s" : ""} detected`,
    description: `Your AI stack scored. ${count} tool${count !== 1 ? "s" : ""} detected across your dependencies.`,
    path: `/genome?deps=${deps}`,
    ogImage: `/genome/og?deps=${deps}`,
    ogImageAlt: `Stack Genome — ${count} tools detected`,
  });
}

export default async function GenomePage() {
  const { tools, slots, stacks } = await loadGenomeData();
  return <GenomeClient tools={tools} slots={slots} stacks={stacks} />;
}
