@AGENTS.md

# AIchitect — Project Context

**Brand:** "Cut the noise. Pick your AI stack."
**Domain:** aichitect.dev | **Stack:** Next.js 16 + React Flow + Three.js + Tailwind v4 + TypeScript

## Engineering philosophy

This is a greenfield project. Always build clean:

- **No adapter layers** — if the DB schema or TypeScript type is designed a certain way, the rest of the code conforms to it. Never write a mapping/transform function to bridge an old shape to a new one just to avoid touching other files.
- **No backwards-compat shims** — if a type changes, update all call sites. If a field is renamed, rename it everywhere. The cost of a clean sweep is low at this stage.
- **No workarounds** — if something is wrong, fix the root cause. Don't patch around it with defensive code, re-exports, or fallback casts that exist only to preserve a broken old shape.

The exception: once we have production data that can't be migrated cheaply, or a public API contract we can't break, we'll revisit. Until then, always reach for the clean solution.

## Dev workflow

- **Docker only** — never run `npm` or `node` locally. All dev runs through docker-compose.
- Hot reload via volume mounts. Rebuild image only when adding new packages to `package.json`.

### Make targets

| Command                  | When to use                                                                               |
| ------------------------ | ----------------------------------------------------------------------------------------- |
| `make run`               | Start dev server (applies local migrations + seeds, then tails logs)                      |
| `make down`              | Stop and remove containers                                                                |
| `make rebuild`           | After adding packages to `package.json` — full reinstall + rebuild                        |
| `make restart`           | Restart containers without rebuilding                                                     |
| `make shell`             | Open a shell inside the running container                                                 |
| `make logs`              | Tail logs without restarting                                                              |
| `make typecheck`         | Run `tsc --noEmit` inside the container                                                   |
| `make lint`              | Run ESLint                                                                                |
| `make format`            | Run Prettier                                                                              |
| `make test`              | Run Vitest test suite                                                                     |
| `make check`             | Run lint + typecheck + test in one shot                                                   |
| `make sync-counts`       | After modifying data files — syncs tool/stack/relationship counts in README and CLAUDE.md |
| `make seed-validate`     | Validate JSON data integrity without a DB connection                                      |
| `make db-push-local`     | Apply pending migrations to local Postgres                                                |
| `make db-push`           | Promote verified migrations to remote Supabase                                            |
| `make db-migrate name=X` | Scaffold a new migration file                                                             |
| `make db-reset-local`    | Wipe and re-apply all migrations locally (destructive)                                    |

## Git & PR workflow

**Branching:**

- Always branch from the current active branch: `git checkout -b feat/AIC-N`
- Ramy ensures the active branch is the correct base before starting — no merging or rebasing needed.

**Commits (Ramy signs — never run `git commit`):**

1. Stage specific files: `git add <files>`
2. Print the commit message for Ramy to copy and run himself
3. Ramy runs `git commit` — his signing config applies automatically
4. After Ramy confirms the commit, open the PR with `gh pr create`

**Pre-PR gate — always run `make check` before opening a PR.** It runs lint + typecheck + tests in one shot. Do not open a PR if `make check` fails.

**PR format (concise):**

- Title: `feat(scope): AIC-N — short description` (≤60 chars)
- Body: 3–5 bullet summary of what changed and why, plus a short test plan checklist
- No walls of text, no restating every file changed

## Architecture

