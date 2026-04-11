import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { generateRoast, type RoastInput } from "@/lib/ai/roast";

export const dynamic = "force-dynamic";

const MAX_TOOLS = 20;

async function getUser() {
  const url = process.env.NEXT_PUBLIC_POSTGRES_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_POSTGRES_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  const cookieStore = await cookies();
  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: () => {},
    },
  });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: RoastInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.tools || body.tools.length === 0) {
    return NextResponse.json({ error: "No tools provided" }, { status: 400 });
  }
  if (body.tools.length > MAX_TOOLS) {
    return NextResponse.json({ error: `Too many tools — max ${MAX_TOOLS}` }, { status: 400 });
  }

  try {
    const result = await generateRoast(body);
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg === "GOOGLE_AI_API_KEY not configured") {
      return NextResponse.json({ error: msg }, { status: 503 });
    }
    if (
      msg.includes("429") ||
      msg.toLowerCase().includes("quota") ||
      msg.toLowerCase().includes("rate")
    ) {
      return NextResponse.json(
        { error: "Rate limit reached. Try again in a moment." },
        { status: 429 }
      );
    }
    if (msg.toLowerCase().includes("timed out")) {
      return NextResponse.json({ error: "Request timed out. Try again." }, { status: 504 });
    }
    return NextResponse.json({ error: "Failed to generate roast. Try again." }, { status: 500 });
  }
}
