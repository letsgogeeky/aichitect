export const dynamic = "force-dynamic";

import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { fetchToolGitHubData, type GitHubToolData } from "@/lib/github";
import { selectCrossedMilestones } from "@/lib/healthMilestones";
import type { CostModel, Pricing } from "@/lib/types";

/**
 * Compute a field-level diff between two pricing/cost_model snapshots.
 * Numeric cost_model fields also get a delta_pct for sparkline rendering.
 */
function computePricingDiff(
  oldP: Pricing | null,
  newP: Pricing,
  oldCM: CostModel | null,
  newCM: CostModel | null
): Record<string, { old: unknown; new: unknown; delta_pct?: number }> {
  const diff: Record<string, { old: unknown; new: unknown; delta_pct?: number }> = {};

  if ((oldP?.free_tier ?? null) !== newP.free_tier) {
    diff["pricing.free_tier"] = { old: oldP?.free_tier ?? null, new: newP.free_tier };
  }

  const numericKeys: (keyof CostModel)[] = [
    "input_cost_per_1k_tokens",
    "output_cost_per_1k_tokens",
    "cached_input_cost_per_1k_tokens",
    "cache_write_cost_per_1k_tokens",
    "batch_input_cost_per_1k_tokens",
    "batch_output_cost_per_1k_tokens",
    "cost_per_month_base",
    "cost_per_seat",
    "cost_per_call",
    "cost_per_event",
    "storage_cost_per_gb_month",
    "query_cost_per_million",
    "write_cost_per_million",
    "min_monthly_cost",
  ];

  for (const k of numericKeys) {
    const oldV = oldCM?.[k] ?? null;
    const newV = newCM?.[k] ?? null;
    if (oldV !== newV) {
      const entry: { old: unknown; new: unknown; delta_pct?: number } = { old: oldV, new: newV };
      if (typeof oldV === "number" && typeof newV === "number" && oldV !== 0) {
        entry.delta_pct = ((newV - oldV) / oldV) * 100;
      }
      diff[`cost_model.${k}`] = entry;
    }
  }

  if ((oldCM?.type ?? null) !== (newCM?.type ?? null)) {
    diff["cost_model.type"] = { old: oldCM?.type ?? null, new: newCM?.type ?? null };
  }

  return diff;
}

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_POSTGRES_SUPABASE_URL;
  const key = process.env.POSTGRES_SUPABASE_SERVICE_ROLE_KEY;
  if (!url) {
    console.error("[sync-health] Missing env var: NEXT_PUBLIC_POSTGRES_SUPABASE_URL");
    return null;
  }
  if (!key) {
    console.error("[sync-health] Missing env var: POSTGRES_SUPABASE_SERVICE_ROLE_KEY");
    return null;
  }
  return createClient(url, key);
}