```
app/
  page.tsx                          → landing page (hero, view cards, OSS banner, footer)
  layout.tsx                        → root metadata (OG, JSON-LD, robots, favicon)
  opengraph-image.tsx               → root OG image (1200×630, edge runtime)
  error.tsx                         → root error boundary
  robots.ts                         → /robots.txt
  sitemap.ts                        → /sitemap.xml
  explore/                          → full tool graph (FilterPanel + ExploreGraph + DetailPanel)
    og/route.tsx                    → OG image for /explore
  stacks/
    StacksClient.tsx                → layout shell: wires state + delegates to sub-components
    components/
      StackSidebar.tsx              → cluster tabs + stack list aside
      StackDetailHeader.tsx         → detail header; owns killOpen state internally
      MobileStackPicker.tsx         → full-screen mobile stack overlay
    og/route.tsx                    → OG image for /stacks
    opengraph-image.tsx             → stacks OG image generator
  builder/
    BuilderClient.tsx               → wires useBuilderState + renders BuilderSlotList / BuilderGraph / MobileSlotPicker
    components/
      BuilderSlotList.tsx           → desktop aside: slot accordion + compare buttons + StackHealthPanel
      MobileSlotPicker.tsx          → BottomSheet wrapper for mobile slot picking
    og/route.tsx                    → OG image for /builder
    opengraph-image.tsx             → builder OG image (edge runtime, reads ?s= param)
  compare/
    CompareClient.tsx               → wires tool pair + relationships, renders ComparisonPanel
    [toolA]/[toolB]/page.tsx        → side-by-side comparison view
    og/                             → (route exists but no OG image defined yet)
  genome/
    GenomeClient.tsx                → state machine (step, detectedIds, workflowIds, URL sync) + context provider + Suspense
    GenomeContext.tsx               → GenomeData interface, GenomeDataCtx, useGenomeData hook
    error.tsx                       → genome-specific error boundary
    components/
      ScanStep.tsx                  → dependency file input tabs + detect step
      WorkflowStep.tsx              → workflow group selection step
      ResultsView.tsx               → composes FitnessGauge + Stat + SlotGrid + MissingPanel
      FitnessGauge.tsx              → SVG arc gauge for genome tier
      Stat.tsx                      → single stat display (label + value)
      SlotGrid.tsx                  → grid of recommended tools per slot
      MissingPanel.tsx              → list of unfilled slots grouped by priority
      ProgressDots.tsx              → step progress indicator dots
      ChallengePanel.tsx            → genome challenge/quiz panel
      GraduationBanner.tsx          → banner shown when genome score is high
      RoastPanel.tsx                → AI-powered stack roast panel
    og/route.tsx                    → OG image for /genome
  match/                            → stack quiz / match flow
  profile/[username]/               → public user profile page
  changelog/                        → product changelog
  api/
    roast/route.ts                  → GET — AI stack roast (Google AI)
    challenge/route.ts              → POST — genome challenge submission
    cron/sync-health/route.ts       → GET — nightly GitHub health sync (cron, requires CRON_SECRET)
  badge/
    route.ts                        → GET /badge?s=cursor,langgraph → shields.io-style SVG (edge runtime)
    tool/[toolId]/route.ts          → GET /badge/tool/:id → per-tool badge (edge runtime)
  auth/
    callback/route.ts               → GitHub OAuth callback handler (Supabase Auth)
hooks/
  useComparisonMode.ts  → selectedTool, compareMode, comparisonTools, URL sync for ExploreGraph
  useBuilderState.ts    → all URL-backed state for the Builder (selected tools, compare A/B, collapsed slots)
  useIsMobile.ts        → responsive breakpoint detection
  useUser.ts            → Supabase Auth session + profile state
components/
  graph/
    ExploreGraph.tsx    → main graph view; viewMode: "grid" | "layers" | "3d"; uses useComparisonMode
    ExploreGraph3D.tsx  → Three.js 3D force graph (react-force-graph-3d, SSR-disabled)
    EnrichedEdge.tsx    → custom React Flow edge with how/achieves tooltip
    LaneLabel.tsx       → custom ReactFlow node type for swimlane lane backgrounds
    ToolNode.tsx        → custom node (collapsed 190px ↔ expanded 280px, CSS transition)
  panels/
    FilterPanel.tsx     → category + edge type toggles, search
    DetailPanel.tsx     → right slide-in tool profile
    ComparisonPanel.tsx → side-by-side tool comparison (used in /compare)
    StackHealthPanel.tsx → slot coverage + health summary for the Builder
  comparison/           → atomic cells used inside ComparisonPanel
    CategoryPill.tsx · ChooseIfCard.tsx · DescriptionCard.tsx · FreeTierCell.tsx
    LinksCard.tsx · PlanPills.tsx · Row.tsx · ToolPill.tsx · TypeBadge.tsx
  mobile/
    BottomSheet.tsx           → generic bottom sheet wrapper
    ToolDetailSheet.tsx       → tool detail view optimized for mobile
  ui/
    Navbar.tsx                → 56px, Logo component, icon tabs, route-aware right slot
    Logo.tsx                  → inline SVG 3-node graph logo on gradient rect
    GetStartedModal.tsx       → onboarding modal
    LandingAuthButton.tsx     → GitHub OAuth sign-in button (landing page)
    MyStackTray.tsx           → saved stacks tray (authenticated users)
    StackQuizModal.tsx        → quiz-to-stack modal
    SuggestToolModal.tsx      → tool suggestion form modal
    ToolUsageButton.tsx       → "I use this" production usage button
    WalkthroughOverlay.tsx    → product walkthrough overlay
data/
  tools.json            → 207 tools, 16 categories
  relationships.json    → ~452 edges (integrates-with / commonly-paired-with / competes-with)
  stacks.json           → 25 curated stacks with flow edges
  slots.json            → 20 slot types for the Builder
lib/
  types.ts              → all TS interfaces + getCategoryColor() + STACK_LAYERS + CATEGORIES
  constants.ts          → SITE_URL, GITHUB_URL, TOOL_COUNT, CATEGORY_COUNT, STACK_COUNT, RELATIONSHIP_COUNT
  graph.ts              → applyDagreLayout() + gridLayout() + swimlaneLayout()
  stackStory.ts         → generateStackStory() → { flow, prose }
  genomeAnalysis.ts     → stack genome detection + scoring logic
  graduationDetection.ts → detects when a genome score qualifies for graduation
  health.ts             → health score computation from GitHub signals
  github.ts             → GitHub API client (stars, last commit, archive status)
  quizScoring.ts        → quiz → stack scoring
  db.ts                 → Supabase client (server + browser)
  data-loaders.ts       → typed loaders for JSON data files
  metadata.ts           → per-route metadata helpers
  format.ts             → shared formatting utilities
  parseStack.ts         → URL ?s= param ↔ tool id array
  data/
    tools.ts · stacks.ts · relationships.ts · slots.ts · counts.ts
scripts/
  sync-counts.mjs       → patches TOOL_COUNT / STACK_COUNT / RELATIONSHIP_COUNT in README.md + CLAUDE.md
  seed-db.ts            → seed remote Supabase
  seed-db-local.ts      → seed local Docker Postgres
  seed-data.ts          → shared seed data logic
public/
  favicon.svg           → same 3-node graph design as Logo
  llms.txt              → LLM crawler optimization
```

