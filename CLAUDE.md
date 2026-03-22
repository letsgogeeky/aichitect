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
- Use `make run` to start (foreground), `make down` to stop, `make rebuild` after adding packages.
- Hot reload via volume mounts. Rebuild image only when adding new packages to `package.json`.

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
  tools.json            → 175 tools, 13 categories
  relationships.json    → ~369 edges (integrates-with / often-used-together / competes-with)
  stacks.json           → 25 curated stacks with flow edges
  slots.json            → 15 slot types for the Builder
lib/
  types.ts              → all TS interfaces + getCategoryColor() + STACK_LAYERS
  graph.ts              → applyDagreLayout() + gridLayout() + swimlaneLayout()
  constants.ts          → SITE_URL, GITHUB_URL, TOOL_COUNT, CATEGORY_COUNT, STACK_COUNT, RELATIONSHIP_COUNT
  stackStory.ts         → generateStackStory() → { flow, prose }
public/
  favicon.svg           → same 3-node graph design as Logo
  llms.txt              → LLM crawler optimization
```

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

| Category          | Color   |
| ----------------- | ------- |
| coding-assistants | #7c6bff |
| autonomous-agents | #ff6b6b |
| agent-frameworks  | #26de81 |
| llm-providers     | #00d4aa |
| observability     | #fd9644 |
| vector-databases  | #4ecdc4 |
| deployment        | #ff9f43 |
| mcp               | #a29bfe |
| design            | #74b9ff |
| data-auth         | #fd79a8 |
| prompt-eval       | #55efc4 |
| specifications    | #e17055 |

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
