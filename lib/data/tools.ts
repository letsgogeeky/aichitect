import { unstable_cache } from "next/cache";
import { supabase } from "@/lib/db";
import type { Tool } from "@/lib/types";
import toolsJson from "@/data/tools.json";

const fallback = toolsJson as Tool[];

const _getTools = unstable_cache(
  async (): Promise<Tool[]> => {
    if (!supabase) return fallback;
    const { data, error } = await supabase.from("tools").select("*").order("name");
    if (error || !data?.length) return fallback;
    return data as unknown as Tool[];
  },
  ["tools-all"],
  { revalidate: 3600, tags: ["tools"] }
);

export async function getTools(): Promise<Tool[]> {
  return _getTools();
}

export async function getToolById(id: string): Promise<Tool | null> {
  if (!supabase) return fallback.find((t) => t.id === id) ?? null;
  const { data, error } = await supabase.from("tools").select("*").eq("id", id).maybeSingle();
  if (error || !data) return fallback.find((t) => t.id === id) ?? null;
  return data as unknown as Tool;
}

export interface ToolEvent {
  id: string;
  tool_id: string;
  type: string;
  detected_at: string;
  old_hash: string | null;
  new_hash: string | null;
  metadata: Record<string, unknown>;
}

export async function getToolEvents(toolId: string, type?: string): Promise<ToolEvent[]> {
  if (!supabase) return [];
  let query = supabase
    .from("tool_events")
    .select("*")
    .eq("tool_id", toolId)
    .order("detected_at", { ascending: false });
  if (type) query = query.eq("type", type);
  const { data, error } = await query;
  if (error || !data) return [];
  return data as ToolEvent[];
}

export interface ToolHealthDetails {
  starDelta: number | null;
  lastCommitAt: string | null;
}

export interface ToolTrajectoryPoint {
  recorded_at: string;
  health_score: number;
}

export async function getToolTrajectory(toolId: string, limit = 6): Promise<ToolTrajectoryPoint[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("tool_snapshots")
    .select("recorded_at, health_score")
    .eq("tool_id", toolId)
    .not("health_score", "is", null)
    .order("recorded_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  // Return in chronological order (oldest first) for sparkline rendering
  return (data as ToolTrajectoryPoint[]).reverse();
}

export async function getToolHealthDetails(
  toolId: string,
  currentStars: number | null
): Promise<ToolHealthDetails> {
  if (!supabase) return { starDelta: null, lastCommitAt: null };

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [latestResult, historicalResult] = await Promise.all([
    supabase
      .from("tool_snapshots")
      .select("stars, last_commit_at")
      .eq("tool_id", toolId)
      .order("recorded_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("tool_snapshots")
      .select("stars")
      .eq("tool_id", toolId)
      .lte("recorded_at", thirtyDaysAgo)
      .order("recorded_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const starDelta =
    currentStars != null && historicalResult.data?.stars != null
      ? currentStars - historicalResult.data.stars
      : null;

  return {
    starDelta,
    lastCommitAt: latestResult.data?.last_commit_at ?? null,
  };
}