## Type system rules

All TypeScript types and interfaces live in `lib/types.ts`. It is the single source of truth.

- **Never use raw string literals for category IDs** — import and use the `CategoryId` union type.
- **Never hardcode category hex colors** — always call `getCategoryColor(id: CategoryId)` from `lib/types.ts`. Adding a new category means adding it to the `CATEGORIES` array there; the color propagates everywhere automatically.
- **When a type changes, update all call sites** — no casting, no intermediate adapters. The project is pre-1.0 so a clean sweep is always the right call.
- **`STACK_LAYERS` and `STACK_CLUSTERS`** are defined in `lib/types.ts`; do not duplicate them inline in components.

## Data integrity

`data/tools.json`, `data/relationships.json`, `data/stacks.json`, and `data/slots.json` are the source of truth. Every edit to these files must satisfy:

### tools.json constraints

- `id` — kebab-case, globally unique
- `category` — must be a valid `CategoryId` from `lib/types.ts`
- `slot` — must match an `id` in `data/slots.json`; if no slot fits, add one to slots.json first
- `type` — must be `"oss"` or `"commercial"` (never `null`)
- `github_stars` — `null` for commercial tools with no public repo; a number otherwise
- `health_score`, `last_synced_at`, `is_stale` — leave as `null` until the health pipeline populates them

### relationships.json constraints

- Both `source` and `target` must reference valid tool `id`s that exist in tools.json
- No orphaned references — adding or removing a tool requires auditing relationships

### After modifying data files

1. `make sync-counts` — patches counts in README.md and CLAUDE.md automatically
2. `make seed-validate` — validates JSON integrity without a DB connection; fix any errors before proceeding
3. `lib/constants.ts` derives `TOOL_COUNT`, `STACK_COUNT`, `RELATIONSHIP_COUNT` from the JSON at build time — never hardcode these in UI components, always import from `lib/constants.ts`

## Edge runtime & SSR rules

These routes run in Next.js edge runtime (no Node.js APIs, no `fs`, no `crypto`, no server-only imports):

