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
// 2026-10-02: the Cloudflare migration added `wrangler` + `@opennextjs/
// cloudflare` as devDependencies. One critical advisory this also
// surfaced (Next.js RCE in next/og ImageResponse, GHSA-vcvr-r3jv-pc5j)
// was a real fix, not an allowlist candidate — bumped next to 16.3.8
// (16.3.6+ patches it). `undici`'s advisory cleared by bumping wrangler
// to latest (4.146.0). What's left, all transitive dev-tooling only
// (never bundled into the deployed app):
//   - brace-expansion (GHSA-q2hr-2g5m-vwhr, GHSA-qhr7-859c-m2p7,
//     GHSA-6j4f-fj2g-mc7p): via @opennextjs/cloudflare's own
//     @node-minify/core -> glob -> minimatch chain, even at latest
//     (1.20.7). No newer release available upstream yet.
//   - fast-uri (GHSA-5jgf-p345-68v8, GHSA-f65p-4m7j-42xc,
//     GHSA-fph4-wmhf-6fwf, GHSA-jqff-g426-hqxp, GHSA-qw65-cvwx-89v3,
//     GHSA-hrr3-gc8f-f4qj): via @modelcontextprotocol/sdk's ajv/
//     ajv-formats chain — pre-existing, unrelated to this migration.
//   - js-yaml (GHSA-2883-xcg3-v3hh): via eslint's own @eslint/eslintrc —
//     pre-existing, unrelated to this migration.
const ALLOWLIST = [
  { id: 1240100, ghsa: "GHSA-q2hr-2g5m-vwhr", package: "brace-expansion" },
  { id: 1240103, ghsa: "GHSA-q2hr-2g5m-vwhr", package: "brace-expansion" },
  { id: 1240104, ghsa: "GHSA-qhr7-859c-m2p7", package: "brace-expansion" },
  { id: 1240107, ghsa: "GHSA-qhr7-859c-m2p7", package: "brace-expansion" },
  { id: 1240108, ghsa: "GHSA-6j4f-fj2g-mc7p", package: "brace-expansion" },
  { id: 1240111, ghsa: "GHSA-6j4f-fj2g-mc7p", package: "brace-expansion" },
  { id: 1158521, ghsa: "GHSA-5jgf-p345-68v8", package: "fast-uri" },
  { id: 1158524, ghsa: "GHSA-f65p-4m7j-42xc", package: "fast-uri" },
  { id: 1158527, ghsa: "GHSA-fph4-wmhf-6fwf", package: "fast-uri" },
  { id: 1158530, ghsa: "GHSA-jqff-g426-hqxp", package: "fast-uri" },
  { id: 1239943, ghsa: "GHSA-qw65-cvwx-89v3", package: "fast-uri" },
  { id: 1240091, ghsa: "GHSA-hrr3-gc8f-f4qj", package: "fast-uri" },
  { id: 1193727, ghsa: "GHSA-2883-xcg3-v3hh", package: "js-yaml" },
];

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
