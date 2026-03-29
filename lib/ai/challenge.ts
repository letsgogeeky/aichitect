import { GoogleGenerativeAI } from "@google/generative-ai";

export interface ChallengeInput {
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

export interface ChallengeOutput {
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

function buildPrompt(input: ChallengeInput): string {
  const lines: string[] = [];
  lines.push(`Stack archetype: ${input.archetype}`);
  lines.push(`Stack tier: ${input.tier} (${input.fitnessScore}/100)`);
  lines.push(`\nFilled slots (slot → tool chosen):`);
  for (const s of input.filledSlots) {
    lines.push(`  ${s.slotName}: ${s.toolName}`);
  }
  if (input.missingRequired.length > 0) {
    lines.push(`\nMissing required layers: ${input.missingRequired.join(", ")}`);
  }
  lines.push(
    `\nChallenge the most questionable tool choices above. Be specific about why each choice could be wrong for this archetype and tier.`
  );
  return lines.join("\n");
}

export async function generateChallenge(input: ChallengeInput): Promise<ChallengeOutput> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_AI_API_KEY not configured");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: SYSTEM_INSTRUCTION,
  });

  const result = await model.generateContent(buildPrompt(input));
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
    // no fallback for structured data
  }

  if (challenges.length === 0) throw new Error("Failed to generate challenges");

  return { challenges };
}
