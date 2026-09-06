# Recurring Patterns

Verified, reusable conventions. Match these instead of inventing new ones. Each entry
cites where it lives so agents can confirm before relying on it.

---

## Styling — semantic tokens only (`src/app/globals.css`)

* Tailwind v4, CSS-first via `@theme`. Colors are semantic CSS variables on `:root`
  (`--background`, `--foreground`, `--accent`, `--surface`, `--card`, plus carousel
  chrome vars like `--glass-surface`, `--carousel-fill`). **No hardcoded hex in
  components** — reference the token.
* Glassmorphism via the `.glass` utility: `bg-background/80 backdrop-blur-xl
  border-b border-foreground/10`.
* Pointer/capability theming uses `.touch-*` utilities gated by
  `@media (hover: hover) and (pointer: fine)` vs `(hover: none), (pointer: coarse)` —
  not viewport-width breakpoints alone.

## Class composition — `cn()` (`src/lib/utils.ts`)

`cn(...inputs)` = `twMerge(clsx(inputs))`. Use it for every conditional/merged className;
do not concatenate class strings by hand.

## Motion — constant-duration Framer Motion (`src/lib/animations.ts`)

* Durations are constants, not springs, e.g.
  `morphingLabelSpeed = { default: { animate: 0.2, exit: 0.15 }, fast: { ... } } as const`.
* Custom `cubic-bezier` easing (e.g. `[0.2, 0, 0.2, 1]`). Animate `transform` (GPU), never
  layout properties. Wrap exit/enter in `<AnimatePresence mode="popLayout">`.
* **Ref mirroring lesson (Wave 4, 2026-09-06):** before mirroring reactive state into a ref for an insertion-effect subscriber (like framer's `useMotionValueEvent`), check the subscriber's effect phase. `useLiveRef` writes in a passive effect, which runs strictly *after* commit — too late for an insertion-effect consumer whose callback is already subscribed with stale deps. Write to the ref at measurement time instead (synchronously or in `useLayoutEffect`). This matters for `ScrollProgress.tsx`, `GamesSection.tsx`, and `useCarouselAutoplay.ts`.

## Testing — deterministic Vitest (`src/**/*.{test,spec}.{ts,tsx}`)

* Config: jsdom env, `globals: true`, setup at `src/tests/setup.ts`, v8 coverage.
* Hooks tested with `renderHook` against a detached DOM node; spies via `vi.fn`.
* Time is controlled: `vi.useFakeTimers()` + `vi.setSystemTime(ms)` (see
  `useCarouselWheel.test.ts`). Private timing constants are mirrored locally in the test
  so it "fails loudly" if the source constant is retuned.

## i18n — `useTranslations("Namespace")` (`src/messages/{en,pt}.json`)

Every string is a key present in **both** catalogs. Adding/removing a key in one locale
requires the same change in the other.

## Components — extend the existing primitives first (`src/components/ui/`)

Extend existing primitives before creating anything new — check this index first.

* `src/app/[locale]/` — routes: `layout.tsx` (shell/metadata), `page.tsx` (home
  composition: Navbar → sections → Footer).
* `components/home/` — `Hero`, `ProjectsSection`, `GamesSection` (+ `games/`).
* `components/layout/` — `Navbar`, `HamburgerMenu`, `ScrollProgress`, `Footer`.
* `components/ui/` — primitives: `PrimaryButton`, `SecondaryButton`, `Container`,
  `MorphingLabel`, `ProjectCard`, `SocialLink` — extend first, never recreate.
* `src/lib/` — `utils` (`cn`), `animations`, `assets`, `site` (`SITE_URL`), `social`
  (`SOCIAL_LINKS`), `security-headers`, `hooks/`.
* `src/messages/` — `en`/`pt` catalogs, all copy, parity — plus `src/i18n/` (`routing`,
  `request`).

## Security surface (`next.config.ts`, `src/proxy.ts`)

Today the site is a static bilingual export with **no input boundaries**: `src/proxy.ts` is a
thin `createMiddleware(routing)` over the closed `['en','pt']` allow-list (no open-redirect),
and there are no route handlers or `use server` actions. **CSP now present** in next.config.ts,
**env-aware**: `script-src` MUST include `'unsafe-inline'` (Next streams the RSC payload via inline
`<script>` tags; SSG mints no per-request nonce) — a bare `script-src 'self'` blocks hydration and
renders the page all-black. Dev additionally needs `'unsafe-eval'` + `connect-src ws: wss:` for
Turbopack HMR; prod adds `upgrade-insecure-requests`. `style-src 'unsafe-inline'` is for Framer
inline styles. **Always render-test a CSP in a browser, not just curl the header.** **Residual:** SEC-3 escalated 2026-09-06 — `npm audit` reports 9 vulns (1 moderate, 8 high) in `next@16.2.9` and dependencies. Postcss (range ≤8.5.22) and sharp remain build-time only, unreachable: empty `images.remotePatterns`/`domains` blocks all remote URLs. Re-audit the moment a route handler, form, or server action lands.

## Contrast caveat (`--accent` #2997ff, `--accent-strong` #0071e3)

* `--accent` (#2997ff) as **text on dark background** passes AA (≈6.96:1). Reserved for accent-as-text contexts.
* **White text on accent fills** now use `--accent-strong` (#0071e3) — measured 4.70:1 rest / 5.57:1 at /90 hover (AA pass). Use for button labels and any white-on-accent scenario. PrimaryButton filled variant uses this token.
