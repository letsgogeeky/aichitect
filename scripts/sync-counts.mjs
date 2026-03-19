#!/usr/bin/env node
/**
 * sync-counts.mjs
 * Reads the three source-of-truth data files and patches hardcoded counts
 * in README.md and CLAUDE.md so they stay in sync automatically.
 *
 * Run manually:  node scripts/sync-counts.mjs
 * Auto-runs via: .git/hooks/pre-commit
 */

import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const tools = JSON.parse(readFileSync(join(root, "data/tools.json"), "utf8"));
const stacks = JSON.parse(readFileSync(join(root, "data/stacks.json"), "utf8"));
const rels = JSON.parse(readFileSync(join(root, "data/relationships.json"), "utf8"));

const T = tools.length;
const C = new Set(tools.map((t) => t.category)).size;
const S = stacks.length;
const R = rels.length;

console.log(`counts: tools=${T}  categories=${C}  stacks=${S}  relationships=${R}`);

/** Apply an array of [regex, replacement] pairs to a file, write if changed. */
function patch(filePath, replacements) {
  let content = readFileSync(filePath, "utf8");
  const original = content;
  for (const [pattern, replacement] of replacements) {
    content = content.replace(pattern, replacement);
  }
  if (content !== original) {
    writeFileSync(filePath, content, "utf8");
    console.log(`  updated ${filePath.replace(root + "/", "")}`);
  } else {
    console.log(`  no changes in ${filePath.replace(root + "/", "")}`);
  }
}

// ── README.md ────────────────────────────────────────────────────────────────
patch(join(root, "README.md"), [
  // Shield badges
  [/tools-\d+-7c6bff/g, `tools-${T}-7c6bff`],
  [/alt="\d+ tools"/g, `alt="${T} tools"`],
  [/categories-\d+-00d4aa/g, `categories-${C}-00d4aa`],
  [/alt="\d+ categories"/g, `alt="${C} categories"`],
  // Prose — bold counts
  [/\*\*\d+ tools\*\* across \*\*\d+ categories\*\*/g, `**${T} tools** across **${C} categories**`],
  [/Browse all \d+ tools/g, `Browse all ${T} tools`],
  // Section heading
  [/### Stacks — \d+ curated starting points/g, `### Stacks — ${S} curated starting points`],
  // Project structure comments
  [/(tools\.json\s+#\s+)\d+ tools/g, `$1${T} tools`],
  [/(relationships\.json\s+#\s+~?)\d+ edges/g, `$1${R} edges`],
  [/(stacks\.json\s+#\s+)\d+ curated stacks/g, `$1${S} curated stacks`],
  // Inline prose with bare numbers (e.g. "123 tools across 12 categories")
  [/\b\d+ tools across \d+ categories\b/g, `${T} tools across ${C} categories`],
]);

// ── CLAUDE.md ─────────────────────────────────────────────────────────────────
patch(join(root, "CLAUDE.md"), [
  // Architecture: stacks/ route description
  [
    /→ \d+ curated stacks \(sidebar \+ dagre graph\)/g,
    `→ ${S} curated stacks (sidebar + dagre graph)`,
  ],
  // Data section: tools.json comment
  [/→ \d+ tools, \d+ categories/g, `→ ${T} tools, ${C} categories`],
  // Data section: relationships.json comment
  [/→ ~?\d+ edges \(/g, `→ ~${R} edges (`],
  // Data section: stacks.json comment
  [/→ \d+ curated stacks with flow edges/g, `→ ${S} curated stacks with flow edges`],
]);
