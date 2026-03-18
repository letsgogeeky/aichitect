@AGENTS.md

# AIchitect — Project Context

**Brand:** "AI tools are all over the place, picking the right stack should be less noisy."
**Domain:** aichitect.dev | **Stack:** Next.js 16 + React Flow + Tailwind v4 + TypeScript

## Dev workflow
- **Docker only** — never run `npm` or `node` locally. All dev runs through docker-compose.
- Hot reload via volume mounts. Rebuild image only when adding new packages to `package.json`.
- Ask before any git operations — Ramy has a signing process.

## Architecture
```
app/
  page.tsx          → redirects to /explore
  layout.tsx        → root metadata (OG, JSON-LD, robots)
  explore/          → full tool graph (FilterPanel + ExploreGraph + DetailPanel)
  stacks/           → 8 curated stacks (sidebar + dagre graph)
  builder/          → slot-by-slot stack builder (slots panel + integration graph)
  robots.ts         → /robots.txt
  sitemap.ts        → /sitemap.xml
components/
  graph/
    ExploreGraph.tsx  → main graph view, intent banner
    ToolNode.tsx      → custom node (collapsed 190px ↔ expanded 280px, CSS transition)
  panels/
    FilterPanel.tsx   → category + edge type toggles, search
    DetailPanel.tsx   → right slide-in tool profile
  ui/
    Navbar.tsx        → 56px, gradient logo, icon tabs, route-aware right slot
data/
  tools.json         → 84 tools, 10 categories
  relationships.json → ~150 edges (integrates-with / commonly-paired / competes-with)
  stacks.json        → 8 curated stacks with flow edges
  slots.json         → 15 slot types for the Builder
lib/
  types.ts           → all TS interfaces + getCategoryColor()
  graph.ts           → applyDagreLayout() + gridLayout()
public/
  llms.txt           → LLM crawler optimization
```

## Data shape (tools.json)
```ts
{ id, name, category, tagline, description, type: "oss"|"saas",
  pricing: { free_tier, plans[] }, github_stars, slot, prominent, urls }
```

## Category colors
| Category | Color |
|---|---|
| code-editor | #7c6bff |
| agentic-coding | #ff6b6b |
| multi-agent-framework | #26de81 |
| llm-provider | #00d4aa |
| observability | #fd9644 |
| vector-database | #4ecdc4 |
| deployment | #ff9f43 |
| mcp-server | #a29bfe |
| ai-design | #74b9ff |
| data-auth | #fd79a8 |

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
