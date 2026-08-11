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

## Iteration 6 — app/feed/, app/pulse/, app/watch/, app/profile/

**Problem found:** the Pulse dashboard (`app/pulse/*`) turned out to be a
self-contained subsystem styled entirely differently from the rest of the
app — instead of the `--text-primary/secondary/muted` tokens, it uses raw
Tailwind `text-white/N` opacity utilities throughout. Several of those
fail AA outright:

| Class                                                                     | Contrast |
| ------------------------------------------------------------------------- | -------- |
| `text-white/40` (metadata row)                                            | 3.77:1   |
| `text-white/30` (chevron, snapshot notice, empty state, breadcrumb arrow) | 2.60:1   |
| `text-white/20` (`—` placeholder)                                         | 1.77:1   |

(`text-white/85` at 14.17:1 and `text-white/60` at 7.3:1 were already fine
and left alone.) The usual 8-10px text also ran throughout `feed/`, `watch/`,
and `profile/`.

**Fixes:**

- `CategoryMomentumCard.tsx` + `pulse/page.tsx`: `text-white/40`,
  `text-white/30`, `text-white/20` → `text-[var(--text-muted)]` (4.75:1).
  Backgrounds (`bg-white/5`, `bg-white/10`) left untouched — decorative
  fills aren't subject to text-contrast rules.
- `FeedClient.tsx`, `FeedCard.tsx`, `feed/event/[eventId]/page.tsx`,
  `LatencyLeadersCard.tsx`, `ActiveIncidentsCard.tsx`,
  `WatchSlotGrid.tsx`, `StackWatchHeader.tsx`, `WatchMissingPanel.tsx`,
  `ProfileClient.tsx`: 8-10px text bumped to 11px; uppercase section
  labels converted to `type-overline`.
- Left `app/feed/event/[eventId]/opengraph-image.tsx` untouched — its font
  sizes (13-72px) were already well above any floor and it's a Satori/edge
  image generator outside the scope of this pass.

**Nothing hidden this iteration.**

## Iteration 7 (final) — components/mobile/, components/ui/, landing page

