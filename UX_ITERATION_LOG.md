# UI/UX iteration log

Running log for the readability/typography overhaul. Each entry: what changed, why,
and — per the brief — anything hidden for being low-value, with the reason.

## Iteration 1 — Type scale + color-contrast foundations

**Problem found:**

- `--text-muted` (`#555577`) had a contrast ratio of **2.78:1** against `--bg`
  (`#0a0a0f`) — fails WCAG AA (needs 4.5:1 for normal text). Used in ~150+ places
  as the default "secondary info" color.
- The app's own semantic type scale (`type-body`, `type-caption`, etc. in
  `globals.css`) floored at 10px and was barely adopted (~14 call sites).
  Meanwhile the codebase had 196× `text-[10px]`, 24× `text-[11px]`, 6× `text-[9px]`,
  5× `text-[8px]`, 1× `text-[7px]`, plus 225× Tailwind `text-xs` (12px) and
  73× `text-sm` (14px) used as de facto body text — well below comfortable
  reading size.
- `#555577` / `#8888aa` were hardcoded as raw hex literals in ~150 places
  (inline `style={{ color: "..." }}`, SVG `fill="..."`) instead of the CSS
  variables — so the app never had one source of truth for these colors even
  though the tokens existed.

**Fixes:**

- Raised `--text-muted` to `#7f7fa4` (4.75:1, passes AA) — kept distinct from
  `--text-secondary` (5.78:1) so the two remain visually distinguishable.
- Rewrote the `type-*` utility scale floor from 10px to 11px (tags/labels) and
  12px to 14px (body prose) — see the scale doc comment in `globals.css`.
- Overrode Tailwind's `--text-xs` (12px→13px) and `--text-sm` (14px→15px)
  theme tokens directly, so the ~300 existing `text-xs`/`text-sm` call sites
  get the fix automatically without touching every file.
- Replaced hardcoded `#555577`/`#8888aa` literals with `var(--text-muted)` /
  `var(--text-secondary)` everywhere **except** edge-runtime OG image
  generators (`opengraph-image.tsx`, `og/route.tsx` routes) and `lib/types.ts`'s
  `getCategoryColor` fallback — those render through Satori, which can't
  resolve CSS custom properties, so they got a literal hex bump to `#7f7fa4`
  instead.

**Nothing hidden this iteration** — foundational token/color work only, no UI
elements removed or collapsed.

## Iteration 2 — components/graph/ (ToolNode, ExploreGraph, ExploreGraph3D, EnrichedEdge, LaneLabel)

**Problem found:** the primary visual surface of the app (every tool card in
Explore/Builder/Stacks) ran almost entirely on 10px text: category label,
tool name (12-13px), all four status badges (OSS/Free Tier/Stale/New), star
count, price pill, action links. Two spots had much worse issues than mere
size:

- `LaneLabel.tsx` (swimlane section headers in the "Layers" view) used
  `rgba(124,107,255,0.55)` and `rgba(160,155,210,0.35)` for its heading and
  subtitle — effective contrast **2.28:1** and **1.88:1** against the
  background, both far below WCAG AA and genuinely hard to see.
- `ExploreGraph3D.tsx`'s legend header used `#7c6bff88` — **2.22:1**.
- The tool-card "Synced Xd ago" timestamp applied `opacity: 0.6` on top of
  an already-muted color, silently undoing the contrast fix from Iteration 1.

**Fixes:**

- Tool card (`ToolNode.tsx`): category label now uses `type-overline`; name
  bumped 12/13px → 13/15px; all four status badges, star count, price pill,
  and action links bumped 10px → 11px; avatar-fallback initials 7px → 9px;
  removed the redundant `opacity: 0.6` on the sync timestamp.
- `LaneLabel.tsx` and the 3D legend header: replaced translucent accent
  colors with solid `var(--accent)` / `var(--text-muted)` — contrast now
  5.08:1 and 4.75:1 respectively.
- `EnrichedEdge.tsx` relationship tooltip: 10px → 12px (it's a real
  descriptive sentence, not a tag).
- `ExploreGraph.tsx`: Compare/Grid/Layers/3D toggle buttons (interactive
  controls users click) bumped 10px → 12px; compare-hint instructional text
  10px → 13px (`text-xs` token).
- `ExploreGraph3D.tsx` hover-tooltip name/tagline: 11/9px → 13/12px.

**Nothing hidden this iteration.**
