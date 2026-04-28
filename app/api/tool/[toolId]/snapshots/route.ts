import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import toolsJson from "@/data/tools.json";
import type { Tool, ToolEventType, ToolEventMetadata } from "@/lib/types";

export const revalidate = 3600;

export interface SnapshotPoint {
  recorded_at: string;
  stars: number | null;
  health_score: number | null;
  stars_delta: number | null;
}

export interface ToolEventSummary {
  type: ToolEventType;
  detected_at: string;
  metadata: ToolEventMetadata;
}

export interface SnapshotsResponse {
  tool_id: string;
  snapshots: SnapshotPoint[];
  latest_event: ToolEventSummary | null;
}

function getAnonClient() {
  const url = process.env.NEXT_PUBLIC_POSTGRES_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_POSTGRES_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  return createClient(url, anon);
}

const tools = toolsJson as Tool[];
const toolSet = new Set(tools.map((t) => t.id));

export async function GET(req: NextRequest, { params }: { params: Promise<{ toolId: string }> }) {
  const { toolId } = await params;

  if (!toolSet.has(toolId)) {
    return NextResponse.json({ error: "Tool not found" }, { status: 404 });
  }

  const daysParam = req.nextUrl.searchParams.get("days");
  const days = Math.min(365, Math.max(7, parseInt(daysParam ?? "90", 10) || 90));

  const db = getAnonClient();
  if (!db) {
    return NextResponse.json({
      tool_id: toolId,
      snapshots: [],
      latest_event: null,
    } satisfies SnapshotsResponse);
  }

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [snapshotResult, eventResult] = await Promise.all([
    db
      .from("tool_snapshots")
      .select("recorded_at, stars, health_score, stars_delta")
      .eq("tool_id", toolId)
      .gte("recorded_at", since)
      .order("recorded_at", { ascending: true }),
    db
      .from("tool_events")
      .select("type, detected_at, metadata")
      .eq("tool_id", toolId)
      .gte("detected_at", thirtyDaysAgo)
      .order("detected_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const snapshots: SnapshotPoint[] = (snapshotResult.data ?? []).map((row) => ({
    recorded_at: row.recorded_at as string,
    stars: row.stars as number | null,
    health_score: row.health_score as number | null,
    stars_delta: row.stars_delta as number | null,
  }));

  const latest_event: ToolEventSummary | null = eventResult.data
    ? {
        type: eventResult.data.type as ToolEventType,
        detected_at: eventResult.data.detected_at as string,
        metadata: (eventResult.data.metadata ?? {}) as ToolEventMetadata,
      }
    : null;

  return NextResponse.json({
    tool_id: toolId,
    snapshots,
    latest_event,
  } satisfies SnapshotsResponse);
}
