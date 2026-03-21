import { supabase } from "@/lib/db";
import type { Tool } from "@/lib/types";
import toolsJson from "@/data/tools.json";

const fallback = toolsJson as Tool[];

export async function getTools(): Promise<Tool[]> {
  if (!supabase) return fallback;
  const { data, error } = await supabase.from("tools").select("*").order("name");
  if (error || !data?.length) return fallback;
  return data as unknown as Tool[];
}

export async function getToolById(id: string): Promise<Tool | null> {
  if (!supabase) return fallback.find((t) => t.id === id) ?? null;
  const { data, error } = await supabase.from("tools").select("*").eq("id", id).single();
  if (error || !data) return fallback.find((t) => t.id === id) ?? null;
  return data as unknown as Tool;
}

export interface ToolHealthDetails {
  starDelta: number | null;
  lastCommitAt: string | null;
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
      .single(),
    supabase
      .from("tool_snapshots")
      .select("stars")
      .eq("tool_id", toolId)
      .lte("recorded_at", thirtyDaysAgo)
      .order("recorded_at", { ascending: false })
      .limit(1)
      .single(),
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
