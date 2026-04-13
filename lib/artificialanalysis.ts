/**
 * Artificial Analysis API client (AIC-126).
 *
 * Fetches real latency (TTFT) and pricing data for LLM providers.
 * API docs: https://artificialanalysis.ai/documentation
 * Attribution required on all pages displaying this data per AA free-tier terms.
 *
 * Rate limit: 1,000 requests/day on the free tier.
 * One call to /data/llms/models fetches all models — run at most daily.
 *
 * Actual response shape (verified against live API 2026-04-05):
 *   { status, prompt_options, data: AAModel[] }
 * Models are identified by a stable `slug`, grouped by `model_creator.slug`.
 * Pricing is nested inside a `pricing` object.
 * There is NO model_family_slug, deprecated, or deprecated_to field.
 */

const AA_BASE = "https://artificialanalysis.ai/api/v2";

// ── API response types ────────────────────────────────────────────────────────

export interface AAModelCreator {
  id: string;
  name: string;
  slug: string;
}

export interface AAModelPricing {
  price_1m_blended_3_to_1: number | null;
  /** USD per 1M input tokens */
  price_1m_input_tokens: number | null;
  /** USD per 1M output tokens */
  price_1m_output_tokens: number | null;
}

export interface AAModel {
  id: string;
  name: string;
  /** Stable model identifier — used for lookups */
  slug: string;
  release_date: string | null;
  model_creator: AAModelCreator;
  pricing: AAModelPricing;
  /** p50 output throughput in tokens/sec */
  median_output_tokens_per_second: number | null;
  /** p50 time to first token in seconds */
  median_time_to_first_token_seconds: number | null;
  median_time_to_first_answer_token: number | null;
}

export interface AADataResponse {
  status: number;
  data: AAModel[];
}

export type AAFetchError = "missing_key" | "rate_limited" | "network" | "unknown";

export interface AAFetchResult {
  models: AAModel[] | null;
  error?: AAFetchError;
  rateLimitRemaining?: number;
}

// ── Tool → AA model slug mapping ──────────────────────────────────────────────
//
// Maps our tool IDs to the AA model slug of the current flagship model.
// Update this when providers release newer flagships with better benchmark coverage.
//
// Sources: artificialanalysis.ai — models with non-null TTFT and pricing data.
// Slugs verified against live API on 2026-04-05.
//
// Coverage: model-API tools only. Inference providers (Groq, Cerebras, etc.)
// and deployment platforms (Amazon Bedrock, Azure OpenAI) are not in AA as
// distinct entries — static latency_p50_ms in tools.json covers those.

export const AA_TOOL_SLUG_MAP: Record<string, string> = {
  "openai-api": "gpt-4o",
  "anthropic-api": "claude-sonnet-4-6",
  "google-gemini-api": "gemini-2-5-flash", // Flash has real TTFT; Pro shows reasoning overhead
  "mistral-api": "mistral-large-3",
  "xai-grok": "grok-3",
  "cohere-api": "command-a",
  "deepseek-api": "deepseek-v3-2",
};

// ── API client ────────────────────────────────────────────────────────────────

export async function fetchAAModels(): Promise<AAFetchResult> {
  const apiKey = process.env.ARTIFICIAL_ANALYSIS_API_KEY;
  if (!apiKey) {
    return { models: null, error: "missing_key" };
  }

  let response: Response;
  try {
    response = await fetch(`${AA_BASE}/data/llms/models`, {
      headers: { "x-api-key": apiKey },
      // Never cache — we want fresh data on each cron run
      cache: "no-store",
    });
  } catch {
    return { models: null, error: "network" };
  }

  const rateLimitRemaining = response.headers.get("X-RateLimit-Remaining")
    ? parseInt(response.headers.get("X-RateLimit-Remaining")!, 10)
    : undefined;

  if (response.status === 429) {
    return { models: null, error: "rate_limited", rateLimitRemaining: 0 };
  }
  if (response.status === 401) {
    return { models: null, error: "missing_key" };
  }
  if (!response.ok) {
    return { models: null, error: "unknown", rateLimitRemaining };
  }

  const body = (await response.json()) as AADataResponse;
  return { models: body.data ?? [], rateLimitRemaining };
}

// ── Model resolution ──────────────────────────────────────────────────────────

/**
 * Given a list of all AA models and a model slug, returns the matching model.
 * The slug is the stable identifier used in AA_TOOL_SLUG_MAP.
 */
export function resolveModelBySlug(models: AAModel[], slug: string): AAModel | null {
  return models.find((m) => m.slug === slug) ?? null;
}

// ── Data extraction ───────────────────────────────────────────────────────────

/** Convert AA pricing (per 1M tokens) to our cost_model unit (per 1k tokens). */
export function aaToInputCostPer1k(price1m: number | null): number | null {
  return price1m !== null ? price1m / 1000 : null;
}

/** AA TTFT in seconds → our latency_p50_ms in integer ms. */
export function aaToLatencyMs(ttftSeconds: number | null): number | null {
  return ttftSeconds !== null ? Math.round(ttftSeconds * 1000) : null;
}
