export const revalidate = 3600; // revalidate at most once per hour

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { ToolUsageSummary } from "@/lib/types";

function getClient() {
  const url = process.env.NEXT_PUBLIC_POSTGRES_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_POSTGRES_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  return createClient(url, anon);
}

// GET /api/tools/[toolId]/usage — public usage count + avatar list (cached 1h)
export async function GET(_req: Request, { params }: { params: Promise<{ toolId: string }> }) {
  const { toolId } = await params;
  const db = getClient();
  if (!db) return NextResponse.json({ count: 0, avatars: [] } satisfies ToolUsageSummary);

  const { data, error } = await db
    .from("tool_usage")
    .select("github_username, avatar_url")
    .eq("tool_id", toolId)
    .order("used_at", { ascending: false });

  if (error || !data)
    return NextResponse.json({ count: 0, avatars: [] } satisfies ToolUsageSummary);

  const summary: ToolUsageSummary = {
    count: data.length,
    avatars: data.slice(0, 8).map((r) => ({
      github_username: r.github_username,
      avatar_url: r.avatar_url ?? null,
    })),
  };

  return NextResponse.json(summary);
}
