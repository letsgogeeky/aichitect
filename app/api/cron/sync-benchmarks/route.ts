export const dynamic = "force-dynamic";

/**
 * AIC-126 — Weekly cron: sync latency and pricing from Artificial Analysis.
 *
 * Calls the AA /data/llms/models endpoint (1 request, free-tier safe) and
 * updates latency_p50_ms + cost_model + benchmark_synced_at for every tool
 * covered by AA_TOOL_SLUG_MAP.
 *
 * Authorization: Vercel Cron sends `Authorization: Bearer ${CRON_SECRET}`.
 * Schedule: weekly — see vercel.json (Mondays 03:00 UTC).
 *
 * Attribution: pages displaying AA data must credit Artificial Analysis.
 * Rate limit: 1,000 req/day on the free tier; this route makes exactly 1 call.
 */

import { createClient } from "@supabase/supabase-js";
import {
  fetchAAModels,
  resolveModelBySlug,
  aaToLatencyMs,
  aaToInputCostPer1k,
  AA_TOOL_SLUG_MAP,
} from "@/lib/artificialanalysis";
import type { CostModel } from "@/lib/types";

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_POSTGRES_SUPABASE_URL;
  const key = process.env.POSTGRES_SUPABASE_SERVICE_ROLE_KEY;
  if (!url) {
    console.error("[sync-benchmarks] Missing env var: NEXT_PUBLIC_POSTGRES_SUPABASE_URL");
    return null;
  }
  if (!key) {
    console.error("[sync-benchmarks] Missing env var: POSTGRES_SUPABASE_SERVICE_ROLE_KEY");
    return null;
  }
  return createClient(url, key);
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getServiceClient();
  if (!db) {
    return Response.json({ error: "DB client unavailable" }, { status: 500 });
  }

  // ── 1. Fetch all AA models (single API call) ───────────────────────────────

  const { models, error: fetchError, rateLimitRemaining } = await fetchAAModels();

  if (fetchError === "missing_key") {
    return Response.json({ error: "ARTIFICIAL_ANALYSIS_API_KEY is not set" }, { status: 500 });
  }
  if (fetchError === "rate_limited") {
    console.warn("[sync-benchmarks] AA rate limit hit — skipping this run");
    return Response.json({ skipped: true, reason: "rate_limited" }, { status: 200 });
  }
  if (!models) {
    return Response.json({ error: "Failed to fetch AA models" }, { status: 502 });
  }

  console.log(
    `[sync-benchmarks] Fetched ${models.length} AA models. Rate limit remaining: ${rateLimitRemaining ?? "unknown"}`
  );

  // ── 2. Resolve and update each covered tool ────────────────────────────────

  const now = new Date().toISOString();
  const results: {
    toolId: string;
    modelSlug: string;
    status: "updated" | "no_data";
    latencyMs?: number | null;
    inputCostPer1k?: number | null;
  }[] = [];

  for (const [toolId, modelSlug] of Object.entries(AA_TOOL_SLUG_MAP)) {
    const model = resolveModelBySlug(models, modelSlug);

    if (!model) {
      console.warn(`[sync-benchmarks] Slug not found in AA: ${modelSlug} (tool: ${toolId})`);
      results.push({ toolId, modelSlug, status: "no_data" });
      continue;
    }

    const latencyMs = aaToLatencyMs(model.median_time_to_first_token_seconds);
    const inputCostPer1k = aaToInputCostPer1k(model.pricing.price_1m_input_tokens);
    const outputCostPer1k = aaToInputCostPer1k(model.pricing.price_1m_output_tokens);

    // Build the cost_model update only when AA has pricing data
    const costModelPatch: Partial<CostModel> | null =
      inputCostPer1k !== null || outputCostPer1k !== null
        ? {
            type: "per_token",
            ...(inputCostPer1k !== null && { input_cost_per_1k_tokens: inputCostPer1k }),
            ...(outputCostPer1k !== null && { output_cost_per_1k_tokens: outputCostPer1k }),
          }
        : null;

    // Fetch current cost_model to merge with (preserve pricing_url, free_tier_limit, etc.)
    const { data: existing } = await db
      .from("tools")
      .select("cost_model")
      .eq("id", toolId)
      .single();

    const mergedCostModel =
      costModelPatch && existing?.cost_model
        ? { ...existing.cost_model, ...costModelPatch }
        : costModelPatch
          ? { ...costModelPatch }
          : undefined;

    const updatePayload: Record<string, unknown> = {
      benchmark_synced_at: now,
    };
    if (latencyMs !== null) updatePayload.latency_p50_ms = latencyMs;
    if (mergedCostModel) updatePayload.cost_model = mergedCostModel;

    const { error: updateError } = await db.from("tools").update(updatePayload).eq("id", toolId);

    if (updateError) {
      console.error(`[sync-benchmarks] Failed to update ${toolId}: ${updateError.message}`);
    } else {
      results.push({ toolId, modelSlug, status: "updated", latencyMs, inputCostPer1k });
      console.log(
        `[sync-benchmarks] ${toolId} (${modelSlug}): latency=${latencyMs}ms, input=$${inputCostPer1k}/1k`
      );
    }
  }

  const updated = results.filter((r) => r.status === "updated").length;
  const noData = results.filter((r) => r.status === "no_data").length;

  console.log(`[sync-benchmarks] Done. ${updated} updated, ${noData} no AA data.`);
  return Response.json({ updated, noData, rateLimitRemaining, results });
}
