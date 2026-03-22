import type { Metadata } from "next";
import { loadBuilderData } from "@/lib/data-loaders";
import { pageMeta } from "@/lib/metadata";
import BuilderClient from "./BuilderClient";

const BASE_META = {
  title: "Builder — Build Your AI Stack",
  description:
    "Pick one tool per slot and watch your stack wire together with live integration edges. Share your exact stack via URL.",
  path: "/builder",
  ogImageAlt: "AIchitect Builder — Build Your AI Stack",
} as const;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ s?: string }>;
}): Promise<Metadata> {
  const { s } = await searchParams;
  const ogImage = s?.trim() ? `/builder/opengraph-image?s=${s}` : "/builder/opengraph-image";
  return pageMeta({ ...BASE_META, ogImage });
}

export default async function BuilderPage() {
  const { tools, relationships, slots } = await loadBuilderData();
  return <BuilderClient slots={slots} tools={tools} relationships={relationships} />;
}
