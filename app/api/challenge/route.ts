import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export interface ChallengeRequest {
  filledSlots: { slotName: string; toolName: string }[];
  missingRequired: string[];
  tier: string;
  fitnessScore: number;
  archetype: string;
}

export interface ChallengeItem {
  tool: string;
  challenge: string;
  recommendation: string;
}

export interface ChallengeResponse {
  challenges: ChallengeItem[];
}

const SYSTEM_INSTRUCTION = `You are an adversarial AI stack reviewer. Your job is to argue against specific tool choices — not mock them, but challenge them rigorously using reasoning about scale, lock-in, operational cost, debugging overhead, and architectural tradeoffs.

Rules:
- Output ONLY a JSON object: {"challenges": [{...}, ...]}
- 3 to 5 challenges. Target the most questionable tool choices first.
- Each challenge must have exactly three fields:
  - "tool": the exact tool name from the input
  - "challenge": one specific, grounded argument against this choice (1–2 sentences, max 160 chars). Name the specific risk — not a generic concern.
  - "recommendation": one actionable next step or condition that would change the analysis (1 sentence, max 120 chars).
- Only target tools from the filled slots list. Do not invent tools.
- If a tool choice is genuinely defensible for this stack, challenge a different one instead.
- No flattery, no padding, no markdown outside the JSON object.`;

export async function POST(request: Request) {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GOOGLE_AI_API_KEY not configured" }, { status: 503 });
  }

  let body: ChallengeRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { filledSlots, missingRequired, tier, fitnessScore, archetype } = body;

  if (!filledSlots || filledSlots.length === 0) {
    return NextResponse.json({ error: "No tools to challenge" }, { status: 400 });
  }

  const userPrompt = buildPrompt({ filledSlots, missingRequired, tier, fitnessScore, archetype });

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: SYSTEM_INSTRUCTION,
    });

    const result = await model.generateContent(userPrompt);
    const text = result.response.text().trim();

    let challenges: ChallengeItem[] = [];
    try {
      const clean = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      const parsed = JSON.parse(clean);
      if (Array.isArray(parsed.challenges)) {
        challenges = parsed.challenges
          .filter(
            (c: unknown) =>
              typeof c === "object" &&
              c !== null &&
              "tool" in c &&
              "challenge" in c &&
              "recommendation" in c
          )
          .slice(0, 5) as ChallengeItem[];
      }
    } catch {
      // If JSON parse fails, return empty — no fallback for structured data
    }

    if (challenges.length === 0) {
      return NextResponse.json({ error: "Failed to generate challenges" }, { status: 500 });
    }

    return NextResponse.json({ challenges } satisfies ChallengeResponse);
  } catch (err) {
    console.error("[challenge] Gemini API error:", err);
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

function buildPrompt(data: ChallengeRequest): string {
  const lines: string[] = [];

  lines.push(`Stack archetype: ${data.archetype}`);
  lines.push(`Stack tier: ${data.tier} (${data.fitnessScore}/100)`);
  lines.push(`\nFilled slots (slot → tool chosen):`);
  for (const s of data.filledSlots) {
    lines.push(`  ${s.slotName}: ${s.toolName}`);
  }

  if (data.missingRequired.length > 0) {
    lines.push(`\nMissing required layers: ${data.missingRequired.join(", ")}`);
  }

  lines.push(
    `\nChallenge the most questionable tool choices above. Be specific about why each choice could be wrong for this archetype and tier.`
  );

  return lines.join("\n");
}
