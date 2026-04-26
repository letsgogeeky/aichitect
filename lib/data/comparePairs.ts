import type { Tool, Relationship } from "@/lib/types";

/** Max compare pairs included in sitemap and static generation. */
const MAX_PAIRS = 200;

/**
 * Returns up to MAX_PAIRS unique prominent tool pairs for static generation
 * and sitemap inclusion. Strategy:
 *  1. Cross-product of prominent tools within the same category (unique pairs, A < B alphabetically)
 *  2. Relationship-edged pairs appear first; same-category-only pairs fill the remainder
 */
export function getComparePairs(
  tools: Tool[],
  relationships: Relationship[]
): { toolA: string; toolB: string }[] {
  const prominent = tools.filter((t) => t.prominent);

  const relSet = new Set(relationships.map((r) => `${r.source}|${r.target}`));

  const byCategory = new Map<string, Tool[]>();
  for (const t of prominent) {
    const bucket = byCategory.get(t.category) ?? [];
    bucket.push(t);
    byCategory.set(t.category, bucket);
  }

  const withEdge: { toolA: string; toolB: string }[] = [];
  const withoutEdge: { toolA: string; toolB: string }[] = [];

  for (const cats of byCategory.values()) {
    for (let i = 0; i < cats.length; i++) {
      for (let j = i + 1; j < cats.length; j++) {
        const a = cats[i].id < cats[j].id ? cats[i].id : cats[j].id;
        const b = cats[i].id < cats[j].id ? cats[j].id : cats[i].id;
        const hasEdge = relSet.has(`${a}|${b}`) || relSet.has(`${b}|${a}`);
        (hasEdge ? withEdge : withoutEdge).push({ toolA: a, toolB: b });
      }
    }
  }

  return [...withEdge, ...withoutEdge].slice(0, MAX_PAIRS);
}
