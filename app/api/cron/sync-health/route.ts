export const dynamic = "force-dynamic";

import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { fetchToolGitHubData, type GitHubToolData } from "@/lib/github";

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

    const ghData = await fetchToolGitHubData(tool.github_url);
    if (!ghData) {
      console.log(`[sync-health] ✗ ${tool.name} — GitHub returned null, skipping`);
      skipped++;
      continue;
    }

    // Find snapshot closest to 30 days ago for stars momentum + archived baseline
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: prevSnapshot } = await db
      .from("tool_snapshots")
      .select("stars, archived")
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
        metadata: { old_score: oldScore, new_score: healthScore, delta: healthScore - oldScore },
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

    // Archived transition — only fire once, even if prevSnapshot is absent
    const wasArchived = prevSnapshot?.archived ?? false;
    const { count: existingArchiveCount } = ghData.archived
      ? await db
          .from("tool_events")
          .select("id", { count: "exact", head: true })
          .eq("tool_id", tool.id)
          .eq("type", "archived_detected")
      : { count: 0 };
    if (!wasArchived && ghData.archived && !existingArchiveCount) {
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

    // Star milestone crossings — fire once per milestone, using most recent snapshot as baseline
    const STAR_MILESTONES = [1000, 5000, 10000, 25000, 50000, 100000];
    const prevLatestStars = latestSnapshot?.stars ?? 0;
    for (const milestone of STAR_MILESTONES) {
      if (prevLatestStars < milestone && ghData.stars >= milestone) {
        const { error: eventError } = await db.from("tool_events").insert({
          tool_id: tool.id,
          type: "star_milestone",
          metadata: { milestone, stars: ghData.stars },
        });
        if (eventError) {
          console.error(
            `[sync-health] ✗ ${tool.name} — star_milestone event failed: ${eventError.message}`
          );
        } else {
          eventsWritten++;
          console.log(
            `[sync-health] ⭐ ${tool.name} — crossed ${milestone.toLocaleString()} stars`
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
    .select("id, name, pricing, pricing_hash");

  let pricingChecked = 0;
  let pricingChanged = 0;

  if (allToolsError || !allTools) {
    console.error(`[sync-health] pricing check — failed to fetch tools: ${allToolsError?.message}`);
  } else {
    for (const tool of allTools) {
      const newHash = createHash("sha256").update(JSON.stringify(tool.pricing)).digest("hex");

      if (tool.pricing_hash === null) {
        // First run — set baseline hash, no event written
        await db.from("tools").update({ pricing_hash: newHash }).eq("id", tool.id);
        pricingChecked++;
        continue;
      }

      if (tool.pricing_hash !== newHash) {
        // Fetch previous pricing_change event's new_pricing as the "old" baseline
        const { data: prevPricingEvent } = await db
          .from("tool_events")
          .select("metadata")
          .eq("tool_id", tool.id)
          .eq("type", "pricing_change")
          .order("detected_at", { ascending: false })
          .limit(1)
          .single();

        const oldPricing = prevPricingEvent?.metadata?.new_pricing ?? null;

        const { error: eventError } = await db.from("tool_events").insert({
          tool_id: tool.id,
          type: "pricing_change",
          old_hash: tool.pricing_hash,
          new_hash: newHash,
          metadata: { old_pricing: oldPricing, new_pricing: tool.pricing },
        });

        if (eventError) {
          console.error(
            `[sync-health] pricing ✗ ${tool.name} — event insert failed: ${eventError.message}`
          );
        } else {
          await db.from("tools").update({ pricing_hash: newHash }).eq("id", tool.id);
          console.log(`[sync-health] pricing change detected: ${tool.name}`);
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
