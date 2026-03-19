// Quiz answer shape — one value per question
export interface QuizAnswers {
  what: string; // what are you building
  who: string; // team size / experience
  priority: string; // what matters most
  budget: string; // monthly budget comfort
}

export interface StackMatch {
  stackId: string;
  score: number; // raw score 0–120
  label: string; // "Perfect fit" | "Strong match" | ...
}

// Score for each (stackId → question → answer) combination.
// Max per question: 30. Total max: 120.
const MATRIX: Record<string, Record<keyof QuizAnswers, Record<string, number>>> = {
  "indie-hacker": {
    what: { product: 30, rag: 10, coding: 5, infra: 0, design: 15, quality: 0 },
    who: { exploring: 20, solo: 30, team: 15, enterprise: 0 },
    priority: { speed: 30, oss: 10, reliability: 5, flexibility: 10 },
    budget: { free: 5, low: 30, medium: 15, high: 5 },
  },
  "agentic-coding": {
    what: { product: 10, rag: 0, coding: 30, infra: 5, design: 0, quality: 10 },
    who: { exploring: 0, solo: 15, team: 30, enterprise: 15 },
    priority: { speed: 20, oss: 5, reliability: 25, flexibility: 10 },
    budget: { free: 0, low: 5, medium: 30, high: 20 },
  },
  "enterprise-rag": {
    what: { product: 5, rag: 30, coding: 0, infra: 15, design: 0, quality: 15 },
    who: { exploring: 0, solo: 0, team: 10, enterprise: 30 },
    priority: { speed: 0, oss: 0, reliability: 30, flexibility: 20 },
    budget: { free: 0, low: 0, medium: 5, high: 30 },
  },
  "oss-self-hosted": {
    what: { product: 5, rag: 25, coding: 10, infra: 20, design: 0, quality: 5 },
    who: { exploring: 5, solo: 10, team: 20, enterprise: 30 },
    priority: { speed: 0, oss: 30, reliability: 15, flexibility: 20 },
    budget: { free: 30, low: 25, medium: 15, high: 10 },
  },
  "multi-agent-devops": {
    what: { product: 5, rag: 0, coding: 25, infra: 10, design: 0, quality: 15 },
    who: { exploring: 0, solo: 0, team: 20, enterprise: 30 },
    priority: { speed: 15, oss: 0, reliability: 25, flexibility: 10 },
    budget: { free: 0, low: 0, medium: 25, high: 30 },
  },
  "design-to-code": {
    what: { product: 20, rag: 0, coding: 10, infra: 0, design: 30, quality: 5 },
    who: { exploring: 10, solo: 25, team: 30, enterprise: 10 },
    priority: { speed: 30, oss: 5, reliability: 5, flexibility: 10 },
    budget: { free: 0, low: 25, medium: 30, high: 10 },
  },
  "llm-startup-infra": {
    what: { product: 15, rag: 15, coding: 5, infra: 30, design: 0, quality: 15 },
    who: { exploring: 0, solo: 10, team: 25, enterprise: 30 },
    priority: { speed: 10, oss: 5, reliability: 25, flexibility: 30 },
    budget: { free: 0, low: 5, medium: 25, high: 30 },
  },
  "mcp-power-user": {
    what: { product: 15, rag: 5, coding: 25, infra: 10, design: 5, quality: 5 },
    who: { exploring: 25, solo: 30, team: 15, enterprise: 5 },
    priority: { speed: 20, oss: 15, reliability: 10, flexibility: 25 },
    budget: { free: 20, low: 30, medium: 20, high: 5 },
  },
  "evaluation-quality": {
    what: { product: 10, rag: 15, coding: 10, infra: 15, design: 0, quality: 30 },
    who: { exploring: 5, solo: 10, team: 25, enterprise: 30 },
    priority: { speed: 0, oss: 5, reliability: 30, flexibility: 10 },
    budget: { free: 0, low: 10, medium: 30, high: 25 },
  },
  "spec-driven-ai": {
    what: { product: 20, rag: 5, coding: 20, infra: 10, design: 5, quality: 20 },
    who: { exploring: 0, solo: 10, team: 30, enterprise: 25 },
    priority: { speed: 5, oss: 10, reliability: 20, flexibility: 15 },
    budget: { free: 0, low: 15, medium: 30, high: 20 },
  },
};

function matchLabel(score: number): string {
  if (score >= 100) return "Perfect fit";
  if (score >= 85) return "Strong match";
  if (score >= 70) return "Good match";
  if (score >= 55) return "Decent fit";
  return "Partial match";
}

export function scoreStacks(answers: QuizAnswers): StackMatch[] {
  return Object.entries(MATRIX)
    .map(([stackId, matrix]) => {
      const score =
        (matrix.what?.[answers.what] ?? 0) +
        (matrix.who?.[answers.who] ?? 0) +
        (matrix.priority?.[answers.priority] ?? 0) +
        (matrix.budget?.[answers.budget] ?? 0);
      return { stackId, score, label: matchLabel(score) };
    })
    .sort((a, b) => b.score - a.score);
}