- `app/badge/route.ts` — SVG badge endpoint
- `app/badge/tool/[toolId]/route.ts` — per-tool badge
- `app/opengraph-image.tsx` — root OG image
- `app/builder/opengraph-image.tsx` — builder OG image
- `app/stacks/opengraph-image.tsx` — stacks OG image
- `app/explore/og/route.tsx`, `app/stacks/og/route.tsx`, `app/builder/og/route.tsx`, `app/genome/og/route.tsx` — route-level OG handlers

If you touch these files: no `require()`, no Node built-ins, no Supabase server client (edge-compatible client only).

**Heavy browser libs that break SSR** must be lazily imported:

```ts
// Good — Three.js and react-force-graph-3d
const ExploreGraph3D = dynamic(() => import("./ExploreGraph3D"), { ssr: false });
```

Never import `react-force-graph-3d` at the top of a file that is server-rendered.

## Testing

Tests live in `__tests__/lib/` using **Vitest**. Run with `make test`.

When to add tests:

- New pure functions in `lib/` — always add a test
- New data-shape constants or lookup utilities — add coverage
- Bug fixes that had a specific repro case — add a regression test

When not to add tests:

- React components (no component tests currently; don't add a testing library for them without discussion)
- One-off scripts in `scripts/`

## Database & Supabase migrations

Migrations live in `supabase/migrations/`. Always scaffold new migrations with `make db-migrate name=<snake_case_name>`.

Workflow for any schema change:

1. `make db-migrate name=add_foo_column` — creates a timestamped migration file
2. Edit the generated SQL
3. `make db-push-local` — apply to local Postgres, verify `make run` still works
4. `make db-push` — promote to remote Supabase when satisfied
5. If you add a new column visible to the app, update the `Tool` / `Stack` interface in `lib/types.ts` and re-run `make typecheck`

Never edit migration files that have already been pushed to the remote — scaffold a new one instead.

### Component responsibility rules

Page-level client components (`GenomeClient`, `StacksClient`, `BuilderClient`) are thin shells — they wire state and layout but contain no business logic.

| Where                     | What                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------- |
| `hooks/`                  | URL-backed state, multi-piece state machines (`useBuilderState`, `useComparisonMode`) |
| `lib/`                    | Pure functions with no React dependency                                               |
| `app/<route>/components/` | Sub-components owned by a single route                                                |
| `components/`             | Shared components used across multiple routes                                         |

Keep individual files under ~300 lines. When a file grows beyond that, extract a component or hook.

## Data shape (tools.json)

```ts
{ id, name, category, tagline, description, type: "oss"|"commercial",
  pricing: { free_tier, plans[] }, github_stars, slot, prominent,
  website_url, github_url, choose_if, provider,
  use_context: "dev-productivity"|"app-infrastructure"|"both",
  aliases: { npm[], pip[], env_vars[], config_files[] },  // Stack Genome detection signals
  added_at,       // ISO date — drives "New" badge; set when adding a tool
  health_score, last_synced_at, is_stale }  // populated by nightly sync pipeline; leave null when adding
```

## Category colors

Source of truth is `CATEGORIES` in `lib/types.ts`. Never hardcode these — always call `getCategoryColor(id)`.

| Category           | Label              | Color   |
| ------------------ | ------------------ | ------- |
| coding-assistants  | Coding Assistants  | #7c6bff |
| autonomous-agents  | Autonomous Agents  | #ff6b6b |
| agent-frameworks   | Agent Frameworks   | #fdcb6e |
| pipelines-rag      | Pipelines & RAG    | #26de81 |
| llm-infra          | LLM Infrastructure | #4ecdc4 |
| design             | Design & UI        | #ff9f43 |
| devops             | DevOps & CI/CD     | #fd9644 |
| docs               | Documentation      | #74b9ff |
| product-mgmt       | Product & PM       | #fd79a8 |
| mcp                | MCP Servers        | #a29bfe |
| prompt-eval        | Prompt & Eval      | #55efc4 |
| specifications     | Specifications     | #e17055 |
| fine-tuning        | Fine-tuning        | #e84393 |
| voice-ai           | Voice AI           | #00b894 |
| multimodal         | Multimodal         | #6c5ce7 |
| browser-automation | Browser Automation | #f0932b |

## Sharing system

Builder selections are URL-encoded as `?s=tool-id-1,tool-id-2,...`

- `app/builder/page.tsx` — uses `useSearchParams` + `useRouter` to read/write the `s` param; wrapped in `<Suspense>`
- `components/ui/Navbar.tsx` — "Share Stack" button copies `window.location.href` to clipboard, shows "Copied!" for 2s
- `app/builder/opengraph-image.tsx` — edge-runtime OG image generator; reads `?s=` param, renders tool pills on dark background
- `app/badge/route.ts` — edge-runtime SVG badge endpoint: `GET /badge?s=cursor,langgraph` → shields.io-style SVG

## Card design (ToolNode)

- Colored 2px top accent strip (full opacity when expanded, dimmed otherwise)
- **OSS tag**: `◆ Open Source` — green (#26de81), filled bg, shown whenever `type === "oss"`
- **Free Tier tag**: `✦ Free Tier` — teal (#00d4aa), filled bg, shown whenever `pricing.free_tier === true`
- Stars moved to top-right (next to category label)
- Plan price pill + "Visit ↗" link remain in bottom row (collapsed/expanded respectively)

## 3D Graph (ExploreGraph3D)

- Dynamically imported with `ssr: false` from ExploreGraph.tsx
- Wheel event interception at container level (capture phase) amplifies deltaY × 6 for responsive zoom
- d3 forces: `charge` with `strength(-60).distanceMax(150)`, `center` with `strength(0.8)`
- OrbitControls: `zoomSpeed = 3`, `enableDamping = true`, `dampingFactor = 0.08`
- Nodes: THREE.Sphere + SpriteText label above; selected node gets a ring
- Camera set to `z: 250` on first engine stop

## Authentication

Auth is handled by **Supabase Auth with GitHub OAuth**. No username/password login.

- `app/auth/callback/route.ts` — OAuth callback; exchanges the code for a session and redirects
- `hooks/useUser.ts` — session + profile state available client-side
- `lib/db.ts` — exports both the browser client (`createBrowserClient`) and server client (`createServerClient`)
- GitHub OAuth credentials are configured in the Supabase dashboard, not as env vars
- `Profile` type in `lib/types.ts` — mirrors `public.profiles` table (id, github_id, github_username, avatar_url)

## Environment variables

See `.env.example` at the project root. Never commit real secrets.

| Variable                                 | Required         | Purpose                                              |
| ---------------------------------------- | ---------------- | ---------------------------------------------------- |
| `NEXT_PUBLIC_POSTGRES_SUPABASE_URL`      | Yes              | Supabase project URL                                 |
| `NEXT_PUBLIC_POSTGRES_SUPABASE_ANON_KEY` | Yes              | Supabase anon key (public)                           |
| `POSTGRES_SUPABASE_SERVICE_ROLE_KEY`     | Yes (server)     | Supabase service role key — never expose to client   |
| `DATABASE_URL`                           | Yes (local)      | Local Docker Postgres connection string              |
| `POSTGRES_URL_NON_POOLING`               | Yes (migrations) | Direct connection for Supabase CLI / migrations      |
| `GITHUB_TOKEN`                           | Yes              | GitHub API token for nightly health sync             |
| `CRON_SECRET`                            | Yes              | Bearer token Vercel sends to `/api/cron/sync-health` |
| `GOOGLE_AI_API_KEY`                      | Yes              | Google AI key for `/api/roast` and `/api/challenge`  |
| `NEXT_PUBLIC_SITE_URL`                   | Optional         | Overrides `aichitect.dev` for metadata/OG URLs       |

The app falls back to static JSON data gracefully when Supabase env vars are absent (local dev without DB).

## Linear workflow

Linear is the source of truth for task tracking and prioritization.

- **Before answering "what's next" or starting any planned work** — check Linear first (`list_projects` + `list_issues`). Do not rely on memory files or this document for task status.
- **When documenting new tasks or plans** — create or update Linear issues first, before writing to any local file.

## Design file

The Pencil design file is `AIStack.pen`, located one directory above the project root (`../AIStack.pen`).

- Use the `pencil` MCP tools to read and edit it — never use `Read`, `Grep`, or `cat` on `.pen` files (contents are encrypted and only accessible via the MCP tools).
