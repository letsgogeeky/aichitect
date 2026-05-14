export const dynamic = "force-dynamic";

/**
 * Hourly cron: scrape vendor status pages (Atlassian Statuspage format),
 * upsert into tool_incidents, and emit incident_started / incident_resolved
 * events. Authorization: Vercel Cron sends `Authorization: Bearer ${CRON_SECRET}`.
 * Schedule: hourly — see vercel.json.
 */

import { createClient } from "@supabase/supabase-js";

// Atlassian Statuspage exposes /api/v2/incidents.json on every page.
// Impact values: 'none' | 'minor' | 'major' | 'critical' (per Statuspage docs).
interface StatuspageIncident {
  id: string;
  name: string;
  status: "investigating" | "identified" | "monitoring" | "resolved" | "postmortem";
  impact: "none" | "minor" | "major" | "critical";
  created_at: string;
  started_at: string | null;
  resolved_at: string | null;
  shortlink: string;
  components: { name: string }[];
}

interface StatuspageResponse {
  incidents: StatuspageIncident[];
}

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_POSTGRES_SUPABASE_URL;
  const key = process.env.POSTGRES_SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error(
      "[sync-incidents] Missing env: NEXT_PUBLIC_POSTGRES_SUPABASE_URL / POSTGRES_SUPABASE_SERVICE_ROLE_KEY"
    );
    return null;
  }
  return createClient(url, key);
}

const MAJOR_OR_WORSE = new Set(["major", "critical"]);

export async function GET(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getServiceClient();
  if (!db) return Response.json({ error: "DB unavailable" }, { status: 500 });

  const { data: pages, error: pagesError } = await db
    .from("tool_status_page")
    .select("tool_id, url, kind, enabled")
    .eq("enabled", true);

  if (pagesError || !pages) {
    return Response.json(
      { error: `Failed to load status pages: ${pagesError?.message}` },
      { status: 500 }
    );
  }

  let inserted = 0;
  let updated = 0;
  let eventsFired = 0;
  const errors: string[] = [];

  for (const page of pages) {
    if (page.kind !== "atlassian_statuspage") {
      errors.push(`${page.tool_id}: unsupported kind ${page.kind}`);
      continue;
    }

    let body: StatuspageResponse;
    try {
      const res = await fetch(`${page.url.replace(/\/$/, "")}/api/v2/incidents.json`, {
        cache: "no-store",
        headers: { "User-Agent": "AIchitect/1.0 (+https://aichitect.dev)" },
      });
      if (!res.ok) {
        errors.push(`${page.tool_id}: HTTP ${res.status}`);
        continue;
      }
      body = (await res.json()) as StatuspageResponse;
    } catch (e) {
      errors.push(`${page.tool_id}: fetch failed — ${e instanceof Error ? e.message : String(e)}`);
      continue;
    }

    for (const inc of body.incidents ?? []) {
      const started = inc.started_at ?? inc.created_at;
      if (!started) continue;

      // Look up existing row to detect state transitions.
      const { data: existing } = await db
        .from("tool_incidents")
        .select("id, ended_at, severity, status")
        .eq("tool_id", page.tool_id)
        .eq("external_id", inc.id)
        .maybeSingle();

      const payload = {
        tool_id: page.tool_id,
        external_id: inc.id,
        started_at: started,
        ended_at: inc.resolved_at,
        severity: inc.impact,
        status: inc.status,
        title: inc.name,
        scope: inc.components.map((c) => c.name),
        url: inc.shortlink,
        last_synced_at: new Date().toISOString(),
      };

      if (!existing) {
        const { error } = await db.from("tool_incidents").insert(payload);
        if (error) {
          errors.push(`${page.tool_id}/${inc.id}: insert ${error.message}`);
          continue;
        }
        inserted++;

        // Fire incident_started only for major-or-worse, only when the incident is still ongoing.
        if (MAJOR_OR_WORSE.has(inc.impact) && !inc.resolved_at) {
          await db.from("tool_events").insert({
            tool_id: page.tool_id,
            type: "incident_started",
            old_hash: null,
            new_hash: null,
            metadata: {
              severity: inc.impact,
              title: inc.name,
              scope: inc.components.map((c) => c.name),
              url: inc.shortlink,
              started_at: started,
            },
          });
          eventsFired++;
        }
      } else {
        const { error } = await db.from("tool_incidents").update(payload).eq("id", existing.id);
        if (error) {
          errors.push(`${page.tool_id}/${inc.id}: update ${error.message}`);
          continue;
        }
        updated++;

        // Fire incident_resolved when ended_at transitions from null to a real timestamp.
        if (!existing.ended_at && inc.resolved_at && MAJOR_OR_WORSE.has(inc.impact)) {
          const durationMin = Math.round(
            (new Date(inc.resolved_at).getTime() - new Date(started).getTime()) / 60_000
          );
          await db.from("tool_events").insert({
            tool_id: page.tool_id,
            type: "incident_resolved",
            old_hash: null,
            new_hash: null,
            metadata: {
              severity: inc.impact,
              title: inc.name,
              scope: inc.components.map((c) => c.name),
              url: inc.shortlink,
              started_at: started,
              ended_at: inc.resolved_at,
              duration_minutes: durationMin,
            },
          });
          eventsFired++;
        }
      }
    }
  }

  console.log(
    `[sync-incidents] Done — pages: ${pages.length}, inserted: ${inserted}, updated: ${updated}, events: ${eventsFired}, errors: ${errors.length}`
  );
  return Response.json({
    pages: pages.length,
    inserted,
    updated,
    events_fired: eventsFired,
    errors,
  });
}
