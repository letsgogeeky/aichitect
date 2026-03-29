import { GoogleGenerativeAI } from "@google/generative-ai";

export interface RoastInput {
  tools: string[];
  tier: string;
  fitnessScore: number;
  missingRequired: string[];
  missingRecommended: string[];
  roastnessLevel?: 1 | 2 | 3 | 4 | 5;
}

export interface RoastOutput {
  lines: string[];
}

const TONE_INSTRUCTIONS: Record<number, string> = {
  1: "Tone: Warm but precise — like a senior dev who actually wants you to ship. Find one thing to genuinely praise, then gently twist the knife on the gaps. Leave them motivated, not embarrassed.",
  2: "Tone: Dry and direct. Think Hacker News comment that aged well. No softening, but no theatrics. The kind of feedback that stings because it's calm and correct.",
  3: "Tone: Opinionated and a little ruthless — like a CTO who's rebuilt this stack twice and has opinions. Mix metaphors, analogies, and specific callouts. Should be entertaining *and* accurate.",
  4: "Tone: Savage tech-bro energy. Every line lands like a failed code review on a Friday afternoon. Use vivid comparisons, name the disasters waiting to happen, and enjoy it.",
  5: "Tone: Full scorched-earth comedian mode. Maximum creativity, zero mercy. Comparisons to infamous tech disasters welcome. Should feel like a roast at a dev conference where everyone is slightly drunk.",
};

const SYSTEM_INSTRUCTION = `You are a sharp, opinionated AI stack critic. Your job is to roast developer stacks with wit, specificity, and flair — not random insults, but observations that are grounded in the actual tools, gaps, and choices in the data.

Rules:
- Output ONLY a JSON object: {"lines": ["...", "...", "..."]}
- 2 to 4 lines. Each line must be under 140 characters.
- Every line must reference specific tools or missing layers from the input — no generic platitudes.
- Metaphors, analogies, pop-culture references, and vivid comparisons are encouraged — as long as they're accurate.
- If the stack is genuinely strong, be grudgingly impressed with a twist — don't fabricate problems, but find the one real risk worth poking.
- Vary the structure: not every line needs to be a criticism. A backhanded compliment or a "wait, actually..." reversal adds texture.
- No markdown, no explanation outside the JSON object.`;

function buildPrompt(input: RoastInput): string {
  const lines: string[] = [];
  lines.push(`Stack tier: ${input.tier} (${input.fitnessScore}/100)`);
  lines.push(`Tools detected: ${input.tools.join(", ")}`);
  if (input.missingRequired.length > 0) {
    lines.push(`Missing required layers: ${input.missingRequired.join(", ")}`);
  }
  if (input.missingRecommended.length > 0) {
    lines.push(`Missing recommended layers: ${input.missingRecommended.join(", ")}`);
  }
  return lines.join("\n");
}

export async function generateRoast(input: RoastInput): Promise<RoastOutput> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_AI_API_KEY not configured");

  const level = input.roastnessLevel ?? 3;
  const toneInstruction = TONE_INSTRUCTIONS[level] ?? TONE_INSTRUCTIONS[3];

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: `${SYSTEM_INSTRUCTION}\n\n${toneInstruction}`,
  });

  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Request timed out")), 25000)
  );
  const result = await Promise.race([model.generateContent(buildPrompt(input)), timeout]);
  const text = result.response.text().trim();

  let lines: string[] = [];
  try {
    const clean = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    const parsed = JSON.parse(clean);
    if (Array.isArray(parsed.lines)) {
      lines = parsed.lines.filter((l: unknown) => typeof l === "string" && l.trim().length > 0);
    }
  } catch {
    const matches = text.match(/"([^"]{10,120})"/g);
    if (matches) {
      lines = matches.map((m) => m.slice(1, -1)).slice(0, 4);
    }
  }

  if (lines.length === 0) throw new Error("Failed to generate roast");

  return { lines };
}
