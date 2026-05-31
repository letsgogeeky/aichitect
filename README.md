<div align="center">
  <img src="public/favicon.svg" width="64" height="64" alt="AIchitect logo" />
  <h1>AIchitect</h1>
  <p><strong>Cut the noise. Pick your AI stack.</strong></p>
  <p>An open-source, interactive map of the AI tooling ecosystem — with a cost/latency simulator, a stack-genome scanner, and a live activity feed of what's changing across vendors.</p>

  <p>
    <a href="https://aichitect.dev">aichitect.dev</a> ·
    <a href="https://aichitect.dev/explore">Explore</a> ·
    <a href="https://aichitect.dev/stacks">Stacks</a> ·
    <a href="https://aichitect.dev/builder">Builder</a> ·
    <a href="https://aichitect.dev/simulate">Simulate</a> ·
    <a href="https://aichitect.dev/compare">Compare</a> ·
    <a href="https://aichitect.dev/genome">Genome</a> ·
    <a href="https://aichitect.dev/pulse">Pulse</a> ·
    <a href="https://aichitect.dev/feed">Activity</a>
  </p>

  <img src="https://img.shields.io/badge/tools-246-7c6bff?style=flat-square" alt="246 tools" />
  <img src="https://img.shields.io/badge/stacks-35-26de81?style=flat-square" alt="35 stacks" />
  <img src="https://img.shields.io/badge/categories-21-00d4aa?style=flat-square" alt="21 categories" />
  <img src="https://img.shields.io/badge/license-MIT-ff9f43?style=flat-square" alt="MIT license" />
  <img src="https://img.shields.io/badge/open%20source-%E2%9D%A4-ff6b6b?style=flat-square" alt="Open Source" />
</div>

---

AI tools are all over the place. Every week there's a new framework, a new model, a new "essential" addition to your stack. AIchitect gives you a structured, visual map of the ecosystem — **246 tools** across **21 categories**, with **35 curated stacks** and a live signal feed — so you can pick the right stack based on data, not hype.

## Features

### Explore — the full ecosystem as an interactive graph

Browse all 246 tools as a force-directed graph. Filter by category or relationship type, search by name, and switch between three view modes:

- **2D Grid** — clean, scannable card layout
- **2D Layers** — swimlane view organized by stack layer (Development → AI Logic → Models & Infra → Tooling)
- **3D** — rotatable Three.js force graph with orbit controls

### Stacks — 35 mission-driven starting points

Stacks lead with the specific situation they solve, list what was explicitly rejected and why, and tell you exactly when to move on. Organized across 5 decision clusters:

| Cluster               | Tagline                     | Stacks |
| --------------------- | --------------------------- | -----: |
| **Build**             | Ship this week              |      9 |
| **Automate**          | AI does the work            |      8 |
| **Ship & Harden**     | Make it trustworthy         |      6 |
| **Understand**        | Data is the product         |      5 |
| **Comply & Restrict** | Nothing leaves the building |      5 |

Each stack includes the situation, why each tool was picked, what was rejected (and why), kill conditions, and the next stack to graduate to.

### Builder — design your own stack

Pick one tool per slot and watch your stack wire together with live integration edges. Share your exact stack via a single URL (`?s=cursor,langgraph,openai-api,…`).

### Simulate — project cost, latency, and breaking points

Drag a few sliders and watch the chart move: per-token cost with prompt-caching and batch-API discounts, token-aware latency, a shadow-stack A/B comparison, and a provider ranking at your specific workload. Built on a public per-tool cost-model catalog.

### Compare — side-by-side tool analysis

Compare any two tools head-to-head: category, pricing, OSS vs. SaaS, GitHub stars, integrations, and a plain-language summary of the tradeoffs. Shareable via URL (`/compare/cursor/claude-code`).

### Genome — analyse your existing stack

Paste your dependency files (`package.json`, `requirements.txt`, `.env`, etc.) and Genome detects which AI tools you're already using, scores your stack's fitness, surfaces gaps, and offers an adversarial challenge or AI roast of every tool choice.

### Pulse — 30-day ecosystem momentum

A category-level heatmap of which parts of the AI tools landscape are heating up vs. cooling down — built from the nightly health-sync, benchmark, and incident pipelines.

### Activity — what changed today

Live, filterable feed of tool events: health-score shifts, star milestones, stale transitions, archive detections, pricing changes, benchmark drift, and incidents — fed by the cron jobs that watch every tracked vendor.

### Find My Stack — short quiz → recommended stack

Four questions (role, use case, budget, priorities) → a curated stack recommendation that maps into Builder and Compare.

### Make a Case — defend your stack

Generates a structured argument for a given stack you can share with a teammate or stakeholder, including rejected alternatives and exit conditions.

