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

## Iteration 3 — components/panels/ + components/comparison/

**Problem found:** `FilterPanel.tsx` (the left sidebar used to filter every graph
view) ran almost entirely on 10px section labels and filter chips —
essentially the whole left rail of the app. `StackHealthPanel.tsx` had tag
chips (required/recommended/heads-up/phase-count) at **8px**, below any
reasonable floor. Several spots reused the same double-dim and
translucent-color contrast bugs found in Iteration 2:

- `TrajectorySparkline.tsx` legend: `text-white/30` — **2.60:1**.
- `SlotRiskBadge.tsx` "See alternatives →" action link: `text-white/40` —
  **3.77:1** (a clickable CTA, not decoration).
- `DetailPanel.tsx` sync-timestamp: `opacity-60` stacked on top of
  `text-muted`, undoing Iteration 1's contrast fix (same bug as ToolNode).
- `StackHealthPanel.tsx`: `#26de8188` (success text, 3.74:1) and
  `#fd964499` ("heads up" tag, 3.81:1) both fail AA.

**Fixes:**

- `FilterPanel.tsx`: all uppercase section labels (Find Stacks, Team size,
  Budget, Use case, Stage, Cluster, Stack Layers, Edges) converted to
  `type-overline`; filter chips, Clear button, layer question text, and the
  "Browse all categories" link bumped 10px → 11px.
- `DetailPanel.tsx`: removed the redundant `opacity-60`; avatar-fallback
  initials 8px → 10px.
- `TrajectorySparkline.tsx` legend: `text-white/30` → `text-[var(--text-muted)]`
  at 11px (4.75:1).
- `SlotRiskBadge.tsx` action link: `text-white/40` → `text-[var(--text-muted)]`.
- `ComparisonPanel.tsx` + all 7 `components/comparison/` cells (CategoryPill,
  ChooseIfCard, DescriptionCard, PlanPills, Row, ToolPill, TypeBadge): 10px →
  11px across badges, table headers, and section labels; section headers
  converted to `type-overline` where uppercase.
- `StackHealthPanel.tsx`: all 8px/10px text bumped to 11px; `#26de8188` →
  `#26de81cc` (3.74:1 → ~5.7:1) and `#fd964499` → `#fd9644cc` (3.81:1 →
  6.04:1, matching the alpha already used elsewhere in the same file).

**Nothing hidden this iteration.**

## Iteration 4 — app/builder/ + app/stacks/

**Problem found:** the same translucent-brand-color-as-text pattern from
Iterations 2-3 turned out to be systemic, not a one-off — it recurs across
`StackDetailHeader.tsx` and `StacksClient.tsx` for three different colors:

| Color               | @66 (40%) | @88 (53%) | @99 (60%) | Full    |
| ------------------- | --------- | --------- | --------- | ------- |
| `#7c6bff` (accent)  | 1.72:1    | 2.21:1    | 2.50:1    | 5.08:1  |
| `#ff6b6b` (danger)  | 2.00:1    | 2.71:1    | 3.15:1    | 7.12:1  |
| `#fdcb6e` (warning) | 2.87:1    | 4.27:1    | 5.15:1    | 13.11:1 |

Every alpha variant below full opacity fails WCAG AA (4.5:1) — these three
brand colors are only safe as _text_ at full strength; the transparency was
presumably borrowed from background-tint styling where it's fine, then
reused for text color where it isn't. Also found: `BuilderSlotList.tsx`'s
`SLOT_AUTONOMY` label color had `opacity: 0.75` layered on top, dropping
3 of 9 slot-type colors below AA (as low as 2.75:1 for "multimodal").

**Fixes:**

- Replaced every `color: "#7c6bff88/66/99"`, `"#ff6b6b88/66/99"`,
  `"#fdcb6e88/66"` text-color usage in `StacksClient.tsx`,
  `StackSidebar.tsx`, `StackDetailHeader.tsx`, and `BuilderSlotList.tsx`
  with the full-opacity token (`var(--accent)`, `var(--danger)`,
  `var(--warning)`) — translucency is still used freely for backgrounds/
  borders in the same files, just not for text.
- Removed the `opacity: 0.75` on `SLOT_AUTONOMY` labels.
- Bumped the remaining 10px text across `BuilderClient.tsx`,
  `BuilderSlotList.tsx`, `MobileSlotPicker.tsx`, `StacksClient.tsx`,
  `StackSidebar.tsx`, `StackDetailHeader.tsx`, `MobileStackPicker.tsx`, and
  `app/stacks/[stackId]/page.tsx` to 11px; uppercase section labels
  converted to `type-overline`.

**Note (not fixed, flagged for later):** `SLOT_AUTONOMY["multimodal"].color`
(`#6c5ce7`) is the canonical `multimodal` category brand color from
`lib/types.ts`'s `CATEGORIES` table — it fails AA as text even at full
opacity (4.07:1) and is reused as literal text color in many places
app-wide (category labels, dots, badges). Fixing it means revisiting the
category color palette itself, which is a bigger, cross-cutting design
decision out of scope for a component-level pass — left as-is here rather
than patching one call site inconsistently with the rest of the app.

**Nothing hidden this iteration.**

## Iteration 5 — app/tool/, app/category/, app/compare/, app/case/

**Problem found:** the same `#ff6b6b99` translucent-danger-as-text bug
(3.15:1, fails AA) recurred again in `app/tool/[toolId]/page.tsx`'s "Ruled
out by" section — the third time this exact failure mode has shown up
(StackHealthPanel in Iteration 3, StackDetailHeader in Iteration 4). Plus
the usual scattering of 8-10px text across the standalone tool page,
category pages, the compare page, and the case-study page.

**Fixes:**

- `app/tool/[toolId]/page.tsx`: `#ff6b6b99` → `var(--danger)` (3.15:1 →
  7.12:1) in both the "Ruled out by" heading and reason text; remaining
  10px text bumped to 11px; uppercase section labels → `type-overline`.
- `ToolPulseSection.tsx`: 9-10px text bumped to 11px; uppercase labels →
  `type-overline`.
- `category/page.tsx`, `category/[categoryId]/page.tsx`,
  `compare/[toolA]/[toolB]/page.tsx`, `case/CaseClient.tsx`: 10px text
  (badges, pills, table cells) bumped to 11px; two 8px health-dot glyphs in
  the compare page bumped to 11px.

**Nothing hidden this iteration.**

**Nothing hidden this iteration.**
