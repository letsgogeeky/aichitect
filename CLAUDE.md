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

**Commits (Ramy signs — never commit for him):**

1. Stage specific files: `git add <files>`
2. Print the commit message for Ramy to copy
3. Ramy runs `git commit` — his signing config applies automatically
4. After Ramy confirms the commit, open the PR with `gh pr create`

**PR format (concise):**

- Title: `feat(scope): AIC-N — short description` (≤60 chars)
- Body: 3–5 bullet summary of what changed and why, plus a short test plan checklist
- No walls of text, no restating every file changed

## Architecture

```
app/
  page.tsx              → landing page (hero, view cards, OSS banner, footer)
  layout.tsx            → root metadata (OG, JSON-LD, robots, favicon)
  opengraph-image.tsx   → root OG image (1200×630, edge runtime)
  explore/              → full tool graph (FilterPanel + ExploreGraph + DetailPanel)
  stacks/
    StacksClient.tsx    → layout shell: wires state + delegates to sub-components
    stacksConstants.ts  → COMPLEXITY_META (label + hex color per complexity level)
    components/
      StackSidebar.tsx      → cluster tabs + stack list aside
      StackDetailHeader.tsx → detail header; owns killOpen state internally
      MobileStackPicker.tsx → full-screen mobile stack overlay
  builder/
    BuilderClient.tsx   → wires useBuilderState + renders BuilderSlotList / BuilderGraph / MobileSlotPicker
    components/
      BuilderSlotList.tsx   → desktop aside: slot accordion + compare buttons + StackHealthPanel
      MobileSlotPicker.tsx  → BottomSheet wrapper for mobile slot picking
  genome/
    GenomeClient.tsx    → state machine (step, detectedIds, workflowIds, URL sync) + context provider + Suspense
    GenomeContext.tsx   → GenomeData interface, GenomeDataCtx, useGenomeData hook
    genomeConstants.ts  → INPUT_TABS, WORKFLOW_GROUPS, PRIORITY_COLOR
    components/
      ScanStep.tsx      → dependency file input tabs + detect step
      WorkflowStep.tsx  → workflow group selection step
      ResultsView.tsx   → composes FitnessGauge + Stat + SlotGrid + MissingPanel
      FitnessGauge.tsx  → SVG arc gauge for genome tier
      Stat.tsx          → single stat display (label + value)
      SlotGrid.tsx      → grid of recommended tools per slot
      MissingPanel.tsx  → list of unfilled slots grouped by priority
      ProgressDots.tsx  → step progress indicator dots
  robots.ts             → /robots.txt
  sitemap.ts            → /sitemap.xml
hooks/
  useComparisonMode.ts  → selectedTool, compareMode, comparisonTools, URL sync for ExploreGraph
  useBuilderState.ts    → all URL-backed state for the Builder (selected tools, compare A/B, collapsed slots)
components/
  graph/
    ExploreGraph.tsx    → main graph view; viewMode: "grid" | "layers" | "3d"; uses useComparisonMode
    ExploreGraph3D.tsx  → Three.js 3D force graph (react-force-graph-3d, SSR-disabled)
    LaneLabel.tsx       → custom ReactFlow node type for swimlane lane backgrounds
    ToolNode.tsx        → custom node (collapsed 190px ↔ expanded 280px, CSS transition)
  panels/
    FilterPanel.tsx     → category + edge type toggles, search
    DetailPanel.tsx     → right slide-in tool profile
  ui/
    Navbar.tsx          → 56px, Logo component, icon tabs, route-aware right slot, GitHub button
    Logo.tsx            → inline SVG 3-node graph logo on gradient rect; id + size props
data/
  tools.json            → 207 tools, 17 categories
  relationships.json    → ~455 edges (integrates-with / often-used-together / competes-with)
  stacks.json           → 25 curated stacks with flow edges
  slots.json            → 20 slot types for the Builder
lib/
  types.ts              → all TS interfaces + getCategoryColor() + STACK_LAYERS
  graph.ts              → applyDagreLayout() + gridLayout() + swimlaneLayout()
  constants.ts          → SITE_URL, GITHUB_URL, TOOL_COUNT, CATEGORY_COUNT, STACK_COUNT, RELATIONSHIP_COUNT
  stackStory.ts         → generateStackStory() → { flow, prose }
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

`data/tools.json`, `data/relationships.json`, `data/stacks.json`, and `data/slots.json` are the source of truth until Phase 1 (Supabase migration). Every edit to these files must satisfy:

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

Two routes run in Next.js edge runtime (no Node.js APIs, no `fs`, no `crypto`, no server-only imports):

- `app/badge/route.ts` — SVG badge endpoint
- `app/builder/opengraph-image.tsx` — OG image generator
- `app/opengraph-image.tsx` — root OG image

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
  website_url, github_url, choose_if, aliases, provider,
  health_score, last_synced_at, is_stale }
```

## Category colors

| Category           | Color   |
| ------------------ | ------- |
| coding-assistants  | #7c6bff |
| autonomous-agents  | #ff6b6b |
| agent-frameworks   | #26de81 |
| llm-providers      | #00d4aa |
| observability      | #fd9644 |
| vector-databases   | #4ecdc4 |
| deployment         | #ff9f43 |
| mcp                | #a29bfe |
| design             | #74b9ff |
| data-auth          | #fd79a8 |
| prompt-eval        | #55efc4 |
| specifications     | #e17055 |
| fine-tuning        | #e84393 |
| voice-ai           | #00b894 |
| multimodal         | #6c5ce7 |
| browser-automation | #f0932b |

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
