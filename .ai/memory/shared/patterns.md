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

`PrimaryButton`, `SecondaryButton`, `Container`, `MorphingLabel`, `ProjectCard`,
`SocialLink`. Check these before creating any new UI element.
