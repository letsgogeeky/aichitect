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

    const ttftMs = aaToLatencyMs(model.median_time_to_first_token_seconds);
    const throughput =
      model.median_output_tokens_per_second != null
        ? Math.round(model.median_output_tokens_per_second)
        : null;
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

    // Fetch current cost_model to merge with (preserve pricing_url, free_tier_limit,
    // cached/batch prices, etc. — those aren't in the AA feed yet)
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
    if (ttftMs !== null) updatePayload.ttft_p50_ms = ttftMs;
    if (throughput !== null) updatePayload.output_tokens_per_second = throughput;
    if (mergedCostModel) updatePayload.cost_model = mergedCostModel;

    const { error: updateError } = await db.from("tools").update(updatePayload).eq("id", toolId);

    if (updateError) {
      console.error(`[sync-benchmarks] Failed to update ${toolId}: ${updateError.message}`);
      continue;
    }

    // ── Bank a benchmark_history row + detect WoW drift ──────────────────────

    const ttfaMs = aaToLatencyMs(model.median_time_to_first_answer_token);
    const { data: prevBenchmark } = await db
      .from("tool_benchmark_history")
      .select("ttft_p50_ms, output_tokens_per_second")
      .eq("tool_id", toolId)
      .order("recorded_at", { ascending: false })
      .limit(1)
      .single();

    const oldTtft: number | null = prevBenchmark?.ttft_p50_ms ?? null;
    const oldThroughput: number | null = prevBenchmark?.output_tokens_per_second ?? null;

    const { error: historyError } = await db.from("tool_benchmark_history").insert({
      tool_id: toolId,
      ttft_p50_ms: ttftMs,
      output_tokens_per_second: throughput,
      ttfa_p50_ms: ttfaMs,
      input_cost_per_1k: inputCostPer1k,
      output_cost_per_1k: outputCostPer1k,
      model_slug: modelSlug,
    });
    if (historyError) {
      console.error(`[sync-benchmarks] history insert ✗ ${toolId}: ${historyError.message}`);
    }

    // Fire benchmark_drift event when WoW change is significant. TTFT is
    // noisier than throughput, so use a higher threshold there.
    const ttftDeltaPct =
      oldTtft != null && ttftMs != null && oldTtft > 0
        ? ((ttftMs - oldTtft) / oldTtft) * 100
        : null;
    const throughputDeltaPct =
      oldThroughput != null && throughput != null && oldThroughput > 0
        ? ((throughput - oldThroughput) / oldThroughput) * 100
        : null;

    const ttftDrifted = ttftDeltaPct != null && Math.abs(ttftDeltaPct) >= 15;
    const throughputDrifted = throughputDeltaPct != null && Math.abs(throughputDeltaPct) >= 10;

    if (ttftDrifted || throughputDrifted) {
      const { error: eventError } = await db.from("tool_events").insert({
        tool_id: toolId,
        type: "benchmark_drift",
        old_hash: null,
        new_hash: null,
        metadata: {
          ttft_delta_pct: ttftDeltaPct,
          throughput_delta_pct: throughputDeltaPct,
          old_ttft_ms: oldTtft,
          new_ttft_ms: ttftMs,
          old_throughput: oldThroughput,
          new_throughput: throughput,
          model_slug: modelSlug,
        },
      });
      if (eventError) {
        console.error(`[sync-benchmarks] drift event ✗ ${toolId}: ${eventError.message}`);
      } else {
        console.log(
          `[sync-benchmarks] drift: ${toolId} ttft ${ttftDeltaPct?.toFixed(1) ?? "—"}% / throughput ${throughputDeltaPct?.toFixed(1) ?? "—"}%`
        );
      }
    }

    results.push({ toolId, modelSlug, status: "updated", latencyMs: ttftMs, inputCostPer1k });
    console.log(
      `[sync-benchmarks] ${toolId} (${modelSlug}): ttft=${ttftMs}ms, throughput=${throughput}tok/s, input=$${inputCostPer1k}/1k`
    );
  }

  const updated = results.filter((r) => r.status === "updated").length;
  const noData = results.filter((r) => r.status === "no_data").length;

  console.log(`[sync-benchmarks] Done. ${updated} updated, ${noData} no AA data.`);
  return Response.json({ updated, noData, rateLimitRemaining, results });
}