**Problem found:** `components/ui/LlmPromptSection.tsx` (the "honest take /
here's the prompt" section on the landing page) turned out to be the worst
offender in the whole audit — a set of near-black colors used as text on a
near-black background, effectively invisible:

| Element                        | Color on bg            | Contrast   |
| ------------------------------ | ---------------------- | ---------- |
| "free forever"                 | `#1e1e2e` on `#07070e` | **1.22:1** |
| "Prompt" tag                   | `#252535` on `#0c0c14` | **1.29:1** |
| "works with ChatGPT…"          | `#252535` on `#07070e` | **1.33:1** |
| filename caption               | `#2a2a44` on `#080810` | **1.44:1** |
| prompt description             | `#333350` on `#0c0c14` | **1.6:1**  |
| eyebrow label                  | `#444466` on `#08080e` | **2.15:1** |
| subtitle paragraph             | `#4a4a6a` on `#08080e` | **2.36:1** |
| "Here's the other 20%" heading | `#6060a0` on page bg   | **3.46:1** |
| prompt body text               | `#6060a0` on `#05050c` | **3.56:1** |
| gap-card description           | `#7070a0` on `#0c0c14` | **4.19:1** |

A contrast ratio near 1:1 means the color is nearly identical to its
background — this text was not merely small, it was close to literally
unreadable. The rest of `app/page.tsx` (2143 lines) had the same bug
scattered through it at smaller scale: `#444466` (2.13:1), `#333355`
(1.64:1), `#6666aa` (3.81:1), and `#6c6c8a` (3.9:1) used as real body/caption
text in the activity feed preview, feature descriptions, and hero subtitle.

**Fixes:**

- `LlmPromptSection.tsx`: every one of the 10 broken colors above replaced
  with `var(--text-muted)` or `var(--text-secondary)` depending on its role
  (captions/labels → muted, body copy/headings → secondary) — all now
  5.0-6.0:1. Remaining 10-11.5px text bumped to 11-13px.
- `app/page.tsx`: `#444466`/`#333355` → `var(--text-muted)`;
  `#6666aa`/`#6c6c8a` → `var(--text-secondary)` (17 call sites across the
  activity feed, feature cards, and hero). Left the three `#0a0a0f`-on-button
  instances alone — dark text on a bright button background is correct, not
  a bug.
- `ToolPulseSection`-adjacent components: `ProductionUsageSection.tsx`
  (`#26de8188`, 3.74:1 → `var(--success)`), `ToolUsageButton.tsx`
  (`color+"88"` category-color-at-alpha, and an 8px count badge with
  `opacity: 0.7` stacked on top → full opacity, 10-11px), `Navbar.tsx`
  (sign-out button had `opacity: 0.6` on `text-secondary`, dropping it to
  2.75:1 → removed).
- Bumped remaining 8-10px text to 11px across `ToolDetailSheet.tsx`,
  `PhaseCoverageBar.tsx`, `MyStackTray.tsx` (14px-circle remove button,
  8px→9px — kept smaller than the 11px floor because it's physically
  constrained by the circle size).

**Decision (not changed, intentional):** the landing page's small SVG
"preview" illustrations (`StacksPreview`, `BuilderPreview`, and similar
mini mockup diagrams, `fontSize={6-8}`) were left as-is. These are
miniature schematic illustrations of what a feature looks like — decorative
diagram texture at a fixed, hand-tuned layout (hardcoded x/y coordinates in
a 280×160 viewBox), not functional content a user reads letter-by-letter.
Bumping their font size risks colliding with the surrounding shapes with no
way to visually verify the result in this environment, for a purely
decorative element. Flagging here rather than silently leaving it
unexamined.

**Nothing else hidden this iteration.**

---

## Summary

Seven iterations, seven commits, zero regressions (`make check` — lint,
typecheck, and all 215 tests — passed after every commit). The core,
recurring problems across the whole codebase were:

1. **A type scale that floored at 7-10px** where the app's own semantic
   scale (built for exactly this, `type-*` utilities in `globals.css`) was
   barely adopted (~14 of 500+ call sites) — fixed at the token level in
   Iteration 1 so the fix propagates everywhere, then swept file-by-file.
2. **`--text-muted` failing WCAG AA at 2.78:1** — fixed once, at the source,
   in Iteration 1.
3. **Translucent brand colors reused as text color** — a pattern that
   recurred in nearly every iteration (Iterations 2-7), always in the
   40-60% alpha range, always failing AA. Backgrounds/borders keep their
   transparency; text now always renders at full opacity.
4. **One genuinely severe bug** (`LlmPromptSection.tsx`, Iteration 7):
   near-black text on a near-black background, some pairs under 1.5:1
   contrast — effectively invisible, not just hard to read.

No UI elements were hidden or removed during this pass — everything found
was a size/color/contrast defect, not genuinely low-value information. If a
future pass wants to reduce information density (not just fix legibility),
the flagged-but-unfixed items above are good starting points:
`SLOT_AUTONOMY["multimodal"]`'s color and the app-wide `multimodal` category
color (`#6c5ce7`, fails AA even at full opacity) are the one open item that
needs a deliberate design decision rather than a mechanical fix.

## Iteration 8 — gap fix: app/genome/, app/match/, app/mcp/, app/changelog/ + stragglers

A final repo-wide sanity sweep after "Iteration 7 (final)" found that
`app/genome/` (a ~15-file flagship route per the architecture doc),
`app/match/`, `app/mcp/`, `app/changelog/`, and `app/compare/CompareClient.tsx`
were never covered by the original 7-task plan, plus a handful of the same
recurring bugs had leaked into files already marked done:

- The `#444466`/`#333355`/`#6666aa`/`#6c6c8a` dark-text bug from Iteration 7
  also existed in `MatchClient.tsx`, `mcp/page.tsx`, `changelog/page.tsx`,
  `GraduationBanner.tsx`, `ScanStep.tsx`, `SlotGrid.tsx`,
  `StackQuizModal.tsx`, `CompareClient.tsx`, and — same pattern again —
  **10 OG/social-share-image routes** (`#2a2a44` footer branding at 1.42:1,
  `#333355` at 1.64:1, `#6666aa` at 3.81:1): the "cut the noise, pick your
  AI stack." tagline and URL that render on every shared link preview were
  themselves nearly invisible. Fixed with a literal hex bump (`#7f7fa4` /
  `#8888aa`, matching the app tokens) since these are Satori-rendered and
  can't use `var()`.
- `StacksClient.tsx` and `StackDetailHeader.tsx` (touched in Iteration 4)
  still had a plain, non-alpha `#6666aa` (3.81:1) that the alpha-suffix-only
  regex used at the time didn't match.
- `DetailPanel.tsx` (touched in Iteration 3) had one remaining `#ff6b6b99`
  (3.15:1) instance the earlier pass missed.
- `MatchClient.tsx`: `#ff6b6b88`/`#ff6b6b66` (2.71:1 / 2.0:1) on the "kill
  conditions" heading and bullet.
- ~50 more `fontSize: 10` instances across all of `app/genome/`.

**Fixes:** all of the above bumped to the appropriate token (`var(--danger)`,
`var(--text-muted)`, `var(--text-secondary)`) or literal hex equivalent for
OG routes; remaining 10px text → 11px throughout `app/genome/`, `app/match/`,
`app/mcp/`, `app/changelog/`, `app/compare/CompareClient.tsx`.

**Lesson for future passes:** the original task breakdown was built from
`CLAUDE.md`'s route list but missed a few directories on the first read, and
the alpha-suffix regex (`#RRGGBBAA`) used in Iterations 2-4 didn't catch
plain 6-digit dark colors used the same way. This final sweep grepped the
_entire_ repo for both patterns rather than trusting the per-directory task
list — that's what caught the remaining instances above.

**Nothing hidden this iteration.**

## Iteration 9 (final cleanup) — app/simulate/, remaining modals, page.tsx stragglers

A second repo-wide grep after Iteration 8 turned up one more uncovered
route (`app/simulate/`, the cost simulator — 23 files, ~3,600 lines) plus
leftover `fontSize: 10` in four modal components whose hex colors were
fixed back in Iteration 1 but whose sizes were never swept, and 14
remaining `fontSize: 10` instances in `app/page.tsx` that Iteration 7 had
missed (it only fixed that file's broken colors, not its sizes).

**Fixes:** `fontSize: 10` → `11` across `ProviderCompare.tsx`,
`UnitEconomics.tsx` (app/simulate/), `SuggestToolModal.tsx`,
`GetStartedModal.tsx`, `WalkthroughOverlay.tsx`, `StackQuizModal.tsx`, all
remaining instances in `app/page.tsx`, and one `fontSize: 8` tag in
`genome/MissingPanel.tsx`.

**Verified clean:** a final repo-wide grep for every pattern used throughout
this audit (sub-11px text, translucent/dark brand colors as text color,
opacity stacked on already-muted text) now returns only the handful of
previously-reviewed, intentional exceptions — decorative bullet/radio-dot
glyphs (`ComparisonPanel.tsx`, `FilterPanel.tsx`) and avatar-fallback
initials sized to fit their physical circle (`DetailPanel.tsx`,
`ToolNode.tsx`, `MyStackTray.tsx`, all 9-10px inside 14-20px circles,
documented in Iterations 2-3).

**Nothing hidden this iteration.**

---

# Part 2 — structural/hierarchy pass

The pass above (Iterations 1-9) fixed contrast ratios and font-size floors,
but user feedback after using the app was that several pages still felt
"horrible" to read — specifically the graph sidebar filters, Activity
(Feed), Pulse, and Stacks. The problem in these pages isn't (only) contrast
or size anymore — it's **information hierarchy and density**: too many
things rendered at the same visual weight, with no grouping or breathing
room, so nothing stands out and everything competes for attention at once.
This part goes deeper: restructuring layout, spacing, grouping, and what's
shown by default — not just recoloring/resizing existing elements.

## Iteration 10 — FilterPanel.tsx (graph sidebar filters) restructure

**Problem:** the sidebar crammed 7 distinct filter mechanisms into a
208px-wide column with almost no visual separation between them — search,
two boolean toggles, an advanced "Find Stacks" sub-filter (5 groups, ~20
pill buttons, defaulted **open**), the category/layer filter (the actual
primary way to filter the graph), a "browse all categories" link, and the
edge-type filter. Every section used identical tiny uppercase labels and
identical pill styling, so a user scanning down saw one undifferentiated
wall of controls with no anchor points. The advanced 20-pill sub-filter
being open by default pushed the primary category filter below the fold.

**Redesign (not just a token swap):**

- Sidebar widened `w-52` (208px) → `w-64` (256px) — the pill buttons and
  category rows were visibly cramped/wrapping at the old width.
- **Reordered by actual usage priority**: Stack Layers (the primary graph
  filter) now leads, followed by Edges, with the secondary "Find a curated
  stack" sub-filter (renamed from "Find Stacks" for clarity) moved to the
  end and **collapsed by default** — it now shows a one-line summary of
  active filters instead of the full 20-pill UI when collapsed.
  `stackFilterCollapsed` initial state flipped `false` → `true`.
  "Only show tools I use" and "Hide stale tools" replaced their competing
  bordered-box styling with small checkbox indicators grouped as one
  visual unit.
- **Real section dividers**: every major section now gets `border-top` +
  `pt-4 mt-4`, so the eye has clear stopping points instead of a
  continuous scroll of same-weight content.
- **Stronger header hierarchy**: section headers (Stack Layers, Edges,
  Find a curated stack) bumped from `type-overline` (11px) to `type-label`
  (13px, semibold); layer question headers ("What are you building and how
  is it defined?") bumped 11px→12px and switched from `text-secondary`
  (muted even when active) to `text-primary` when active, so they read as
  real headers instead of blending into the category list below them.
- Category rows under each layer now sit against a left guide line
  (`border-left`) so the "these belong to the header above" relationship
  is visible at a glance, not just implied by indentation.

**Verified:** screenshotted `/explore` with Playwright against the running
dev server — wider sidebar, bold layer headers, visible section dividers,
"Find a curated stack" correctly collapsed with chevron closed, zero
console errors.

**Nothing hidden this iteration** — restructuring only, all filters still
present and functional, just reordered/regrouped/decollapsed differently.

## Iteration 11 — Activity Feed (FeedCard.tsx) restructure

**Problem:** screenshotted `/feed` before touching anything — the collapsed
card text was actually legible (Iterations 1-9 had already fixed the raw
contrast issues here). The real problem was **homogeneity**: every single
row — a routine 5-point health wobble and a critical service incident —
rendered in an identical box with identical visual weight. The only
differentiator was a 2px colored bar on the left edge, which requires
reading every row to notice. With `Sweep AI` appearing three times in the
first ten rows, the feed reads as a wall of near-identical boxes rather
than a scannable timeline. Timestamps (`today`/`yesterday`) were also
noticeably dim relative to everything else on the row.

**Redesign:**

- `eventDescription()` now returns an `icon` (one glyph per event type —
  ↑/↓ for health, ⚡ for benchmark drift, ⭐ for star milestones, 📦 for
  archived, 🔴 for incidents, ✓ for resolved) and a `severe` flag.
- Each card now leads with a 28px colored icon badge instead of a bare
  accent bar — gives the eye a scannable shape+color pattern before
  reading any text, the way an inbox uses icons to let you triage without
  reading every subject line.
- Severe events (archived repos, incidents) get a tinted card background
  and border (`eventColor + "0c"/"40"`) instead of the default neutral
  card — they now visually interrupt the scroll instead of blending in
  with routine health deltas.
- Timestamp color: `text-muted` → `text-secondary` (still secondary
  information, but no longer the dimmest thing on the row).

**Verified:** screenshotted `/feed` before and after — icon badges render
correctly per event type, colors match event severity, no console errors,
`eventDescription` has no other call sites so the added return fields are
safe.

**Nothing hidden this iteration.**

## Iteration 12 — Ecosystem Pulse (page.tsx) restructure

**Problem:** screenshotted `/pulse` first. Initial suspicion — that all 17
category cards had loud, fully-saturated colored borders competing for
attention — turned out to be a **misread of a compressed screenshot**;
`getComputedStyle()` on the actual rendered card confirmed the border is
only a 2px colored _top_ accent, with the rest at a subtle `white/10`
(logged here so a future pass doesn't waste time re-litigating it: always
verify a visual read against computed styles before redesigning around
it, especially for anything border/shadow-related at small sizes).

The real problem was **ordering**: `getCategoryMomentum()` returns
categories in raw data order, and `page.tsx` rendered them as-is — so
"needs attention" cards (at-risk, declining) were scattered randomly among
15 other cards. A monitoring dashboard where the reader has to check every
row to find the 2-3 that matter is the textbook case of density without
hierarchy.

**Redesign:**

- Added `sortByUrgency()`: at-risk categories first, then declining
  (momentum < -5), then stable, then rising, then "no data yet" last —
  each bucket internally sorted worst-momentum-first.
- Added visible section labels (`NEEDS ATTENTION`, `DECLINING`, `STABLE`,
  `RISING`, `NO DATA YET`) inserted into the grid wherever the bucket
  changes, so the reordering is legible as structure, not just invisible
  shuffling. A user's eye now lands on 2-3 cards worth acting on before
  scrolling into the 12 that are fine.

**Verified:** screenshotted `/pulse` after the change — "Needs attention"
(MCP Servers, Multimodal, Agent Frameworks, all showing `⚠ at risk`) now
leads the page; "No data yet" categories correctly sink to the bottom; no
console errors; `make typecheck` clean.

**Nothing hidden this iteration** — same 17 categories shown, just ordered
and grouped by what the reader actually needs to see first.
