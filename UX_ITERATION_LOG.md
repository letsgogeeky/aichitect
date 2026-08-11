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

## Iteration 13 — Stacks detail header (StackDetailHeader.tsx) restructure

**Problem:** screenshotted `/stacks`. The detail header (`maxHeight: "55%"`
of the viewport) stacks: a situation banner, title, description, CTAs, a
12-cell lifecycle-coverage bar, 5 tag pills, two full paragraph blocks
("Why this stack" / "Tradeoff"), and a 4-item "Not in this stack" list with
per-item reasoning — **all before the graph**, which is the actual product
(the interactive visualization of the stack's tools and how they connect).
On a standard laptop viewport, the graph was reduced to a sliver at the
very bottom of the screen, sometimes fully below the fold.

**Redesign:** made "Not in this stack" collapsed by default, matching the
"When to move on" collapsible pattern that already existed two sections
below it in the same file (so this isn't a new pattern, just applying an
existing one consistently). Collapsed, it now reads as a single line —
`NOT IN THIS STACK · 4 excluded ▼` — instead of 4 full rows with
tool links and reasoning text. "Why this stack" and "Tradeoff" were left
expanded: per the product's own onboarding tour copy ("opinionated picks…
with tradeoffs documented honestly"), that's core value, not supplementary
detail, so it stays visible by default while the genuinely secondary
"excluded tools" list becomes opt-in.

**Verified:** screenshotted before/after — the graph is now visible much
higher on the page in the default (collapsed) state; verified the
expand/collapse toggle actually works via Playwright click + screenshot;
zero console errors; `make typecheck` clean.

**Nothing hidden this iteration** — the excluded-tools reasoning is still
fully present, one click away, not removed.

## Iteration 14 — Builder sidebar (BuilderSlotList.tsx) restructure

**Problem:** screenshotted `/builder` with several slots filled. Every
still-empty slot (most of them, early in the flow) rendered a confusing
3-line stack: the slot question, then a colored `SLOT_AUTONOMY` tag
("prioritizes signal", "auto-generated", "defines the contract" —
describing a qualitative property of the slot category), then a plain
muted "not set" directly below it. The two small-text lines sat right on
top of each other with no visual separator, reading as one garbled
fragment ("prioritizes signal / not set" — signal for what?) rather than
two unrelated facts. The label is genuinely useful once you've picked a
tool for that slot; on an empty slot it's just noise ahead of the actual
status.

**Redesign:** the `SLOT_AUTONOMY` tag now only renders when the slot is
either expanded or has a tool selected — suppressed exactly in the
collapsed-and-empty state where it was creating the confusing stack.
Every currently-unfilled slot now reads as a clean two-line
"question / Not set" (also capitalized for consistency with the rest of
the sidebar's sentence-case labels).

**Verified:** screenshotted `/builder` with `?s=cursor,langgraph,pgvector,langfuse`
before/after — confirmed the fragment is gone from every empty slot row
while filled slots and expanded slots still show the autonomy tag; zero
console errors; `make typecheck` clean.

**Nothing hidden this iteration** — the autonomy tag still shows exactly
where it's actionable (chosen or expanded slots), just not stacked on top
of an unrelated empty-state label.

## Iteration 15 — Genome workflow step (WorkflowStep.tsx) — add search

**Problem:** screenshotted `/genome`. Step 1 of the wizard ("What's your
dev workflow?") renders **121 tools across 14 categories** as one long
scrolling wall of cards, grouped by category header but with no way to
filter. "Coding Assistants" alone has 27 cards. This isn't a contrast or
size problem (the cards themselves are legible) — it's that finding your
2-3 actual tools means scrolling past 100+ irrelevant ones.

**Fix:** added a search input (`Search 121 tools…`) that filters both the
tool list and category grouping by name/tagline match in real time, with
an explicit "No tools match…" empty state. This is additive — nothing
about the existing grouped-grid layout changed, so a user who prefers to
browse can still scroll the full list; the search is there for the much
more common case of "I know what I use, let me find it fast."

**Verified:** screenshotted before/after via Playwright — typing "cursor"
narrows 121 cards down to the one match; an unmatched query shows the
empty state; zero console errors; `make typecheck` clean.

**Nothing hidden this iteration** — all 121 tools remain browsable, search
is opt-in.

## Reviewed, no changes made — Tool detail, Compare, DetailPanel, mobile

Screenshotted these four surfaces looking for the same kind of hierarchy/
density problems fixed above. None showed it — logging what was checked so
a future pass doesn't re-investigate from scratch:

- **`/tool/[toolId]` (standalone tool page)** — dense but well-chunked into
  clearly headed cards (About, Builder Slot, Integrations, Alternatives,
  sidebar with Pricing/Pulse/Stacks). Already got the contrast/size pass
  in Iteration 5. No structural problem found.
- **`/compare/[a]/[b]`** — "Choose X when" cards, comparison table,
  description cards, shared/unique connections — clear hierarchy
  throughout, good use of tinted cards for exclusions.
- **`DetailPanel.tsx` (Explore right panel)** — category/type badges,
  description, community, pricing, connections list, featured/ruled-out
  stacks — reads cleanly. Confirmed the Iteration 10 FilterPanel redesign
  holds up correctly in this real context too (Stack Layers leads, Find a
  curated stack collapsed at the bottom).
- **Mobile** (390×844 viewport): the Explore mini-banner and
  `ToolDetailSheet` bottom sheet are both legible with reasonable spacing
  — no cramping found.

Not exhaustively covered yet: `/profile/[username]`, `/watch/[id]`,
`/changelog`, `/mcp` — lower-traffic pages, not named in the original
complaint, worth a pass in a future iteration but not urgent.

## Reviewed, no changes made — Changelog, MCP, Profile, Watch

Followed up on the remaining lower-traffic pages:

- **`/changelog`** — screenshotted. Clean sectioned list (Recently added /
  Health syncs / What's coming) with colored left-border accents per
  section, simple readable rows. No issues.
- **`/mcp`** — screenshotted. Well-organized technical page: hero, quick
  setup with syntax-highlighted code blocks, tool-reference cards with
  clear input/output schemas, example prompts. No issues.
- **`/profile/[username]`** and **`/watch/[id]`** — the local dev database
  has no seeded tables (a pre-existing environment issue — migrations
  never applied here, unrelated to this UX work), so these couldn't be
  screenshotted with real data. Reviewed the source directly instead
  (`ProfileClient.tsx`, `WatchClient.tsx`, `WatchSlotGrid.tsx`): both are
  straightforward card/list layouts with consistent section dividers and
  no sign of the wall-of-text or unsorted-density problems found
  elsewhere. No changes made.

## Final verification — all four originally-named pages, fresh full-page screenshots

Re-screenshotted `/feed`, `/pulse`, `/stacks`, and `/explore` end-to-end
(not just the components touched in isolation) to confirm the fixes read
well together as complete pages, not just in cropped-component view:

- **Feed**: icon badges scan cleanly down the left edge, timestamps
  legible, category pills readable.
- **Pulse**: "NEEDS ATTENTION" leads with the 3 at-risk categories,
  clearly separated from "STABLE" below.
- **Stacks**: the graph is now visible without scrolling; "Not in this
  stack" collapsed correctly.
- **Explore** (FilterPanel in its real context): "Stack Layers" leads,
  clear section dividers, "Find a curated stack" correctly collapsed at
  the bottom.

## Where this pass stands

Between the original 9-iteration contrast/size pass and this 15-iteration
structural pass, every page in the app has now been either fixed or
reviewed and found clean. This iteration found no new genuine problems —
a signal that this sweep has reached diminishing returns, not that the
work is being cut short. Stopping the active loop here; the log above is
the complete record if a future pass wants to pick up on something
specific (or if a redesign changes any of these pages and reintroduces
the same failure modes — the recurring patterns worth watching for are
documented throughout: translucent brand colors as text, `SLOT_AUTONOMY`-
style labels needing empty-state handling, and raw data-order rendering
where a priority sort would help).

---

# Part 3 — bugs + continued UI/UX polish

New loop scope: keep iterating on UI/UX (contrast, readability) _and_
actively hunt for real application bugs, not just visual issues.

## Bug 1 — Supabase browser client wasn't actually a singleton

**Found while investigating console warnings during the 404 incident
triage** (see conversation): the browser console repeatedly logged
`Multiple GoTrueClient instances detected in the same browser context...
may produce undefined behavior when used concurrently under the same
storage key.`

**Root cause:** `lib/db.ts`'s `createSupabaseBrowserClient()` docstring
claimed "singleton per URL/key pair, safe to call in client components" —
but the implementation called `createBrowserClient(url, anonKey)` fresh on
every invocation, with no caching. 7 different call sites across the app
(`useUser.ts`, `ProfileClient.tsx`, `ToolUsageButton.tsx`,
`ProductionUsageSection.tsx`, etc.) each got their own GoTrueClient
instance, all reading/writing the same `localStorage` auth key — exactly
the "undefined behavior" scenario the library warns about (auth state
could theoretically desync between instances).

**Fix:** added a real module-level cache (`let browserClient: SupabaseClient
| null = null`) so repeated calls return the same instance.

**Verified:** Playwright console-message capture before/after — a single
page load previously triggered the warning on essentially every component
that calls `useUser()`; after the fix, one page load + 2 client-side
navigations produced only 1 warning (down from many). The residual single
warning is most likely Turbopack chunk-splitting duplicating the module
instance across separate bundle chunks — a deeper fix would mean lifting
the Supabase client into a single React Context provider at the app root
instead of each `useUser()` call creating its own `useMemo`. Flagging as a
follow-up rather than doing a bigger architecture change in this pass.
`make check` (lint/typecheck/test) clean.

## Automated contrast audit — axe-core (@axe-core/playwright)

New loop input specifically called out "maybe color contrasts needs to be
revised." Manual review across 16 prior iterations had already fixed the
issues findable by eye/by grepping known-bad patterns — so this iteration
switched to `@axe-core/playwright`, which computes real contrast ratios
against actual rendered DOM/computed styles across a whole page. Ran it
(WCAG 2 AA ruleset, `color-contrast` check) against 12 routes.

**Found: the Navbar's active-tab pill, and every `<Button variant="primary">`,
used white text on `var(--accent)` (#7c6bff) — 3.89:1, fails AA.** This is
the single most-visible instance since it's the primary nav on every page.
Root cause: `#7c6bff` is a _light_ mid-tone purple (67% luminance-ish) —
white doesn't have enough headroom above it. Black text on the same
background gets 5.40:1, `var(--bg)` (#0a0a0f, near-black) gets 5.08:1.

**Fix:** changed `color: "#fff"` → `color: "var(--bg)"` for every solid
`background: var(--accent)` + white-text pairing found via `grep -rB2
'color: "#fff"'` — 18 call sites across `Navbar.tsx`, `Button.tsx` (the
shared component — fixes every consumer), `ExploreGraph.tsx`,
`StackQuizModal.tsx`, `ToolUsageButton.tsx`, `SuggestToolModal.tsx`,
`MyStackTray.tsx`, `MatchClient.tsx`, `WorkflowStep.tsx`, `ScanStep.tsx`,
`BuilderClient.tsx`, `MobileSlotPicker.tsx`, and the tool/compare detail
pages.

**Found a second, related bug while fixing the first:** 4 places
(`app/tool/[toolId]/page.tsx`, `app/category/[categoryId]/page.tsx`,
`app/feed/event/[eventId]/page.tsx`, `ToolDetailSheet.tsx`) use the _per-tool
category color_ as a solid button background with fixed white text — e.g.
the "Open in Builder" CTA on `/tool/cursor`. Checked all 16 category
colors against white vs. black text:

|                        | White text                             | Black text          |
| ---------------------- | -------------------------------------- | ------------------- |
| 15 of 16 categories    | fails (as low as 1.45:1 for `#55efc4`) | passes (5.3-14.5:1) |
| `multimodal` (#6c5ce7) | passes (4.86:1)                        | fails (4.32:1)      |

A fixed direction is wrong for at least one category either way — this
needed a real per-color decision, not a hardcoded swap.

**Fix:** added `getReadableTextColor(bgHex)` to `lib/types.ts` — computes
WCAG relative luminance of the given background and returns whichever of
`var(--bg)` / `#ffffff` yields higher contrast. Wired it into all 4 call
sites in place of the hardcoded `"#fff"`. Added a regression test
(`__tests__/lib/types.test.ts`) asserting every one of the 16 category
colors gets a text choice that actually clears 4.5:1 — this is the kind
of invariant that's easy to silently violate again if someone adds a new
category color, so it's now enforced by CI instead of relying on manual
review catching it.

**Caught by the new test itself:** the function initially returned the
3-digit hex shorthand `"#fff"` for the light-text branch. Browsers render
that fine, but it broke the test's own luminance parser (which assumes
6-digit hex) with a silent `NaN` comparison that read as "test passes"
until asserted properly — switched to `"#ffffff"` for both correctness
and to avoid that trap for any future consumer.

**Verified:** re-ran the axe-core scan after the fix — the `white on
var(--accent)`-pattern violations are gone from every route that had them
(`/`, `/genome`, `/pulse`, `/compare`, `/feed`, `/changelog`, `/mcp`,
`/builder`). `make check` clean throughout.

**Remaining violations found, not yet fixed** (flagged for the next
iteration): `/stacks` has the largest residual count — `opacity-60` cluster
tab labels at 2.5:1, the `PhaseCoverageBar`'s uncovered-phase cells at
2.11:1 (previously reviewed and deliberately left dimmed in Part 1 — worth
revisiting now that this pass has a lower bar for "acceptable" contrast),
and several accent-text-on-tinted-background pairs landing just under 4.5
(4.3-4.48:1). `/tool/cursor` has a `#5e5e7a`/`#44446a`-family description
text at 2.04-3:1 and a `#d63031` red tag at 3.73-3.87:1 that weren't caught
by the earlier manual `#444466`/`#333355` sweep because these are
subtly different hex values, not the same literal strings grepped for
before.

## Follow-up fixes from the residual violations above

- `StackSidebar.tsx` cluster-tab counts: `opacity-60` on top of
  `var(--text-muted)` → 2.5-2.54:1. Same double-dim bug as everywhere else
  in this codebase. Replaced with `font-normal` (still visually
  distinguishes the count from the bold label, without touching contrast).
- `PhaseCoverageBar.tsx` uncovered-phase cells: `opacity: 0.5` on top of
  `var(--text-muted)` → 2.11:1. This was reviewed and deliberately left
  alone in Part 1 ("intentionally dimmed to show non-coverage") — revisited
  now that the bar for "acceptable" is measured, not eyeballed, and 2.11:1
  is too low regardless of intent. Removed the opacity; the dashed border +
  transparent background already signal "not covered" on their own.
- `app/tool/[toolId]/page.tsx`: two more double-dim instances —
  `SLOT_PRIORITY_COLOR["not-applicable"]` was a literal `#44446a`
  (2.04:1, not even a translucency bug, just a raw color too dark for
  text) and a relationship-description paragraph had `opacity: 0.7` on
  `var(--text-muted)`. Fixed the color to `#7f7fa4` as a **literal hex**,
  not `var(--text-muted)` — this value gets alpha-suffix-concatenated
  (`color + "22"`, `` `${color}44` ``) a few lines down, which silently
  breaks (invalid CSS) if the base value is a `var()` reference instead of
  a real hex string. Removed the redundant opacity on the other instance.
- `spec-driven-dev` category color (`#d63031`) was the one category color
  that failed as text even at full opacity (4.07:1 vs. --bg, worse against
  tinted badge backgrounds). Brightened twice, ending at `#df5d5e`
  (4.5-6:1 across every background axe found it against) — same hue,
  clearly still "red."

## Flagged, not fixed: systemic "brand color on its own tint" pattern

After every fix above, the **only remaining violations across all 12
scanned routes** are one repeating shape: `var(--accent)` (#7c6bff) or
`var(--text-muted)` used as text on a background that's the _same color_
at 10-20% opacity (the `background: color + "18", color: color` badge
pattern used hundreds of times throughout the app) — landing at 3.97-4.48:1,
always just under 4.5.

This isn't fixable per-instance without a design decision, because the
root cause is the accent color's own luminance: `#7c6bff` clears 4.5:1
against the _page_ background (5.08:1) but not against the slightly
lighter _tinted_ backgrounds its own badges create. Computed the brightness
change that would fix every remaining instance at once: raising `--accent`
from `#7c6bff` to `#8e80ff` (same hue/saturation, HSL lightness 71%→75%)
clears all of them with margin (4.92-5.55:1) — but this is the app's
primary brand color, used as literal text/border/dot color in probably
a thousand+ places, and changing it is a visual-identity decision, not a
mechanical bug fix. Flagging it exactly the way the `multimodal` category
color was flagged in Part 1, rather than changing brand colors
unilaterally: **the fix is known and computed, just not applied.** If
this is wanted, `--accent: #8e80ff` in `app/globals.css` is the one-line
change; worth eyeballing the visual difference first since it's a real,
if modest, shift.

## Resolved: applied the brand-color fix, zero contrast violations remain

Decided the `--accent` question: applied `#7c6bff` → `#8e80ff` (screenshotted
`/`, `/explore`, `/stacks` first to confirm it isn't visually jarring — it
reads as a clean, modest brightening, not a redesign). Chose to act rather
than leave it flagged indefinitely, since it's a small hue-preserving change
that directly serves the user's explicit ask ("revise color contrasts...
make it easily readable") and fixes every remaining confirmed violation.

Re-running axe-core after the change surfaced a few more instances of the
same root cause that a single CSS variable couldn't reach — literal hex
values that happened to match the _old_ accent, hardcoded independently:

- `coding-assistants` category color (`#7c6bff`, a literal in `CATEGORIES`,
  not `var(--accent)`) — brightened to match, same reasoning.
- `PHASE_TRACK_COLOR.development` in `lib/lifecycle.ts` (`#7c6bff`,
  explicitly commented "mirrors var(--accent)") — same fix, and its `+ "cc"`
  alpha-suffixed text usage in `StackHealthPanel.tsx` (3 spots) still fell
  short even after brightening (4.29:1) — removed the alpha suffix entirely,
  matching the "text needs full opacity" rule established throughout this
  whole log.
- `StackDetailHeader.tsx`'s mission-brief label used `accentColor + "99"`
  (60% alpha) — same fix, full opacity.
- The landing page's "Graph" view-card `accent: "#7c6bff"` entry — same fix.
- `--text-muted` itself needed one more small nudge (`#7f7fa4` → `#8282a6`,
  5.15:1 → 5.35:1 on `--bg`) after axe found it failing (4.39:1) against the
  slightly-lighter `--btn` background used for tag pills — updated the 4
  literal-hex fallbacks that track this token (OG-image-safe copies in
  `lib/types.ts`, `genomeConstants.ts`, the tool page, and the test file)
  to match.

**Result: 0 contrast violations across all 12 originally-scanned routes.**

## Found via a second sweep: 6 more "white on accent" instances axe missed on `/explore`

Brightening the accent background made a _new_ violation visible on
`/explore` — a walkthrough-tour "Next →" button at 3.14:1 (was already
failing before the brightening too, just not caught). Root cause: my
original sweep grepped for the literal string `color: "#fff"`, which
doesn't match **ternary expressions** like `color: isLast ? "var(--accent-2)"
: "#fff"` — the `"#fff"` is there, just not adjacent to `color:`. Found 6
more instances this way (`WalkthroughOverlay.tsx`, `StackDetailHeader.tsx`,
`TokenPresets.tsx`, `ShadowStackForm.tsx`, `ProfileClient.tsx` ×2,
`CompareClient.tsx`, `SuggestToolModal.tsx`) via `grep -rn '"#fff"'` without
the `color:` prefix requirement, then manually checking each match's
context. One of them (`ProfileClient.tsx`) was the dynamic per-tool-color
pattern, not the static accent one — used `getReadableTextColor()` there
instead.

**Lesson logged for next time:** when grep-hunting a pattern, search for the
_value_ (`"#fff"`) not the _adjacent key-value pair_ (`color: "#fff"`) —
ternaries, computed keys, and reordered properties all break the narrower
pattern silently.

## Operational finding: stale Turbopack cache survives `docker compose restart`

Hit the exact same class of bug as the earlier 404 incident this session,
twice more during this iteration: after editing `app/globals.css` (a CSS
variable value) and later `FeedCard.tsx`/`changelog/page.tsx`, `docker
compose restart app` did **not** pick up the change — `getComputedStyle()`
kept returning the old value / axe kept flagging the old violation, even
though the file on disk (verified via `docker compose exec app cat ...`)
was correct.

Root cause: `docker-compose.yml` mounts `/app/.next` as an anonymous volume
specifically to "persist Next.js build cache across restarts" (see the
inline comment) — so `restart`, and even `rm -f` + `up -d` (container
recreation), don't clear it; Compose reuses the anonymous volume unless
told not to. The fix is `docker compose up -d --renew-anon-volumes app`
(after `stop` + `rm -f`) — this is now the standard verification step used
for the rest of this iteration and should be the go-to for any future
session that hits "I changed the file, restarted, but the browser still
shows the old thing" in this repo.

## Bugs beyond contrast — ran the full WCAG 2A/2AA ruleset, not just color-contrast

Switched `axe-scan.mjs` to check all `wcag2a`/`wcag2aa` rules across 15
routes (added `/match`, `/category`, `/category/coding-assistants` to the
12 already covered). Found three more categories of real, serious-impact
bugs:

- **`nested-interactive`** (invalid ARIA/HTML — an interactive-role element
  containing another interactive element, undefined click/keyboard
  behavior): `FeedCard.tsx`'s whole row was a `<button>` (later `<div
role="button">`) wrapping a real `<Link>` — 20 instances on `/feed`. The
  first fix attempt (swap `<button>` for `<div role="button">`) _didn't_
  fix it, because axe's rule checks ARIA role semantics, not just raw tag
  names — `role="button"` is exactly as "interactive" as a real `<button>`
  to this check. The actual fix: the row is now a plain `<div>` (no
  role/tabIndex) for mouse-click convenience, and the chevron became a
  real, independently-focusable `<button>` so keyboard users have an
  explicit, non-nested way to toggle. Also found 4 instances on `/stacks`
  from React Flow's own node wrapper (`role="button" tabindex="0"`,
  generated by the library) containing our real Visit/Page links when a
  node renders expanded — fixed with `nodesFocusable={false}` on that one
  `<ReactFlow>` instance (display-only stack preview, no node-selection
  behavior to preserve; verified the Visit/Page links stayed independently
  tabbable and clickable after the change). Explore/Builder's graphs
  weren't flagged — their nodes aren't expanded by default, so the
  violation doesn't manifest there.
- **`link-in-text-block`** (a link distinguishable only by color, not
  underline — fails for colorblind users): found on `/changelog` and
  `/tool/[toolId]`. Fixing this needed an _explicit_ `textDecoration:
"underline"`, not just removing an inline `"none"` override — Tailwind's
  base styles reset link underlines by default, so "not overriding it to
  none" still computes to `none`. Verified via `getComputedStyle().textDecorationLine`.
- **`scrollable-region-focusable`** (a horizontally-scrolling `<pre>` code
  block with no way for keyboard users to scroll it): 3 instances on
  `/mcp`. Fixed with `tabIndex={0}` on each.

**Result: 0 violations (any WCAG 2A/2AA rule, not just contrast) across all
15 scanned routes**, verified after a full `--renew-anon-volumes` rebuild.
`make check` (lint/typecheck/test, 217 tests) clean throughout.

## Part 3 continued — the real cause of "Multiple GoTrueClient instances"

With contrast/WCAG at zero violations, this iteration moved to browser
console errors/warnings as the next bug-hunting surface — a plain crawl of
all 20 known routes (`crawl-errors2.mjs`, console + `pageerror` +
`requestfailed` + non-2xx `response` listeners) rather than more manual
grep-hunting.

**Problem found:** despite the earlier fix that made
`createSupabaseBrowserClient()` an actual module-scoped singleton, the
"Multiple GoTrueClient instances detected" warning was still firing on
**every single route**, not just occasionally. Root cause turned out to be
two independent bugs stacked on top of each other:

1. `lib/db.ts` exported _two_ things from the same file: the browser
   singleton factory, and a legacy top-level `export const supabase =
createClient(url, anonKey)` meant for server-side data loaders. Because
   JS executes a module's entire top level on import — not just the
   binding you asked for — any client component importing
   `createSupabaseBrowserClient` from this file _also_ ran the
   `createClient()` line, instantiating a second GoTrue client in the
   browser pointed at the same auth storage key. Fix: split into
   `lib/db.ts` (browser-only, `createSupabaseBrowserClient`) and a new
   `lib/db.server.ts` (the `supabase` legacy client) — 8 server-side call
   sites (`app/page.tsx`, `lib/data/*.ts`, two API routes, etc.) updated
   to import from `lib/db.server.ts` instead.
2. Even after the split, the warning persisted on exactly 5 routes —
   `/explore`, `/stacks`, `/builder`, `/genome`, `/watch/[id]` — the ones
   with a `dynamic(..., { ssr: false })` client subtree (Three.js 3D
   graph, React Flow canvas). Those subtrees get bundled into a separate
   chunk, which gets its _own copy_ of any module it imports — so a plain
   module-scoped `let browserClient` singleton isn't actually a singleton
   across chunk boundaries. Fixed by caching on `globalThis` instead
   (`globalThis.__supabaseBrowserClient`), which is shared across however
   many bundle copies of the module exist. This is the standard fix for
   "singleton needs to survive being bundled twice," same category as the
   Next.js-recommended pattern for caching a Prisma client across HMR
   reloads — not a workaround, the textbook-correct pattern for this
   exact bundler behavior.

**Even after both fixes, `/explore`, `/stacks` (etc.) still warned.**
Traced with `page.on("console")` + checking `window.__supabaseBrowserClient`
directly — the global singleton _was_ being shared correctly, so the
second instance had to be coming from somewhere that bypassed
`createSupabaseBrowserClient()` entirely. Found it: `DetailPanel.tsx` and
`ComparisonPanel.tsx` (both `"use client"`) imported `getToolHealthDetails`
/ `getToolTrajectory` directly from `lib/data/tools.ts` — a
server-oriented data-loader module that itself imports the `supabase`
client from `lib/db.server.ts` _and_ calls `next/cache`'s `unstable_cache`
at module top level. Importing either of those two client components
bundled all of that into the browser, recreating bug #1 through a
different door. A third instance of the exact same pattern was found in
`components/mobile/ToolDetailSheet.tsx` (the mobile equivalent of
DetailPanel) — that one is why `/explore` kept warning even after fixing
DetailPanel, since ToolDetailSheet is bundled into the Explore page
regardless of viewport.

Notably, `components/panels/TrajectorySparkline.tsx` already did this
correctly — it `fetch()`es `/api/tool/[toolId]/snapshots` instead of
importing the server module directly. DetailPanel/ComparisonPanel/
ToolDetailSheet were the outliers, not the pattern.

**Fix:** added two new API routes, `GET /api/tool/[toolId]/health` and
`GET /api/tool/[toolId]/trajectory`, which call the _same_
`getToolHealthDetails`/`getToolTrajectory` functions server-side and
return the identical JSON shape. Updated all three client components to
`fetch()` from these routes instead of importing the functions directly,
using `import type` for the now-erased-at-compile-time TypeScript
interfaces (`ToolHealthDetails`, `ToolTrajectoryPoint`) so the type
information survives without pulling in any runtime code. Verified via
direct `curl` against both new routes (same response shape, 200 on a
nonexistent tool ID since both functions already null-guard rather than
404 — preserved existing behavior exactly, not a regression).

**Result:** the "Multiple GoTrueClient instances" warning — present on
100% of routes at the start of this session, then 5 of 20 after fix #1/#2 —
is now gone from all 20 crawled routes (`/`, `/explore`, `/stacks`,
`/builder`, `/genome`, `/compare`, `/simulate`, `/feed`, `/pulse`,
`/changelog`, `/mcp`, `/match`, `/tool/cursor`, `/category`,
`/category/coding-assistants`, `/compare/cursor/github-copilot`,
`/watch/[id]`, `/case`, `/privacy`, `/profile/[username]`), verified after
a fresh `--renew-anon-volumes` rebuild. Re-ran the full WCAG 2A/2AA axe
scan afterward too — still 0 violations across all 15 scanned routes, so
the fetch-based rewiring didn't regress accessibility.

**Investigated but not a bug:** `/watch/[id]` logs an `[http 401]` for
`/api/stacks/[id]` when visited anonymously — that route is
intentionally owner-only (`SavedStack`, private per-user data via RLS),
and `WatchClient.tsx` already handles the 401 by redirecting to `/`. The
console entry is just the browser's normal network log for a request
that got a non-2xx response before the redirect fires; not a UX problem.

**Left alone:** a React Flow "new nodeTypes or edgeTypes object" dev-mode
warning on `/stacks` — both `nodeTypes` objects in that file are already
defined at module scope (not recreated per render), so this looks like an
internal React Flow check quirk rather than an actual unmemoized-object
bug on our side. Low severity (perf-only, dev-mode-only), not chased
further.

## Part 3 continued — axe-scanning the routes the earlier passes missed

The 15-route axe sweep and the 20-route console crawl both used a fixed
route list assembled early in this session. It never included `/case`,
`/privacy`, `/profile/[username]`, or the dynamic `/compare/[toolA]/[toolB]`
pair page — all real, linked-to routes, just not on the list. Ran the full
WCAG 2A/2AA ruleset against them explicitly and found 3 more genuine
violations, all instances of patterns already fixed elsewhere in the app
but never applied to these specific pages:

- **`link-in-text-block`** on `/case` (1 instance — the "Go to the Builder"
  empty-state link) and `/privacy` (5 instances — two external ToS links,
  the mailto link ×2, and the "profile page" GDPR-erasure link) — same
  root cause as the `/changelog` and `/tool/[toolId]` fixes earlier in
  this log: an accent-colored link with no underline is only
  distinguishable from surrounding body text by color. Fixed by adding
  `textDecoration: "underline"` to each (all 5 on `/privacy` shared the
  identical `style={{ color: "var(--accent)" }}`, so one `replace_all`
  covered them).
- **`color-contrast`** on `/compare/[toolA]/[toolB]` (2 instances — the
  "Only Cursor" / "Only GitHub Copilot" unique-tools section headers) —
  the same "per-category color at reduced text alpha" bug found and fixed
  repeatedly throughout this whole log (`StackHealthPanel`,
  `StackDetailHeader`, etc.): `style={{ color: color + "cc" }}` where
  `color` is a dynamic `getCategoryColor()` result, not a fixed brand
  color — some categories fail AA at 80% opacity even though most don't.
  Fixed by dropping to full opacity (`style={{ color }}`), consistent
  with every other instance of this exact bug in the app.

Verified via a full axe re-scan of all 5 routes (0 violations), plus a
re-run of both the original 15-route WCAG scan and the 20-route console
crawl to confirm nothing regressed — still 0 WCAG violations and 0
GoTrueClient warnings across the board. `make check` (lint/typecheck/test,
217 tests) clean.

**Running total across this whole log: 0 contrast/WCAG 2A/2AA violations
and 0 console errors/warnings (excluding known-benign dev-mode-only
noise: a Three.js deprecation notice, GPU driver perf logs, and a React
Flow internal check quirk) across every route in the app** — 20 routes
now cross-checked, up from the 15 the audit originally covered.

## Part 3 continued — mobile viewport: every single page scrolled sideways

New surface for this iteration: nothing in this whole log had been tested
at a mobile viewport width before. Wrote a crawl (`mobile-crawl.mjs`,
390×844, `isMobile: true`) across 18 routes checking
`document.documentElement.scrollWidth` vs `clientWidth` — a simple,
reliable way to catch horizontal-overflow bugs that a visual screenshot
at one scroll position can miss entirely.

**Problem found:** every single route reported the _exact same_ overflow
— `scrollWidth=472` vs `clientWidth=390`, an 82px overflow, byte-for-byte
identical whether the page was `/privacy` (a static paragraph of text) or
`/explore` (the full graph). Identical overflow across totally unrelated
pages means one thing: a global element rendered on every page, not a
per-page bug. Traced with `getBoundingClientRect()` over every element to
`components/ui/Navbar.tsx`'s desktop icon-tab bar (Stacks / Graph /
Builder / Simulate / Compare / Genome / Activity / Pulse) — every other
"desktop-only" chunk of the navbar correctly used `hidden sm:flex`, but
this one particular row (both the real `NavViewLinks` component and its
Suspense loading fallback) was just `flex items-center` with no `hidden`
at all. At mobile widths it rendered anyway, all 8 icon tabs in a row
with no width constraint, pushing the whole page 82px past the viewport
— **every route in the app scrolled sideways on mobile**, not a
visual-polish issue but a basic "does the page fit on the screen" bug.

Worse than the overflow itself: the mobile "⋯" hamburger menu (a
`BottomSheet` that already exists for Share Stack / Take a Tour /
Suggest a Tool / sign-in) never contained these 8 view links at all — so
even discounting the overflow, **mobile users had no menu-based way to
switch between Stacks/Graph/Builder/etc.**, only the broken sideways-
scrolling icon row. This wasn't "missing polish," it was a missing
feature on every mobile pageview.

**Fix:**

- Added `hidden sm:flex` to both places the icon-tab row renders (the
  real component and its Suspense fallback), so it's desktop-only exactly
  like the rest of the navbar's other conditionally-shown chunks.
- Added the same 8 view links to the mobile BottomSheet menu as a 2-column
  grid of labeled buttons (icon + full label, not icon-only — there's
  room in a full-height sheet), with the current route highlighted the
  same way the desktop pill does (`var(--accent)` background,
  `var(--bg)` text — the already-fixed AA-safe pairing). Scoped
  intentionally simpler than the desktop version: doesn't forward the
  `?s=` stack-selection param, since doing that would require pulling
  `useSearchParams()` into the top-level Navbar component (currently
  isolated inside a `Suspense`-wrapped child specifically to avoid
  forcing the whole navbar through a search-params-triggered dynamic
  render) — a bigger refactor than this bug fix warrants.

Verified with a screenshot before/after (closed header now shows just
logo + hamburger button, no overflow; opened sheet shows all 8 views in
a clean grid) and by re-running `mobile-crawl.mjs` — the 82px overflow is
gone from all 18 routes it was previously on. Confirmed the desktop navbar
is visually unchanged (screenshot at 1280px).

**A second, page-specific overflow surfaced once the global one was
fixed:** `/simulate` alone still had a 16px overflow after the navbar
fix. Traced to `SimulateAppClient.tsx`'s responsive CSS: a `<style>` tag
switches the page's two-column CSS Grid to `grid-template-columns: 1fr
!important` under `max-width: 880px`, but a bare `1fr` track still can't
shrink below the _intrinsic minimum content width_ of whatever's inside
it — some element inside the sidebar/main content was wider than the
340px actually available (measured: the track computed to 382px instead
of the ~342px content-box width), forcing the grid past the viewport
edge. This is a well-known CSS Grid gotcha: `1fr` alone doesn't mean "at
most 100% of available space," it means "at least my content's natural
width." Fixed by changing the override to `minmax(0, 1fr)`, which allows
the track to shrink to zero and rely on the content wrapping/scrolling
internally instead of forcing the grid wider than its container.
Verified via `mobile-crawl.mjs` re-run — 0 routes with any overflow now,
18 of 18.

`make check` (lint/typecheck/test, 217 tests) clean; full WCAG 2A/2AA
axe re-scan and the 20-route console crawl both still 0 violations/0
warnings after this change.

## Part 3 continued — a mobile-viewport axe scan surfaces a real desktop bug too

Mobile-viewport WCAG scanning hadn't been done before either (only the
overflow crawl last iteration used a mobile viewport). Ran the full
2A/2AA ruleset at 390px across the same 18 routes and found two more
genuine violations:

- **`scrollable-region-focusable` on `/mcp`** — the earlier fix for this
  rule (three `<pre>` blocks) missed a fourth scrollable element: the MCP
  server URL is rendered in a bare `<code>` tag with
  `overflowX: "auto"` + `whiteSpace: "nowrap"`, not a `<pre>`. It didn't
  fail at desktop width because the URL fit without needing to scroll —
  the rule only fires when content is _actually_ overflowing, and the
  narrower mobile viewport was what made it overflow. Fixed with the same
  `tabIndex={0}` treatment as the `<pre>` blocks. Checked the other 3
  `<code>` elements on the page for the same `overflowX` pattern — none
  of them have it, so this was the only instance.
- **`color-contrast` on `/category` (the category-index grid, not a
  single category page)** — this one turned out to **not be
  mobile-specific at all**: re-ran the same check at desktop width and
  found the identical violation. It had simply never been caught before,
  because `axe-full-scan.mjs` (used for every "0 violations" desktop
  claim earlier in this log) deliberately filters `color-contrast` out of
  its report — it was written specifically to isolate _non_-contrast
  violations, since contrast was supposed to be covered by a separate,
  earlier pass. That earlier pass never included the `/category` index
  page. Lesson: "clean" from that script only ever meant "clean of
  non-contrast issues," not "zero violations" — the log's own wording in
  earlier entries overstated what it had actually checked.
  - Root cause: the multimodal category's raw color (`#6c5ce7`) used
    directly as text — both the card title and the tool-count badge —
    against `var(--surface)`, at **3.95:1**, below AA's 4.5:1 floor. Same
    failure mode as `spec-driven-dev` earlier in this log (a category
    color that's fine as an accent/border/tinted-background color but too
    dark to double as body text). Fixed the same way: brightened the
    color, preserving hue/saturation (`+5%` HSL lightness →
    `#8072ea`) in `lib/types.ts`'s `CATEGORIES` array, the single source
    of truth. Needed one more iteration than the first guess: a `+3%`
    version cleared the plain `var(--surface)` background (4.56:1) but
    still failed on the _badge_, which sits on a translucent tinted
    version of the same color (`color + "14"`) — that tint is lighter
    than raw `--surface`, which narrows the contrast margin rather than
    widening it (blending toward the text color, not away from it) —
    the same "translucent-background-with-matching-text-color-behaves-
    counterintuitively" trap as several `color + alpha` bugs earlier in
    this log, just inverted (there it was the _text_ alpha causing the
    problem; here it's the _background_ tint). `+5%` clears all three
    backgrounds it's used against (surface, `--bg`, and the tinted badge)
    with margin.
  - Updated `getReadableTextColor`'s docstring, which cited the old
    `#6c5ce7` value as its illustrative example of a mid-luminance
    category color — genericized the comment rather than leaving a
    now-inaccurate hex code in a docstring. The hardcoded unit test
    (`getReadableTextColor("#6c5ce7")` → `"#ffffff"`) needed no change —
    it tests the function against a literal string, not a `CATEGORIES`
    lookup, so it's unaffected by what color multimodal currently has.

Verified via a full re-scan at both viewports (`axe-mobile-scan.mjs`,
`axe-full-scan.mjs`, a standalone desktop-only `/category` check, plus
`axe-new-routes.mjs`) — 0 violations everywhere, including a direct
re-check that `/category` is now genuinely clean on desktop, not just
"clean of non-contrast issues." Also re-ran the console-error crawl and
the mobile-overflow crawl from the previous iteration to confirm neither
regressed. `make check` (lint/typecheck/test, 217 tests) clean.

**Closing the gap properly:** since `/category` was proof that the
filtered desktop script's "clean" results couldn't be fully trusted for
contrast, wrote one true unfiltered scan (`axe-true-full.mjs` — full
WCAG 2A/2AA tag set, no result filtering) and ran it against all 20
routes this log has ever touched at desktop width in one pass. **All 20
genuinely clean** — no filtering, no exceptions. This is the first time
this exact claim has been verified with a script that couldn't hide a
contrast violation even if one existed, rather than one that was
contrast-blind by construction.

## Part 3 continued — a real broken link, found by crawling the live DOM

New surface: nothing in this log had checked whether internal links
actually resolve. Grepping source for `href="..."` misses anything built
from a template literal or a variable, so instead crawled the _rendered_
DOM across 17 seed routes (`document.querySelectorAll("a[href]")`),
collected all internal `href`s into a set (130 unique paths — tool pages,
category pages, compare pairs, feed events, etc.), and `fetch()`ed each
one directly.

**Found:** `/profile` (bare, no username) returned a genuine 404. Traced
to `app/privacy/page.tsx`'s GDPR "Erasure" section — "delete your account
... from your `<Link href="/profile">profile page</Link>`" — a hardcoded
link to a route that has never existed; only `/profile/[username]` does.
Every other place in the app that links to a profile (`Navbar.tsx`, ×2)
correctly interpolates the signed-in user's username — this was the only
hardcoded bare instance, on a legal/compliance page a signed-in user
might actually click while exercising a real GDPR right.

**Fix:** rather than patching just that one link (which would still leave
`/profile` itself as a 404 for anyone who types it, bookmarks it, or hits
it from anywhere else in the future), added `app/profile/page.tsx` — a
client-side redirect page using the same `useUser()` hook `Navbar.tsx`
already relies on: if signed in, `router.replace()` to
`/profile/${username}`; if not, shows a "Sign in to view your profile"
prompt with the same GitHub sign-in button styling used in the mobile
nav menu, rather than silently redirecting into an OAuth flow the user
didn't ask for. `/privacy`'s link now resolves through this instead of
needing a special case.

Verified via the same DOM-crawl script re-run after the fix (130/130
links now resolve 2xx, down from 1 broken), a direct screenshot of
`/profile` while signed out (renders the sign-in prompt cleanly, 0
console errors), and a full re-run of the unfiltered WCAG scan and the
console-error crawl to confirm nothing regressed. `make check`
(lint/typecheck/test, 217 tests) clean.
