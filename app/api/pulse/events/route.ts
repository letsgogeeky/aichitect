export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import type { ToolEventType, ToolEventMetadata } from "@/lib/types";

export type RiskSignal = "at_risk" | "pricing_changed" | "gaining_traction";

export interface ToolRiskSignal {
  tool_id: string;
  signal: RiskSignal | null;
  event_type: ToolEventType | null;
  detected_at: string | null;
  metadata: ToolEventMetadata | null;
}

interface EventsResponse {
  signals: ToolRiskSignal[];
}

// Signal priority: higher index = lower priority (at_risk wins)
const SIGNAL_PRIORITY: RiskSignal[] = ["at_risk", "pricing_changed", "gaining_traction"];

function classifyEvent(type: ToolEventType, metadata: ToolEventMetadata): RiskSignal | null {
  switch (type) {
    case "stale_transition":
    case "archived_detected":
      return "at_risk";
    case "health_score_change": {
      const delta = (metadata as { delta?: number }).delta ?? 0;
      if (delta < -10) return "at_risk";
      if (delta > 10) return "gaining_traction";
      return null;
    }
    case "pricing_change":
      return "pricing_changed";
    case "star_milestone":
      return "gaining_traction";
    default:
      return null;
  }
}

function getAnonClient() {
  const url = process.env.NEXT_PUBLIC_POSTGRES_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_POSTGRES_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  return createClient(url, anon);
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const tool_ids = (body as { tool_ids?: unknown }).tool_ids;
  if (!Array.isArray(tool_ids) || tool_ids.length === 0 || tool_ids.length > 30) {
    return NextResponse.json(
      { error: "tool_ids must be a non-empty array of at most 30 items" },
      { status: 400 }
    );
  }

  const db = getAnonClient();
  if (!db) {
    const signals: ToolRiskSignal[] = tool_ids.map((id) => ({
      tool_id: id as string,
      signal: null,
      event_type: null,
      detected_at: null,
      metadata: null,
    }));
    return NextResponse.json({ signals } satisfies EventsResponse);
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: events, error } = await db
    .from("tool_events")
    .select("tool_id, type, detected_at, metadata")
    .in("tool_id", tool_ids)
    .gte("detected_at", thirtyDaysAgo)
    .order("detected_at", { ascending: false });

  if (error) {
    const signals: ToolRiskSignal[] = tool_ids.map((id) => ({
      tool_id: id as string,
      signal: null,
      event_type: null,
      detected_at: null,
      metadata: null,
    }));
    return NextResponse.json({ signals } satisfies EventsResponse);
  }

  // Build signal map: for each tool, keep the highest-priority signal
  const signalMap = new Map<string, ToolRiskSignal>();

  for (const ev of events ?? []) {
    const signal = classifyEvent(
      ev.type as ToolEventType,
      (ev.metadata ?? {}) as ToolEventMetadata
    );
    if (!signal) continue;

    const existing = signalMap.get(ev.tool_id);
    if (!existing) {
      signalMap.set(ev.tool_id, {
        tool_id: ev.tool_id as string,
        signal,
        event_type: ev.type as ToolEventType,
        detected_at: ev.detected_at as string,
        metadata: (ev.metadata ?? {}) as ToolEventMetadata,
      });
    } else {
      // Replace only if the new signal has higher priority
      const existingPriority = SIGNAL_PRIORITY.indexOf(existing.signal!);
      const newPriority = SIGNAL_PRIORITY.indexOf(signal);
      if (newPriority < existingPriority) {
        signalMap.set(ev.tool_id, {
          tool_id: ev.tool_id as string,
          signal,
          event_type: ev.type as ToolEventType,
          detected_at: ev.detected_at as string,
          metadata: (ev.metadata ?? {}) as ToolEventMetadata,
        });
      }
    }
  }

  const signals: ToolRiskSignal[] = tool_ids.map((id) => {
    return (
      signalMap.get(id as string) ?? {
        tool_id: id as string,
        signal: null,
        event_type: null,
        detected_at: null,
        metadata: null,
      }
    );
  });

  return NextResponse.json({ signals } satisfies EventsResponse);
}
