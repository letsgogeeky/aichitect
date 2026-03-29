import { NextResponse } from "next/server";
import { generateChallenge, type ChallengeInput } from "@/lib/ai/challenge";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: ChallengeInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.filledSlots || body.filledSlots.length === 0) {
    return NextResponse.json({ error: "No tools to challenge" }, { status: 400 });
  }

  try {
    const result = await generateChallenge(body);
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
    return NextResponse.json(
      { error: "Failed to generate challenges. Try again." },
      { status: 500 }
    );
  }
}
