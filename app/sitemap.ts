import type { MetadataRoute } from "next";
import toolsData from "@/data/tools.json";
import relationshipsData from "@/data/relationships.json";
import { Tool, Relationship } from "@/lib/types";

const BASE = "https://aichitect.dev";
const tools = toolsData as Tool[];
const relationships = relationshipsData as Relationship[];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // Core pages
  const core: MetadataRoute.Sitemap = [
    { url: BASE, priority: 1, changeFrequency: "weekly", lastModified: now },
    { url: `${BASE}/explore`, priority: 0.9, changeFrequency: "weekly", lastModified: now },
    { url: `${BASE}/stacks`, priority: 0.8, changeFrequency: "monthly", lastModified: now },
    { url: `${BASE}/builder`, priority: 0.8, changeFrequency: "monthly", lastModified: now },
  ];

  // Comparison pages — prominent tool pairs with direct relationships
  const prominentIds = new Set(tools.filter((t) => t.prominent).map((t) => t.id));
  const comparisonPages: MetadataRoute.Sitemap = relationships
    .filter((r) => prominentIds.has(r.source) && prominentIds.has(r.target))
    .map((r) => ({
      url: `${BASE}/compare/${r.source}/${r.target}`,
      priority: 0.7,
      changeFrequency: "monthly" as const,
      lastModified: now,
    }));

  return [...core, ...comparisonPages];
}
