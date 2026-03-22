import type { Metadata } from "next";
import toolsData from "@/data/tools.json";
import { loadBuilderData } from "@/lib/data-loaders";
import { pageMeta } from "@/lib/metadata";
import type { Tool } from "@/lib/types";
import BuilderClient from "./BuilderClient";

const BASE_DESCRIPTION =
  "Pick one tool per slot and watch your stack wire together with live integration edges. Share your exact stack via URL.";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ s?: string }>;
}): Promise<Metadata> {
  const { s } = await searchParams;
  const toolIds = (s ?? "").split(",").filter(Boolean);

  let title = "Stack Builder";
  if (toolIds.length > 0) {
    const names = toolIds
      .map((id) => (toolsData as Tool[]).find((t) => t.id === id)?.name)
      .filter(Boolean) as string[];
    const shown = names.slice(0, 3);
    const extra = names.length - shown.length;
    title = shown.join(" · ") + (extra > 0 ? ` +${extra}` : "");
  }

  const ogImage = s?.trim() ? `/builder/og?s=${s}` : "/builder/og";
  return pageMeta({
    title,
    description: BASE_DESCRIPTION,
    path: "/builder",
    ogImage,
    ogImageAlt: title,
  });
}

export default async function BuilderPage() {
  const { tools, relationships, slots } = await loadBuilderData();
  return <BuilderClient slots={slots} tools={tools} relationships={relationships} />;
}
