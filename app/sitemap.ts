import type { MetadataRoute } from "next";

const BASE = "https://aichitect.dev";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE, priority: 1, changeFrequency: "weekly", lastModified: new Date() },
    { url: `${BASE}/explore`, priority: 0.9, changeFrequency: "weekly", lastModified: new Date() },
    { url: `${BASE}/stacks`, priority: 0.8, changeFrequency: "monthly", lastModified: new Date() },
    { url: `${BASE}/builder`, priority: 0.8, changeFrequency: "monthly", lastModified: new Date() },
  ];
}
