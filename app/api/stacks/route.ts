import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function makeClient(cookieStore: Awaited<ReturnType<typeof cookies>>) {
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

// GET /api/stacks — list authenticated user's saved stacks
export async function GET() {
  const cookieStore = await cookies();
  const supabase = makeClient(cookieStore);
  if (!supabase) return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("saved_stacks")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/stacks — save a new stack
export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = makeClient(cookieStore);
  if (!supabase) return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { name?: string; tool_ids?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = body.name?.trim();
  const tool_ids = body.tool_ids;

  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });
  if (!Array.isArray(tool_ids) || tool_ids.length === 0) {
    return NextResponse.json({ error: "tool_ids must be a non-empty array" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("saved_stacks")
    .insert({ user_id: user.id, name, tool_ids })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
