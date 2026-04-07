/**
 * AIC-6 — Seed remote Supabase tables from static JSON files.
 *
 * Usage:
 *   make seed           — upsert into remote Supabase
 *   make seed-validate  — validate data only, no DB connection required
 *
 * Env: NEXT_PUBLIC_SUPABASE_URL + POSTGRES_SUPABASE_SERVICE_ROLE_KEY
 *
 * Idempotent: uses upsert throughout (safe to re-run).
 */

import { createClient } from "@supabase/supabase-js";
import { validate, tools, stacks, slots, relationships } from "./seed-data";
import type { DbTool, DbStack, DbSlot, DbRelationship } from "./seed-data";

if (process.argv.includes("--validate")) {
  validate();
  console.log("\nValidation passed.");
  process.exit(0);
}

async function main(): Promise<void> {
  const url = process.env.NEXT_PUBLIC_POSTGRES_SUPABASE_URL;
  const key = process.env.POSTGRES_SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error(
      "Missing required env vars: NEXT_PUBLIC_POSTGRES_SUPABASE_URL, POSTGRES_SUPABASE_SERVICE_ROLE_KEY"
    );
    process.exit(1);
  }

  validate();

  const supabase = createClient(url, key);

  async function upsert<T extends object>(
    table: string,
    rows: T[],
    onConflict?: string
  ): Promise<void> {
    const opts = onConflict ? { onConflict } : undefined;
    const { error } = await supabase.from(table).upsert(rows, opts);
    if (error) {
      console.error(`✗ ${table}: ${error.message}`);
      process.exit(1);
    }
    console.log(`✓ ${table}: ${rows.length} rows upserted`);
  }

  // Order matters: tools must exist before relationships/stacks reference them.
  // latency_p50_ms is excluded from the upsert payload — the cron job owns it
  // for AA-synced tools and we never want a seed run to overwrite those values.
  // A separate "fill nulls" pass below sets it only where the DB has no value yet.
  await upsert<Omit<DbTool, "latency_p50_ms">>(
    "tools",
    tools.map(({ latency_p50_ms: _, ...rest }) => rest)
  );

  // Fill latency_p50_ms only where it's currently null (static benchmark values).
  // This preserves any value written by the sync-benchmarks cron.
  const toolsWithLatency = tools.filter((t) => t.latency_p50_ms !== null);
  for (const t of toolsWithLatency) {
    const { error } = await supabase
      .from("tools")
      .update({ latency_p50_ms: t.latency_p50_ms })
      .eq("id", t.id)
      .is("latency_p50_ms", null);
    if (error) {
      console.error(`✗ tools.latency_p50_ms (${t.id}): ${error.message}`);
      process.exit(1);
    }
  }
  if (toolsWithLatency.length > 0)
    console.log(`✓ tools.latency_p50_ms: ${toolsWithLatency.length} rows backfilled (nulls only)`);

  // Stacks has a self-referential FK (graduates_to). Two-pass to avoid FK violations:
  // pass 1 — insert all rows with graduates_to nulled out
  await upsert<DbStack>(
    "stacks",
    stacks.map((s) => ({ ...s, graduates_to: null }))
  );
  // pass 2 — update graduates_to now that all stacks exist
  const withGraduates = stacks.filter((s) => s.graduates_to !== null);
  for (const s of withGraduates) {
    const { error } = await supabase
      .from("stacks")
      .update({ graduates_to: s.graduates_to })
      .eq("id", s.id);
    if (error) {
      console.error(`✗ stacks.graduates_to (${s.id}): ${error.message}`);
      process.exit(1);
    }
  }
  if (withGraduates.length > 0)
    console.log(`✓ stacks.graduates_to: ${withGraduates.length} updated`);

  await upsert<DbSlot>("slots", slots);
  await upsert<DbRelationship>("relationships", relationships, "source,target,type");

  console.log("\nSeed complete.");
}

main();
