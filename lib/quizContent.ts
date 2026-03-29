import type { QuizAnswers } from "./quizScoring";

export interface QuizOption {
  value: string;
  label: string;
  sub?: string;
}

export interface QuizQuestion {
  id: keyof QuizAnswers;
  question: string;
  hint: string;
  options: QuizOption[];
}

export const QUESTIONS: QuizQuestion[] = [
  {
    id: "what",
    question: "What are you building?",
    hint: "Pick the closest fit — you can always explore other stacks after.",
    options: [
      { value: "product", label: "A product or SaaS app", sub: "web app, API, full-stack" },
      { value: "rag", label: "RAG / knowledge base", sub: "Q&A, search, document chat" },
      { value: "coding", label: "AI coding agent or automation", sub: "dev tooling, SWE agents" },
      { value: "infra", label: "LLM infrastructure", sub: "model routing, observability" },
      { value: "design", label: "Design-to-code pipeline", sub: "UI gen, Figma handoff" },
      { value: "quality", label: "Eval & testing", sub: "prompt regression, quality gates" },
    ],
  },
  {
    id: "who",
    question: "Who's this for?",
    hint: "This shapes complexity and team-size assumptions.",
    options: [
      { value: "exploring", label: "Just me — learning and exploring" },
      { value: "solo", label: "Solo developer / indie project" },
      { value: "team", label: "Small team or startup", sub: "2–20 people" },
      { value: "enterprise", label: "Large team / enterprise", sub: "compliance, scale, process" },
    ],
  },
  {
    id: "priority",
    question: "What matters most to you?",
    hint: "If you had to pick one thing to optimise for.",
    options: [
      {
        value: "speed",
        label: "Ship fast, iterate later",
        sub: "low overhead, fast feedback loop",
      },
      {
        value: "oss",
        label: "Open source & self-hosted",
        sub: "privacy, data residency, no lock-in",
      },
      {
        value: "reliability",
        label: "Reliability & observability",
        sub: "evals, tracing, production-grade",
      },
      { value: "flexibility", label: "No vendor lock-in", sub: "swap models, provider-agnostic" },
    ],
  },
  {
    id: "budget",
    question: "Monthly budget comfort?",
    hint: "Managed services vs. self-hosted shapes the recommendation significantly.",
    options: [
      { value: "free", label: "Free only", sub: "OSS + self-hosted" },
      { value: "low", label: "Under $100/mo", sub: "lean and scrappy" },
      { value: "medium", label: "$100–500/mo", sub: "growing product or team" },
      { value: "high", label: "$500+/mo or enterprise", sub: "no budget constraint" },
    ],
  },
];
