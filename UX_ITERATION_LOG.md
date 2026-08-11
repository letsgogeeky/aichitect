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
