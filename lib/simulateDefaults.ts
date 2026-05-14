/**
 * Smart defaults for the simulator input flow (AIC-125).
 *
 * When the user picks a use case, the scale + stack defaults pre-fill the
 * inputs so the simulator lands in a meaningful state immediately. Values
 * remain editable afterwards. Token defaults match TOKEN_DEFAULTS exported
 * from lib/simulate.ts — re-exported here for the form.
 */

import type { SimulationInput, SimulationUseCase } from "./simulate";
import { TOKEN_DEFAULTS } from "./simulate";

export interface ScaleDefaults {
  monthlyUsers: number;
  requestsPerUserPerDay: number;
  avgInputTokens: number;
  avgOutputTokens: number;
}

function scaleFor(uc: SimulationUseCase, users: number, rpd: number): ScaleDefaults {
  return {
    monthlyUsers: users,
    requestsPerUserPerDay: rpd,
    avgInputTokens: TOKEN_DEFAULTS[uc].inputTokens,
    avgOutputTokens: TOKEN_DEFAULTS[uc].outputTokens,
  };
}

export const SCALE_DEFAULTS: Record<SimulationUseCase, ScaleDefaults> = {
  chatbot: scaleFor("chatbot", 10_000, 5),
  rag: scaleFor("rag", 5_000, 3),
  agent: scaleFor("agent", 1_000, 10),
  custom: scaleFor("custom", 5_000, 3),
};

export const STACK_DEFAULTS: Record<SimulationUseCase, SimulationInput["stack"]> = {
  chatbot: { llm: "openai-api" },
  rag: { llm: "anthropic-api", vectorDb: "pgvector" },
  agent: { llm: "anthropic-api", framework: "langgraph" },
  custom: { llm: "openai-api" },
};

/** Slider bounds — exported so the UI and validation stay in lockstep. */
export const SCALE_BOUNDS = {
  monthlyUsers: { min: 1_000, max: 10_000_000, logScale: true },
  requestsPerUserPerDay: { min: 1, max: 100, logScale: false },
  inputTokens: { min: 50, max: 50_000, logScale: true },
  outputTokens: { min: 50, max: 10_000, logScale: true },
} as const;
