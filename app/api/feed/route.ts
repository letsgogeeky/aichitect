export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type {
  FeedEvent,
  FeedResponse,
  ToolEventType,
  CategoryId,
  ToolEventMetadata,
} from "@/lib/types";

const LIMIT = 20;

function getAnonClient() {
  const url = process.env.NEXT_PUBLIC_POSTGRES_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_POSTGRES_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  return createClient(url, anon);
}

async function getAuthClient() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_POSTGRES_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_POSTGRES_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  return createServerClient(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2])
        );
      },
    },
  });
}

// GET /api/feed — paginated tool activity feed
// Query params:
//   cursor      ISO timestamp — return events older than this
//   types       comma-separated ToolEventType values to filter
//   saved_only  "true" — filter to tools in the authenticated user's saved stacks
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const cursor = searchParams.get("cursor");
  const typesParam = searchParams.get("types");
  const savedOnly = searchParams.get("saved_only") === "true";

  const typeFilter = typesParam ? (typesParam.split(",").filter(Boolean) as ToolEventType[]) : null;

  const db = getAnonClient();
  if (!db) return NextResponse.json({ events: [], next_cursor: null } satisfies FeedResponse);

  // Resolve saved-stack tool filter for authenticated users
  let savedToolIds: string[] | null = null;
  if (savedOnly) {
    const authClient = await getAuthClient();
    if (authClient) {
      const {
        data: { user },
      } = await authClient.auth.getUser();
      if (user) {
        const { data: stacks } = await authClient
          .from("saved_stacks")
          .select("tool_ids")
          .eq("user_id", user.id);
        if (stacks && stacks.length > 0) {
          savedToolIds = [...new Set(stacks.flatMap((s: { tool_ids: string[] }) => s.tool_ids))];
        } else {
          return NextResponse.json({ events: [], next_cursor: null } satisfies FeedResponse);
        }
      }
    }
  }

  let query = db
    .from("tool_events")
    .select(
      "id, tool_id, type, detected_at, old_hash, new_hash, metadata, tools!inner(name, category)"
    )
    .order("detected_at", { ascending: false })
    .limit(LIMIT + 1);

  if (cursor) query = query.lt("detected_at", cursor);
  if (typeFilter && typeFilter.length > 0) query = query.in("type", typeFilter);
  if (savedToolIds) query = query.in("tool_id", savedToolIds);

  const { data, error } = await query;
  if (error || !data)
    return NextResponse.json({ events: [], next_cursor: null } satisfies FeedResponse);

  const hasMore = data.length > LIMIT;
  const items = hasMore ? data.slice(0, LIMIT) : data;

  const events: FeedEvent[] = items.map((row) => {
    // Supabase returns joined rows as an array; take the first element
    const toolRaw = row.tools as unknown as
      | { name: string; category: string }[]
      | { name: string; category: string };
    const tool = Array.isArray(toolRaw) ? toolRaw[0] : toolRaw;
    return {
      id: row.id as string,
      tool_id: row.tool_id as string,
      tool_name: tool.name,
      tool_category: tool.category as CategoryId,
      type: row.type as ToolEventType,
      metadata: (row.metadata ?? {}) as ToolEventMetadata,
      detected_at: row.detected_at as string,
    };
  });

  const next_cursor = hasMore ? (items[items.length - 1].detected_at as string) : null;

  return NextResponse.json({ events, next_cursor } satisfies FeedResponse);
}
