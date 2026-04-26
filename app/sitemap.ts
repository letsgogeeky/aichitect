import type { MetadataRoute } from "next";
import { getTools } from "@/lib/data/tools";
import { getRelationships } from "@/lib/data/relationships";
import { getStacks } from "@/lib/data/stacks";
import { getComparePairs } from "@/lib/data/comparePairs";
import { CATEGORIES } from "@/lib/types";

const BASE = "https://aichitect.dev";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const [tools, relationships, stacks] = await Promise.all([
    getTools(),
    getRelationships(),
    getStacks(),
  ]);

  // Core pages
  const core: MetadataRoute.Sitemap = [
    { url: BASE, priority: 1, changeFrequency: "weekly", lastModified: now },
    { url: `${BASE}/explore`, priority: 0.9, changeFrequency: "weekly", lastModified: now },
    { url: `${BASE}/stacks`, priority: 0.8, changeFrequency: "monthly", lastModified: now },
    { url: `${BASE}/builder`, priority: 0.8, changeFrequency: "monthly", lastModified: now },
    { url: `${BASE}/feed`, priority: 0.7, changeFrequency: "daily", lastModified: now },
  ];

  // Comparison pages — prominent same-category pairs, edge pairs first
  const comparisonPages: MetadataRoute.Sitemap = getComparePairs(tools, relationships).map(
    ({ toolA, toolB }) => ({
      url: `${BASE}/compare/${toolA}/${toolB}`,
      priority: 0.7,
      changeFrequency: "monthly" as const,
      lastModified: now,
    })
  );

  // Per-tool pages — one per tool ID
  const toolPages: MetadataRoute.Sitemap = tools.map((t) => ({
    url: `${BASE}/tool/${t.id}`,
    priority: t.prominent ? 0.9 : 0.7,
    changeFrequency: "weekly" as const,
    lastModified: now,
  }));

  // Dedicated stack pages — one per curated stack
  const stackPages: MetadataRoute.Sitemap = stacks.map((s) => ({
    url: `${BASE}/stacks/${s.id}`,
    priority: 0.8,
    changeFrequency: "weekly" as const,
    lastModified: now,
  }));

  // Category landing pages — one per category
  const categoryPages: MetadataRoute.Sitemap = CATEGORIES.map((c) => ({
    url: `${BASE}/category/${c.id}`,
    priority: 0.7,
    changeFrequency: "weekly" as const,
    lastModified: now,
  }));

  return [...core, ...toolPages, ...stackPages, ...categoryPages, ...comparisonPages];
}
