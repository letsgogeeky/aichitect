import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export interface RoastRequest {
  tools: string[];
  tier: string;
  fitnessScore: number;
  missingRequired: string[];
  missingRecommended: string[];
  roastnessLevel: 1 | 2 | 3 | 4 | 5;
}

export interface RoastResponse {
  lines: string[];
}

const TONE_INSTRUCTIONS: Record<number, string> = {
  1: "Tone: Warm but precise — like a senior dev who actually wants you to ship. Find one thing to genuinely praise, then gently twist the knife on the gaps. Leave them motivated, not embarrassed.",
  2: "Tone: Dry and direct. Think Hacker News comment that aged well. No softening, but no theatrics. The kind of feedback that stings because it's calm and correct.",
  3: "Tone: Opinionated and a little ruthless — like a CTO who's rebuilt this stack twice and has opinions. Mix metaphors, analogies, and specific callouts. Should be entertaining *and* accurate.",
  4: "Tone: Savage tech-bro energy. Every line lands like a failed code review on a Friday afternoon. Use vivid comparisons, name the disasters waiting to happen, and enjoy it.",
  5: "Tone: Full scorched-earth comedian mode. Maximum creativity, zero mercy. Comparisons to infamous tech disasters welcome. Should feel like a roast at a dev conference where everyone is slightly drunk.",
};

export async function POST(request: Request) {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GOOGLE_AI_API_KEY not configured" }, { status: 503 });
  }

  let body: RoastRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    tools,
    tier,
    fitnessScore,
    missingRequired,
    missingRecommended,
    roastnessLevel = 3,
  } = body;

  if (!tools || tools.length === 0) {
    return NextResponse.json({ error: "No tools provided" }, { status: 400 });
  }

  const toneInstruction = TONE_INSTRUCTIONS[roastnessLevel] ?? TONE_INSTRUCTIONS[3];

  const systemInstruction = `You are a sharp, opinionated AI stack critic. Your job is to roast developer stacks with wit, specificity, and flair — not random insults, but observations that are grounded in the actual tools, gaps, and choices in the data.

Rules:
- Output ONLY a JSON object: {"lines": ["...", "...", "..."]}
- 2 to 4 lines. Each line must be under 140 characters.
- Every line must reference specific tools or missing layers from the input — no generic platitudes.
- Metaphors, analogies, pop-culture references, and vivid comparisons are encouraged — as long as they're accurate.
- If the stack is genuinely strong, be grudgingly impressed with a twist — don't fabricate problems, but find the one real risk worth poking.
- Vary the structure: not every line needs to be a criticism. A backhanded compliment or a "wait, actually..." reversal adds texture.
- No markdown, no explanation outside the JSON object.

${toneInstruction}`;

  const userPrompt = buildPrompt({
    tools,
    tier,
    fitnessScore,
    missingRequired,
    missingRecommended,
    roastnessLevel,
  });

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction,
    });

    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Request timed out")), 25000)
    );
    const result = await Promise.race([model.generateContent(userPrompt), timeout]);
    const text = result.response.text().trim();

    let lines: string[] = [];
    try {
      // Strip markdown code fences if present
      const clean = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      const parsed = JSON.parse(clean);
      if (Array.isArray(parsed.lines)) {
        lines = parsed.lines.filter((l: unknown) => typeof l === "string" && l.trim().length > 0);
      }
    } catch {
      // Fallback: extract quoted strings if JSON parse fails
      const matches = text.match(/"([^"]{10,120})"/g);
      if (matches) {
        lines = matches.map((m) => m.slice(1, -1)).slice(0, 4);
      }
    }

    if (lines.length === 0) {
      return NextResponse.json({ error: "Failed to generate roast" }, { status: 500 });
    }

    return NextResponse.json({ lines } satisfies RoastResponse);
  } catch (err) {
    console.error("[roast] Gemini API error:", err);
    const msg = err instanceof Error ? err.message : String(err);
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

function buildPrompt(data: RoastRequest): string {
  const lines: string[] = [];

  lines.push(`Stack tier: ${data.tier} (${data.fitnessScore}/100)`);
  lines.push(`Tools detected: ${data.tools.join(", ")}`);

  if (data.missingRequired.length > 0) {
    lines.push(`Missing required layers: ${data.missingRequired.join(", ")}`);
  }
  if (data.missingRecommended.length > 0) {
    lines.push(`Missing recommended layers: ${data.missingRecommended.join(", ")}`);
  }
  return lines.join("\n");
}
