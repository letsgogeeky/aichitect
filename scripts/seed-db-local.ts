/**
 * AIC-6 — Seed the local Postgres container from static JSON files.
 *
 * Usage:  make seed-local
 * Env:    DATABASE_URL (defaults to local docker-compose db service)
 *
 * Uses pg directly (no PostgREST needed) — works against bare Postgres.
 * Idempotent: uses INSERT ... ON CONFLICT DO UPDATE throughout.
 */

import { Client } from "pg";
import { validate, tools, stacks, slots, relationships } from "./seed-data";

const DATABASE_URL = process.env.DATABASE_URL ?? "postgresql://postgres:postgres@db:5432/aichitect";

async function main(): Promise<void> {
  validate();

  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();

  async function upsertTools(): Promise<void> {
    for (const t of tools) {
      await client.query(
        `INSERT INTO tools
           (id, name, category, tagline, description, type, pricing,
            github_stars, slot, prominent, provider, choose_if, aliases,
            website_url, github_url, use_context)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
         ON CONFLICT (id) DO UPDATE SET
           name=$2, category=$3, tagline=$4, description=$5, type=$6,
           pricing=$7, github_stars=$8, slot=$9, prominent=$10, provider=$11,
           choose_if=$12, aliases=$13, website_url=$14, github_url=$15,
           use_context=$16`,
        [
          t.id,
          t.name,
          t.category,
          t.tagline,
          t.description,
          t.type,
          JSON.stringify(t.pricing),
          t.github_stars,
          t.slot,
          t.prominent,
          t.provider,
          t.choose_if,
          JSON.stringify(t.aliases),
          t.website_url,
          t.github_url,
          t.use_context ?? "both",
        ]
      );
    }
    console.log(`✓ tools: ${tools.length} rows`);
  }

  async function upsertStacks(): Promise<void> {
    // Pass 1: insert all stacks with graduates_to = null to satisfy the
    // self-referential FK (stacks_graduates_to_fkey) before any reference exists.
    for (const s of stacks) {
      await client.query(
        `INSERT INTO stacks
           (id, name, description, target, cluster, mission, tools, flow,
            not_in_stack, kill_conditions, graduates_to, tags, why,
            tradeoffs, complexity, monthly_cost, archetype)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NULL,$11,$12,$13,$14,$15,$16)
         ON CONFLICT (id) DO UPDATE SET
           name=$2, description=$3, target=$4, cluster=$5, mission=$6,
           tools=$7, flow=$8, not_in_stack=$9, kill_conditions=$10,
           graduates_to=NULL, tags=$11, why=$12, tradeoffs=$13,
           complexity=$14, monthly_cost=$15, archetype=$16`,
        [
          s.id,
          s.name,
          s.description,
          s.target,
          s.cluster,
          s.mission,
          s.tools,
          JSON.stringify(s.flow),
          JSON.stringify(s.not_in_stack),
          s.kill_conditions,
          s.tags,
          s.why,
          s.tradeoffs,
          s.complexity,
          s.monthly_cost,
          s.archetype ?? "app-infrastructure",
        ]
      );
    }
    // Pass 2: set graduates_to now that all stacks exist.
    for (const s of stacks) {
      if (s.graduates_to === null) continue;
      await client.query(`UPDATE stacks SET graduates_to = $1 WHERE id = $2`, [
        s.graduates_to,
        s.id,
      ]);
    }
    console.log(`✓ stacks: ${stacks.length} rows`);
  }

  async function upsertSlots(): Promise<void> {
    for (const s of slots) {
      await client.query(
        `INSERT INTO slots
           (id, name, description, tools, priority, suggest, suggest_reason)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (id) DO UPDATE SET
           name=$2, description=$3, tools=$4, priority=$5,
           suggest=$6, suggest_reason=$7`,
        [
          s.id,
          s.name,
          s.description,
          s.tools,
          JSON.stringify(s.priority),
          s.suggest,
          s.suggest_reason,
        ]
      );
    }
    console.log(`✓ slots: ${slots.length} rows`);
  }

  async function upsertRelationships(): Promise<void> {
    for (const r of relationships) {
      await client.query(
        `INSERT INTO relationships (source, target, type, how, achieves)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (source, target, type) DO UPDATE SET
           how=$4, achieves=$5`,
        [r.source, r.target, r.type, r.how, r.achieves]
      );
    }
    console.log(`✓ relationships: ${relationships.length} rows`);
  }

  // Order matters: tools must exist before relationships/stacks reference them.
  await upsertTools();
  await upsertStacks();
  await upsertSlots();
  await upsertRelationships();

  await client.end();
  console.log("\nLocal seed complete.");
}

main();
