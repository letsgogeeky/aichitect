@AGENTS.md

# AIchitect — Project Context

**Brand:** "Cut the noise. Pick your AI stack."
**Domain:** aichitect.dev | **Stack:** Next.js 16 + React Flow + Three.js + Tailwind v4 + TypeScript

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
  stacks/               → 10 curated stacks (sidebar + dagre graph)
  builder/              → slot-by-slot stack builder (slots panel + integration graph)
  robots.ts             → /robots.txt
  sitemap.ts            → /sitemap.xml
components/
  graph/
    ExploreGraph.tsx    → main graph view; viewMode: "grid" | "layers" | "3d"
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
  tools.json            → 123 tools, 12 categories
  relationships.json    → ~283 edges (integrates-with / often-used-together / competes-with)
  stacks.json           → 10 curated stacks with flow edges
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

## Data shape (tools.json)

```ts
{ id, name, category, tagline, description, type: "oss"|"saas",
  pricing: { free_tier, plans[] }, github_stars, slot, prominent, urls }
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