> An experimental MCP server endpoint (`/api/mcp`) is also exposed at `https://aichitect.dev/api/mcp` — see the [setup guide](https://aichitect.dev/mcp). Not actively developed.

## Tech Stack

| Layer       | Technology                                                                   |
| ----------- | ---------------------------------------------------------------------------- |
| Framework   | Next.js 16 (App Router, Turbopack)                                           |
| Language    | TypeScript · React 19                                                        |
| 2D graph    | React Flow v11 + dagre + ELK                                                 |
| 3D graph    | react-force-graph-3d + Three.js                                              |
| Styling     | Tailwind CSS v4                                                              |
| Data layer  | Supabase Postgres (auth + tool events) · static JSON                         |
| AI features | Google AI (`@google/generative-ai`) for Roast and Genome Challenge           |
| Activity    | Vercel Cron → health sync (nightly), benchmarks (weekly), incidents (hourly) |
| Dev runtime | Docker + Docker Compose                                                      |

## Getting Started

All dev runs through Docker — no local Node.js required.

```bash
# Clone
git clone https://github.com/letsgogeeky/aichitect.git
cd aichitect

# Start dev server (applies local migrations, seeds DB, tails logs)
make run

# Stop
make down
```

> Requires [Docker](https://docs.docker.com/get-docker/) and Docker Compose. The dev server is exposed on `http://localhost:3002` (mapped from container `3000`).

### Common commands

```bash
make run              # Start dev server (foreground, hot reload)
make down             # Stop and remove containers
make rebuild          # Full rebuild after adding new packages
make logs             # Tail container logs
make shell            # Open shell inside the running container
make typecheck        # Run tsc --noEmit
make lint             # Run ESLint
make test             # Run Vitest suite
make check            # lint + typecheck + test in one shot
make sync-counts      # Sync tool/category/stack counts in README + CLAUDE.md
make seed-validate    # Validate JSON data integrity without a DB
make db-push-local    # Apply pending migrations to local Postgres
make db-push          # Promote verified migrations to remote Supabase
make db-migrate name=X  # Scaffold a new migration file
```

## Project structure

```
app/
  page.tsx           landing page (hero, view cards, live signals, footer)
  explore/           graph view (2D grid / swimlanes / 3D)
  stacks/            33 mission-driven stacks across 5 clusters
  builder/           pick-per-slot stack builder
  simulate/          cost / latency / breaking-points simulator
  compare/[a]/[b]/   side-by-side tool comparison
  genome/            paste-your-deps stack-fitness scorer
  pulse/             30-day category momentum heatmap
  feed/              live tool-event activity feed
  case/              "make a case for your stack" generator
  match/             4-question stack quiz
  mcp/               MCP setup guide
  tool/[toolId]/     per-tool detail pages
  category/[id]/     per-category landing pages
  profile/[user]/    public user profiles (GitHub auth)
  api/               cron, MCP, roast/challenge endpoints
  badge/             shields.io-style SVG badge endpoint
data/
  tools.json         246 tools
  relationships.json 538 edges (integrates-with / commonly-paired-with / competes-with)
  stacks.json        35 curated stacks with flow edges
  slots.json         22 builder slot types
lib/
  types.ts           single source of truth for all interfaces + category colors
  simulate.ts        cost / latency simulation core
  genomeAnalysis.ts  dependency-file → stack genome detection
  health.ts          GitHub-signal → health score
  pulse.ts           category-momentum aggregation
  data-loaders.ts    typed JSON loaders
components/
  graph/             ExploreGraph (2D/3D), ToolNode, LaneLabel, EnrichedEdge
  panels/            FilterPanel, DetailPanel, ComparisonPanel, StackHealthPanel
  ui/                Navbar, Logo, MyStackTray, modals, walkthrough
hooks/
  useBuilderState · useComparisonMode · useUser · useIsMobile
scripts/
  sync-counts.mjs    patches hardcoded counts in README + CLAUDE.md
  seed-db.ts         seed remote Supabase (idempotent upsert)
  seed-db-local.ts   seed local Docker Postgres
supabase/migrations/ DB schema history
```

See [`CLAUDE.md`](CLAUDE.md) for the architectural deep-dive (edge-runtime rules, data integrity constraints, type-system contracts).

## Contributing

Contributions are welcome — tools, stacks, bug fixes, and new features.

### Adding a tool

1. Add an entry to `data/tools.json`:

```json
{
  "id": "my-tool",
  "name": "My Tool",
  "category": "agent-frameworks",
  "tagline": "One sentence description",
  "description": "Longer description shown in the detail panel.",
  "type": "oss",
  "pricing": { "free_tier": true, "plans": [] },
  "github_stars": 12000,
  "slot": "orchestration",
  "prominent": false,
  "website_url": "https://mytool.dev",
  "github_url": "https://github.com/org/repo"
}
```

2. Optionally add edges in `data/relationships.json`:

```json
{ "source": "my-tool", "target": "langchain", "type": "integrates-with" }
```

3. Run `make seed-validate` to catch broken references; `make sync-counts` to refresh the badges.

### Adding a stack

Add an entry to `data/stacks.json`. The full schema is in `lib/types.ts` (`Stack`). `cluster` must be one of: `build` · `automate` · `ship` · `comply` · `understand`. All tool IDs in `tools`, `not_in_stack`, `flow.from`, and `flow.to` must exist in `data/tools.json`.

### Opening an issue

Found a missing tool, broken edge, or UI bug? [Open an issue](https://github.com/letsgogeeky/aichitect/issues) — all feedback is welcome.

### Pull requests

1. Fork the repo
2. Create a branch: `git checkout -b feat/my-change`
3. Make your changes and verify with `make check` (lint + typecheck + tests)
4. Open a PR with a clear description of what changed and why

## License

[MIT](LICENSE) — free to use, modify, and distribute.

---

<div align="center">
  <sub>Built in the open for the AI engineering community · <a href="https://aichitect.dev">aichitect.dev</a></sub>
</div>
