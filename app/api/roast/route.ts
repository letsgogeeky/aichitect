import { NextResponse } from "next/server";
import { generateRoast, type RoastInput } from "@/lib/ai/roast";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: RoastInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.tools || body.tools.length === 0) {
    return NextResponse.json({ error: "No tools provided" }, { status: 400 });
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
