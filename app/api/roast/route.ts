import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export interface RoastRequest {
  tools: string[];
  tier: string;
  fitnessScore: number;
  missingRequired: string[];
  missingRecommended: string[];
  criticalPairsCovered: number;
  criticalPairsTotal: number;
  roastnessLevel: 1 | 2 | 3 | 4 | 5;
}

export interface RoastResponse {
  lines: string[];
}

const TONE_INSTRUCTIONS: Record<number, string> = {
  1: "Tone: Be honest but gentle and constructive. You're a helpful mentor who wants them to succeed. Acknowledge what's working before pointing out gaps. Encouraging, not discouraging.",
  2: "Tone: Be direct and honest. Pull no punches but stay professional — like a thoughtful colleague giving a code review. No flattery, but no savagery either.",
  3: "Tone: Be opinionated and slightly savage. Like a senior engineer who's seen too many production fires. Every observation should sting a little — because it's true.",
  4: "Tone: Be harsh and relentless. No softening, no silver linings. Call out every gap with maximum bluntness. This should be uncomfortable to read.",
  5: "Tone: Go scorched earth. Maximum savagery. No mercy whatsoever. Every line should be a gut punch. This stack should feel ashamed of itself by the end.",
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
    criticalPairsCovered,
    criticalPairsTotal,
    roastnessLevel = 3,
  } = body;

  if (!tools || tools.length === 0) {
    return NextResponse.json({ error: "No tools provided" }, { status: 400 });
  }

  const toneInstruction = TONE_INSTRUCTIONS[roastnessLevel] ?? TONE_INSTRUCTIONS[3];

  const systemInstruction = `You are a brutally honest AI stack reviewer. Your job is to roast AI developer stacks — not with random insults, but with specific, accurate observations that are grounded in the data.

Rules:
- Output ONLY a JSON object: {"lines": ["...", "...", "..."]}
- 2 to 4 lines. Each line must be under 120 characters.
- Every line must reference specific tools or missing layers from the data — no generic platitudes.
- Do NOT be sycophantic. If the stack is genuinely good, be grudgingly impressed — don't fabricate problems.
- No markdown, no explanation outside the JSON object.

${toneInstruction}`;

  const userPrompt = buildPrompt({
    tools,
    tier,
    fitnessScore,
    missingRequired,
    missingRecommended,
    criticalPairsCovered,
    criticalPairsTotal,
    roastnessLevel,
  });

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction,
    });

    const result = await model.generateContent(userPrompt);
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
    return NextResponse.json({ error: "Gemini API error" }, { status: 500 });
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
  if (data.criticalPairsTotal > 0) {
    lines.push(
      `Integration coverage: ${data.criticalPairsCovered}/${data.criticalPairsTotal} critical pairs connected`
    );
  }

  return lines.join("\n");
}
