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
const ALLOWLIST = [
  {
    id: 1124334,
    ghsa: "GHSA-mh99-v99m-4gvg",
    package: "brace-expansion",
    reason:
      "Fix requires eslint@10, but eslint-config-next@16.2.12's own " +
      "eslint-plugin-import and eslint-plugin-react-hooks cap eslint at " +
      "^9 — confirmed via dry-run install, ERESOLVE. Dev-only DoS in " +
      "eslint's file globbing, not shipped to users.",
    notedOn: "2026-07-30",
  },
  {
    id: 1117015,
    ghsa: "GHSA-qx2v-qp2m-jg93",
    package: "postcss",
    reason:
      "Bundled inside next's own node_modules; no fix available (npm audit fix reports none). Requires an upstream Next.js release.",
    notedOn: "2026-07-30",
  },
  {
    id: 1124252,
    ghsa: "GHSA-6g55-p6wh-862q",
    package: "postcss",
    reason:
      "Bundled inside next's own node_modules; no fix available. Requires an upstream Next.js release.",
    notedOn: "2026-07-30",
  },
  {
    id: 1124288,
    ghsa: "GHSA-r28c-9q8g-f849",
    package: "postcss",
    reason:
      "Bundled inside next's own node_modules; no fix available. Requires an upstream Next.js release.",
    notedOn: "2026-07-30",
  },
  {
    id: 1124066,
    ghsa: "GHSA-f88m-g3jw-g9cj",
    package: "sharp",
    reason:
      "Bundled inside next's own node_modules. Only next@16.3.0-preview.8+ " +
      "(prerelease) carries a patched sharp; latest stable is 16.2.12. " +
      "Not worth running a prerelease Next.js build in prod for this.",
    notedOn: "2026-07-30",
  },
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
