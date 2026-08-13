#!/usr/bin/env node
/**
 * audit-check.mjs
 * Runs `npm audit --json` and fails on any high/critical advisory that
 * isn't in the allowlist below. Unlike `npm audit --audit-level=high`,
 * this still catches NEW high-severity advisories on already-allowlisted
 * packages, since matching is by advisory id, not package name.
 *
 * Run manually:  node scripts/audit-check.mjs
 * Runs in CI via: .github/workflows/ci.yml "Audit dependencies" step
 */

import { spawnSync } from "child_process";

// Advisories with no available fix as of the date noted. Re-run
// `npm audit` after any dependency bump and remove entries that no
// longer appear.
//
// Empty as of 2026-08-12: bumping next to 16.3.0 pulled in patched
// postcss/sharp, and a transitive dedupe cleared brace-expansion. Only
// remaining advisory is a low-severity esbuild issue (Windows dev-server
// only), below this script's high/critical threshold.
const ALLOWLIST = [];

const allowedIds = new Set(ALLOWLIST.map((a) => a.id));

const result = spawnSync("npm", ["audit", "--json"], { encoding: "utf8" });
if (!result.stdout) {
  console.error("npm audit produced no output");
  console.error(result.stderr);
  process.exit(1);
}

const report = JSON.parse(result.stdout);
const advisories = new Map();

for (const vuln of Object.values(report.vulnerabilities ?? {})) {
  if (vuln.severity !== "high" && vuln.severity !== "critical") continue;
  for (const via of vuln.via) {
    if (typeof via !== "object" || !via.source) continue;
    advisories.set(via.source, { ...via, package: vuln.name });
  }
}

const unallowed = [...advisories.values()].filter((a) => !allowedIds.has(a.source));

if (unallowed.length > 0) {
  console.error(`${unallowed.length} high/critical advisory(ies) not in the allowlist:\n`);
  for (const a of unallowed) {
    console.error(`  [${a.severity}] ${a.package}: ${a.title}`);
    console.error(`    ${a.url}\n`);
  }
  console.error(
    "If these are genuinely unfixable, add them to ALLOWLIST in scripts/audit-check.mjs with a reason."
  );
  process.exit(1);
}

const stale = ALLOWLIST.filter((a) => ![...advisories.keys()].includes(a.id));
if (stale.length > 0) {
  console.log(
    `${stale.length} allowlist entr${stale.length === 1 ? "y is" : "ies are"} no longer reported — safe to remove from scripts/audit-check.mjs:`
  );
  for (const a of stale) console.log(`  ${a.ghsa} (${a.package})`);
}

console.log(
  `audit-check: ${advisories.size} high/critical advisory(ies) present, all allowlisted. Clean.`
);