function computeHealthScore(data: GitHubToolData, prevStars: number | null): number {
  if (data.archived) return 0;

  // Commit recency (40pts)
  const daysSinceCommit =
    (Date.now() - new Date(data.last_commit_at).getTime()) / (1000 * 60 * 60 * 24);
  let recency = 0;
  if (daysSinceCommit <= 7) recency = 40;
  else if (daysSinceCommit <= 30) recency = 30;
  else if (daysSinceCommit <= 90) recency = 15;
  else if (daysSinceCommit <= 180) recency = 5;

  // Stars momentum (30pts) — default 15 when no 30d snapshot exists
  let momentum = 15;
  if (prevStars !== null) {
    if (data.stars > prevStars) momentum = 30;
    else if (data.stars < prevStars) momentum = 0;
    else momentum = 15;
  }

  // Issue health (20pts)
  const issueRatio = data.open_issues / Math.max(data.stars, 1);
  let issueScore = 0;
  if (issueRatio < 0.01) issueScore = 20;
  else if (issueRatio < 0.05) issueScore = 15;
  else if (issueRatio < 0.1) issueScore = 10;
  else if (issueRatio < 0.2) issueScore = 5;

  // Forks bonus (10pts)
  let forksScore = 0;
  if (data.forks > 100) forksScore = 10;
  else if (data.forks > 10) forksScore = 5;

  return Math.min(100, Math.max(0, recency + momentum + issueScore + forksScore));
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getServiceClient();
  if (!db) {
    return Response.json({ error: "Supabase not configured" }, { status: 500 });
  }

  if (!process.env.GITHUB_TOKEN) {
    console.warn(
      "[sync-health] ⚠ GITHUB_TOKEN not set — running unauthenticated (60 req/hr limit). Only ~60 tools will sync per run."
    );
  }

  const startTime = Date.now();
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { data: tools, error: toolsError } = await db
    .from("tools")
    .select("id, name, github_url, health_score, is_stale")
    .not("github_url", "is", null)
    .or(`last_synced_at.is.null,last_synced_at.lt.${oneHourAgo}`);

  if (toolsError || !tools) {
    return Response.json({ error: "Failed to fetch tools" }, { status: 500 });
  }

  console.log(`[sync-health] Starting run — ${tools.length} tools with GitHub URLs`);

  let processed = 0;
  let skipped = 0;
  let errors = 0;
  let eventsWritten = 0;

  for (const tool of tools) {
    if (!tool.github_url) {
      skipped++;
      continue;
    }

    const {
      data: ghData,
      error: fetchError,
      rateLimitRemaining,
    } = await fetchToolGitHubData(tool.github_url);

    if (fetchError === "rate_limited") {
      console.error(
        `[sync-health] ✗ Rate limit exhausted after ${processed} tools — aborting run. Set GITHUB_TOKEN for 5,000 req/hr.`
      );
      break;
    }

    if (fetchError === "unauthorized") {
      console.error(
        `[sync-health] ✗ GITHUB_TOKEN rejected (401) on first call — aborting run. Rotate the PAT in Vercel and redeploy.`
      );
      return Response.json(
        { error: "github_token_unauthorized", processed, skipped, errors },
        { status: 500 }
      );
    }

    if (!ghData) {
      console.log(
        `[sync-health] ✗ ${tool.name} — skipped (${fetchError ?? "unknown"}${rateLimitRemaining !== undefined ? `, remaining: ${rateLimitRemaining}` : ""})`
      );
      skipped++;
      continue;
    }

    // Find snapshot closest to 30 days ago for stars momentum + archived baseline
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: prevSnapshot } = await db
      .from("tool_snapshots")
      .select("stars")
      .eq("tool_id", tool.id)
      .lte("recorded_at", thirtyDaysAgo)
      .order("recorded_at", { ascending: false })
      .limit(1)
      .single();

    // Most recent snapshot (any age) — used for star milestone crossing detection
    const { data: latestSnapshot } = await db
      .from("tool_snapshots")
      .select("stars")
      .eq("tool_id", tool.id)
      .order("recorded_at", { ascending: false })
      .limit(1)
      .single();

    const prevStars = prevSnapshot?.stars ?? null;
    const starsDelta = prevStars !== null ? ghData.stars - prevStars : null;
    const healthScore = computeHealthScore(ghData, prevStars);

    const daysSinceCommit =
      (Date.now() - new Date(ghData.last_commit_at).getTime()) / (1000 * 60 * 60 * 24);
    const isStale = ghData.archived || daysSinceCommit > 90;
    const now = new Date().toISOString();

    // ── Transition events ──────────────────────────────────────────────────

    // Health score change (≥10 point swing)
    const oldScore = tool.health_score ?? null;
    if (oldScore !== null && Math.abs(healthScore - oldScore) >= 10) {
      const { error: eventError } = await db.from("tool_events").insert({
        tool_id: tool.id,
        type: "health_score_change",
        metadata: {
          old_score: oldScore,
          new_score: healthScore,
          delta: healthScore - oldScore,
          stars_delta: starsDelta,
          days_since_commit: Math.floor(daysSinceCommit),
          was_stale: tool.is_stale ?? false,
          is_stale: isStale,
        },
      });
      if (eventError) {
        console.error(
          `[sync-health] ✗ ${tool.name} — health_score_change event failed: ${eventError.message}`
        );
      } else {
        eventsWritten++;
      }
    }

    // Stale transition (false → true)
    if (!tool.is_stale && isStale) {
      const { error: eventError } = await db.from("tool_events").insert({
        tool_id: tool.id,
        type: "stale_transition",
        metadata: {
          archived: ghData.archived,
          days_since_commit: Math.floor(daysSinceCommit),
        },
      });
      if (eventError) {
        console.error(
          `[sync-health] ✗ ${tool.name} — stale_transition event failed: ${eventError.message}`
        );
      } else {
        eventsWritten++;
        console.log(`[sync-health] ⚠ ${tool.name} — stale transition detected`);
      }
    }

    // Archived transition — only fire once ever; use maybeSingle to reliably detect prior event
    const { data: existingArchiveEvent } = ghData.archived
      ? await db
          .from("tool_events")
          .select("id")
          .eq("tool_id", tool.id)
          .eq("type", "archived_detected")
          .limit(1)
          .maybeSingle()
      : { data: null };
    if (ghData.archived && !existingArchiveEvent) {
      const { error: eventError } = await db.from("tool_events").insert({
        tool_id: tool.id,
        type: "archived_detected",
        metadata: {},
      });
      if (eventError) {
        console.error(
          `[sync-health] ✗ ${tool.name} — archived_detected event failed: ${eventError.message}`
        );
      } else {
        eventsWritten++;
        console.log(`[sync-health] 🗄 ${tool.name} — archived on GitHub`);
      }
    }

    // Star milestone crossings — fire once per milestone, using most recent snapshot as baseline.
    // Batched into a single insert per tool so a fast-grower crossing 3 milestones in one run is
    // one round-trip, not three.
    const prevLatestStars = latestSnapshot?.stars ?? null;
    const crossedMilestones = selectCrossedMilestones(prevLatestStars, ghData.stars);
    const milestoneRows = crossedMilestones.map((milestone) => ({
      tool_id: tool.id,
      type: "star_milestone" as const,
      metadata: { milestone, stars: ghData.stars },
    }));
    if (milestoneRows.length > 0) {
      const { error: eventError } = await db.from("tool_events").insert(milestoneRows);
      if (eventError) {
        console.error(
          `[sync-health] ✗ ${tool.name} — star_milestone batch failed: ${eventError.message}`
        );
      } else {
        eventsWritten += milestoneRows.length;
        for (const row of milestoneRows) {
          console.log(
            `[sync-health] ⭐ ${tool.name} — crossed ${row.metadata.milestone.toLocaleString()} stars`
          );
        }
      }
    }

    // ── Snapshot insert ────────────────────────────────────────────────────

    const { error: snapshotError } = await db.from("tool_snapshots").insert({
      tool_id: tool.id,
      stars: ghData.stars,
      last_commit_at: ghData.last_commit_at,
      open_issues: ghData.open_issues,
      forks: ghData.forks,
      archived: ghData.archived,
      health_score: healthScore,
      stars_delta: starsDelta,
    });

    if (snapshotError) {
      console.error(
        `[sync-health] ✗ ${tool.name} — snapshot insert failed: ${snapshotError.message}`
      );
      errors++;
      continue;
    }

    const { error: updateError } = await db
      .from("tools")
      .update({
        health_score: healthScore,
        last_synced_at: now,
        is_stale: isStale,
        stars_delta: starsDelta,
      })
      .eq("id", tool.id);

    if (updateError) {
      console.error(`[sync-health] ✗ ${tool.name} — tool update failed: ${updateError.message}`);
      errors++;
      continue;
    }

    const starsDisplay =
      ghData.stars >= 1000 ? `${(ghData.stars / 1000).toFixed(0)}k` : String(ghData.stars);
    const deltaDisplay =
      starsDelta !== null ? ` (${starsDelta >= 0 ? "+" : ""}${starsDelta} vs 30d)` : "";
    const dayLabel =
      Math.floor(daysSinceCommit) === 1 ? "1d ago" : `${Math.floor(daysSinceCommit)}d ago`;
    console.log(
      `[sync-health] ✓ ${tool.name} (score: ${healthScore}, stars: ${starsDisplay}${deltaDisplay}, last_commit: ${dayLabel})`
    );
    processed++;
  }

  // ── Pricing change detection ──────────────────────────────────────────────

  const { data: allTools, error: allToolsError } = await db
    .from("tools")
    .select("id, name, pricing, cost_model, pricing_hash");

  let pricingChecked = 0;
  let pricingChanged = 0;

  if (allToolsError || !allTools) {
    console.error(`[sync-health] pricing check — failed to fetch tools: ${allToolsError?.message}`);
  } else {
    for (const tool of allTools) {
      // Hash covers both fields — any change to pricing tiers or cost model triggers an event
      const newHash = createHash("sha256")
        .update(JSON.stringify({ pricing: tool.pricing, cost_model: tool.cost_model ?? null }))
        .digest("hex");

      if (tool.pricing_hash === null) {
        // First sight — bank the baseline snapshot in history (no diff, no event)
        // so trend queries always have a t=0 point.
        await db.from("tool_pricing_history").insert({
          tool_id: tool.id,
          pricing: tool.pricing,
          cost_model: tool.cost_model ?? null,
          pricing_hash: newHash,
          diff: null,
        });
        await db.from("tools").update({ pricing_hash: newHash }).eq("id", tool.id);
        pricingChecked++;
        continue;
      }

      if (tool.pricing_hash !== newHash) {
        // Fetch the last history row to use as the "old" baseline for the diff.
        // Falls back to the previous pricing_change event for tools that pre-date
        // tool_pricing_history (one-time legacy path).
        const { data: prevHistory } = await db
          .from("tool_pricing_history")
          .select("pricing, cost_model")
          .eq("tool_id", tool.id)
          .order("recorded_at", { ascending: false })
          .limit(1)
          .single();

        let oldPricing: Pricing | null = prevHistory?.pricing ?? null;
        let oldCostModel: CostModel | null = prevHistory?.cost_model ?? null;
        if (oldPricing === null) {
          const { data: prevPricingEvent } = await db
            .from("tool_events")
            .select("metadata")
            .eq("tool_id", tool.id)
            .eq("type", "pricing_change")
            .order("detected_at", { ascending: false })
            .limit(1)
            .single();
          oldPricing = prevPricingEvent?.metadata?.new_pricing ?? null;
          oldCostModel = prevPricingEvent?.metadata?.new_cost_model ?? null;
        }

        const diff = computePricingDiff(
          oldPricing,
          tool.pricing,
          oldCostModel,
          tool.cost_model ?? null
        );

        const { error: eventError } = await db.from("tool_events").insert({
          tool_id: tool.id,
          type: "pricing_change",
          old_hash: tool.pricing_hash,
          new_hash: newHash,
          metadata: {
            old_pricing: oldPricing,
            new_pricing: tool.pricing,
            old_cost_model: oldCostModel,
            new_cost_model: tool.cost_model ?? null,
            diff,
          },
        });

        if (eventError) {
          console.error(
            `[sync-health] pricing ✗ ${tool.name} — event insert failed: ${eventError.message}`
          );
        } else {
          // Bank the new snapshot in history alongside the event.
          await db.from("tool_pricing_history").insert({
            tool_id: tool.id,
            pricing: tool.pricing,
            cost_model: tool.cost_model ?? null,
            pricing_hash: newHash,
            diff,
          });
          await db.from("tools").update({ pricing_hash: newHash }).eq("id", tool.id);
          const changedFieldCount = Object.keys(diff).length;
          console.log(
            `[sync-health] pricing change detected: ${tool.name} (${changedFieldCount} field${changedFieldCount === 1 ? "" : "s"})`
          );
          pricingChanged++;
          eventsWritten++;
        }
      }

      pricingChecked++;
    }
    console.log(`[sync-health] pricing — checked: ${pricingChecked}, changed: ${pricingChanged}`);
  }

  const duration_ms = Date.now() - startTime;
  console.log(
    `[sync-health] Done — processed: ${processed}, skipped: ${skipped}, errors: ${errors}, events: ${eventsWritten}, duration: ${duration_ms}ms`
  );

  return Response.json({
    processed,
    skipped,
    errors,
    events_written: eventsWritten,
    pricing_checked: pricingChecked,
    pricing_changed: pricingChanged,
    duration_ms,
  });
}
