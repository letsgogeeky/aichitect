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
}

export interface RoastResponse {
  lines: string[];
}

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
  } = body;

  if (!tools || tools.length === 0) {
    return NextResponse.json({ error: "No tools provided" }, { status: 400 });
  }

  const systemInstruction = `You are a brutally honest AI stack reviewer. Your job is to roast AI developer stacks — not with random insults, but with specific, accurate observations that sting because they're true.

Rules:
- Output ONLY a JSON object: {"lines": ["...", "...", "..."]}
- 2 to 4 lines. Each line must be under 120 characters.
- Every line must reference specific tools or missing layers from the data — no generic platitudes.
- Tone: opinionated, slightly savage, but earned. Like a senior engineer who's seen too many production fires.
- Do NOT be sycophantic. Do NOT say "great stack" or soften the blow. If the stack is genuinely good, be grudgingly impressed.
- No markdown, no explanation outside the JSON object.`;

  const userPrompt = buildPrompt({
    tools,
    tier,
    fitnessScore,
    missingRequired,
    missingRecommended,
    criticalPairsCovered,
    criticalPairsTotal,
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
