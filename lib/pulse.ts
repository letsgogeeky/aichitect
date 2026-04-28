import { createClient } from "@supabase/supabase-js";
import toolsJson from "@/data/tools.json";
import { CATEGORIES, getCategoryColor } from "@/lib/types";
import type { CategoryId, Tool } from "@/lib/types";
import { getTools } from "@/lib/data/tools";

export interface PulseToolRow {
  id: string;
  name: string;
  type: "oss" | "commercial";
  health_score: number | null;
  stars: number | null;
  stars_delta: number | null;
  is_stale: boolean;
  website_url: string | null;
  github_url: string | null;
}

/**
 * Returns tools for a category ranked by health_score desc,
 * enriched with live data from Supabase (falls back to static JSON).
 */
export async function getCategoryTools(categoryId: CategoryId): Promise<PulseToolRow[]> {
  const allTools = await getTools();
  const categoryTools = allTools.filter((t) => t.category === categoryId);

  const rows: PulseToolRow[] = categoryTools.map((t) => ({
    id: t.id,
    name: t.name,
    type: t.type,
    health_score: t.health_score ?? null,
    stars: t.github_stars ?? null,
    stars_delta: t.stars_delta ?? null,
    is_stale: t.is_stale ?? false,
    website_url: t.website_url,
    github_url: t.github_url,
  }));

  // Sort: health_score desc (nulls last), then stars desc
  rows.sort((a, b) => {
    if (a.health_score == null && b.health_score == null) return (b.stars ?? 0) - (a.stars ?? 0);
    if (a.health_score == null) return 1;
    if (b.health_score == null) return -1;
    return b.health_score - a.health_score;
  });

  return rows;
}

export interface CategoryMomentum {
  category_id: CategoryId;
  label: string;
  color: string;
  tool_count: number;
  tracked_count: number;
  /** Tools with both a current snapshot AND a 30d baseline — what momentum is actually computed from */
  baseline_count: number;
  avg_health_now: number | null;
  avg_health_30d: number | null;
  momentum: number | null;
  at_risk_count: number;
  rising_count: number;
}

function getClient() {
  const url = process.env.NEXT_PUBLIC_POSTGRES_SUPABASE_URL;
  const key =
    process.env.POSTGRES_SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_POSTGRES_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function buildEmptyCategories(): CategoryMomentum[] {
  const tools = toolsJson as Tool[];
  return CATEGORIES.map((c) => ({
    category_id: c.id,
    label: c.label,
    color: getCategoryColor(c.id),
    tool_count: tools.filter((t) => t.category === c.id).length,
    tracked_count: 0,
    baseline_count: 0,
    avg_health_now: null,
    avg_health_30d: null,
    momentum: null,
    at_risk_count: 0,
    rising_count: 0,
  }));
}

/**
 * Aggregate 30-day category momentum from tool_snapshots + tool_events.
 * Returns an empty-but-structured list when the DB is unavailable.
 * Safe to call directly from server components — no HTTP round-trip.
 */
export async function getCategoryMomentum(): Promise<CategoryMomentum[]> {
  const db = getClient();
  if (!db) return buildEmptyCategories();

  const tools = toolsJson as Tool[];

  const toolsByCategory = new Map<CategoryId, Tool[]>();
  for (const tool of tools) {
    if (!toolsByCategory.has(tool.category)) toolsByCategory.set(tool.category, []);
    toolsByCategory.get(tool.category)!.push(tool);
  }

  const trackedToolIds = tools.filter((t) => t.github_url).map((t) => t.id);
  if (trackedToolIds.length === 0) return buildEmptyCategories();

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [latestResult, baselineResult, eventsResult] = await Promise.all([
    db
      .from("tool_snapshots")
      .select("tool_id, health_score")
      .in("tool_id", trackedToolIds)
      .order("recorded_at", { ascending: false }),
    db
      .from("tool_snapshots")
      .select("tool_id, health_score")
      .in("tool_id", trackedToolIds)
      .lte("recorded_at", thirtyDaysAgo)
      .order("recorded_at", { ascending: false }),
    db
      .from("tool_events")
      .select("tool_id, type")
      .in("tool_id", trackedToolIds)
      .in("type", ["stale_transition", "archived_detected", "star_milestone"])
      .gte("detected_at", thirtyDaysAgo),
  ]);

  if (latestResult.error) return buildEmptyCategories();

  // Most-recent snapshot per tool
  const latestByTool = new Map<string, number | null>();
  for (const row of latestResult.data ?? []) {
    if (!latestByTool.has(row.tool_id))
      latestByTool.set(row.tool_id, row.health_score as number | null);
  }

  // 30-day-ago baseline per tool
  const baselineByTool = new Map<string, number | null>();
  for (const row of baselineResult.data ?? []) {
    if (!baselineByTool.has(row.tool_id))
      baselineByTool.set(row.tool_id, row.health_score as number | null);
  }

  const atRiskByTool = new Set<string>();
  const risingByTool = new Set<string>();
  for (const ev of eventsResult.data ?? []) {
    if (ev.type === "stale_transition" || ev.type === "archived_detected")
      atRiskByTool.add(ev.tool_id);
    else if (ev.type === "star_milestone") risingByTool.add(ev.tool_id);
  }

  const results: CategoryMomentum[] = CATEGORIES.map((catMeta) => {
    const categoryTools = toolsByCategory.get(catMeta.id) ?? [];
    const tracked = categoryTools.filter((t) => t.github_url);

    let sumNow = 0,
      countNow = 0,
      sum30d = 0,
      count30d = 0;
    let baselineCount = 0;
    let atRiskCount = 0,
      risingCount = 0;

    for (const tool of tracked) {
      const scoreNow = latestByTool.get(tool.id);
      if (scoreNow != null) {
        sumNow += scoreNow;
        countNow++;
      }

      const score30d = baselineByTool.get(tool.id);
      if (score30d != null) {
        sum30d += score30d;
        count30d++;
      }

      // Baseline count = tools that contribute to the delta (need both sides)
      if (scoreNow != null && score30d != null) baselineCount++;

      if (atRiskByTool.has(tool.id)) atRiskCount++;
      if (risingByTool.has(tool.id)) risingCount++;
    }

    const avgNow = countNow > 0 ? sumNow / countNow : null;
    const avg30d = count30d > 0 ? sum30d / count30d : null;
    const momentum = avgNow != null && avg30d != null ? avgNow - avg30d : null;

    return {
      category_id: catMeta.id,
      label: catMeta.label,
      color: getCategoryColor(catMeta.id),
      tool_count: categoryTools.length,
      tracked_count: tracked.length,
      baseline_count: baselineCount,
      avg_health_now: avgNow != null ? Math.round(avgNow) : null,
      avg_health_30d: avg30d != null ? Math.round(avg30d) : null,
      momentum: momentum != null ? Math.round(momentum) : null,
      at_risk_count: atRiskCount,
      rising_count: risingCount,
    };
  });

  results.sort((a, b) => {
    const aScore = a.momentum ?? (a.avg_health_now != null ? a.avg_health_now - 1000 : null);
    const bScore = b.momentum ?? (b.avg_health_now != null ? b.avg_health_now - 1000 : null);
    if (aScore == null && bScore == null) return 0;
    if (aScore == null) return 1;
    if (bScore == null) return -1;
    return bScore - aScore;
  });

  return results;
}
