/**
 * Smart defaults for the simulator input flow (AIC-125).
 *
 * When the user picks a use case, the scale sliders and stack picker are
 * pre-filled from these tables so the form lands in a meaningful state
 * immediately. Values are editable afterwards.
 */

import { TOKEN_DEFAULTS } from "./simulate";
import type { SimulationInput, SimulationUseCase } from "./simulate";

export interface ScaleDefaults {
  monthlyUsers: number;
  requestsPerUserPerDay: number;
  avgTokens: number;
}

export const SCALE_DEFAULTS: Record<SimulationUseCase, ScaleDefaults> = {
  chatbot: { monthlyUsers: 10_000, requestsPerUserPerDay: 5, avgTokens: 1_000 },
  rag: { monthlyUsers: 5_000, requestsPerUserPerDay: 3, avgTokens: 3_400 },
  agent: { monthlyUsers: 1_000, requestsPerUserPerDay: 10, avgTokens: 2_300 },
  custom: { monthlyUsers: 5_000, requestsPerUserPerDay: 3, avgTokens: 1_500 },
};

export const STACK_DEFAULTS: Record<SimulationUseCase, SimulationInput["stack"]> = {
  chatbot: { llm: "openai-api" },
  rag: { llm: "anthropic-api", vectorDb: "pgvector" },
  agent: { llm: "anthropic-api", framework: "langgraph" },
  custom: { llm: "openai-api" },
};

/**
 * Split a total token budget into input/output halves using the per-use-case
 * ratio from TOKEN_DEFAULTS. Keeps each side ≥ 1.
 */
export function splitTokens(
  total: number,
  useCase: SimulationUseCase
): { input: number; output: number } {
  const d = TOKEN_DEFAULTS[useCase];
  const ratio = d.inputTokens / (d.inputTokens + d.outputTokens);
  const input = Math.max(1, Math.round(total * ratio));
  const output = Math.max(1, Math.round(total - input));
  return { input, output };
}

/** Slider bounds — exported so the UI and validation stay in lockstep. */
export const SCALE_BOUNDS = {
  monthlyUsers: { min: 1_000, max: 10_000_000, logScale: true },
  requestsPerUserPerDay: { min: 1, max: 100, logScale: false },
  avgTokens: { min: 500, max: 50_000, logScale: true },
} as const;
