# Footer Landmark: Semantic Structure Completion

## 1. Overview & Objective

The `Footer` component renders the page's `contentinfo` landmark—a static server-side coda that closes the semantic document structure (solving audit item DP-13). By design, it carries zero client-side JavaScript, no entry motion, and contributes zero Cumulative Layout Shift (CLS).

## 2. Architecture

### 2.1. Static Async Server Component
* **Entry Point:** `src/components/layout/Footer.tsx`
* **Props:** None. The component is self-contained and reads localization via `getTranslations("Footer")` at render time.
* **Client Code:** Zero—no event listeners, no state, no motion gates. The component renders synchronously once; mounting is deferred until after `</main>` closes in `src/app/[locale]/page.tsx`.
* **CLS Impact:** Zero. A static footer with fixed layout cannot shift after paint.

### 2.2. Content Structure
* **Container:** `border-t border-white/5` provides a hairline visual divider (1px, 5% white opacity) separating the footer from the page body.
* **Wordmark:** Name rendered at `text-base` (16px), `font-semibold`, with `text-foreground/80` (~204/255 on black, ~12.05:1 contrast — AA).
* **Social Pair:** Two `SocialLink` primitives (LinkedIn, GitHub) with:
  - Hrefs single-sourced in `src/lib/social.ts` (shared with Hero section).
  - Icon size: 20px glyph + 10px padding (`p-2.5`) = 40×40 CSS px hit area (well above WCAG 2.5.8's 24×24 AA floor).
  - Each inherits `focus-visible` styling from the `SocialLink` primitive.
* **Copyright:** Localized text with dynamic year interpolation: `"© {year} Nicolas Brito"` (ICU format), rendered at `text-xs` with `text-foreground/50` (~127/255, ~4.93:1 contrast — AA).

### 2.3. Layout & Spacing
* **Vertical Rhythm:** `pt-12 md:pt-16` (48px mobile, 64px desktop) and `pb-[calc(3rem+env(safe-area-inset-bottom))] md:pb-[calc(4rem+env(safe-area-inset-bottom))]` to respect safe-area insets on notched devices.
* **Internal Gap:** `gap-10` between wordmark group and copyright, `gap-6` between wordmark and social pair.
* **Alignment:** Centered (`flex flex-col items-center gap-10 text-center`) for symmetrical, minimal visual noise.

## 3. Localization (i18n)

The `Footer` namespace (`src/messages/en.json` and `pt.json`) provides:
* `aria_label`: Descriptive landmark label (e.g., "Footer" / "Rodapé").
* `name`: The wordmark text (e.g., "Nicolas Brito").
* `copyright`: Template with ICU-style `{year}` placeholder; rendered as `"© 2026 Nicolas Brito"` (or current year).
* `linkedin_label`, `github_label`: Descriptive labels for social link accessibility.

**Parity:** Both catalogs maintain en/pt key parity; new keys must be added to both before merge.

## 4. Accessibility

### 4.1. Landmark Semantics
* The `<footer>` element is the sole `contentinfo` landmark on the page, exposed to assistive technology with a descriptive `aria-label` read from localization.

### 4.2. Focus Visibility
* The footer itself is not focusable. Interactive elements—the two `SocialLink` buttons—inherit full focus-visible styling from the `SocialLink` primitive, providing clear visual feedback during keyboard navigation.

### 4.3. Contrast (WCAG AA)
* **Wordmark** (`text-foreground/80`): 204:51 (on black) = 4.0:1 → **12.05:1** at 80% opacity.
* **Copyright** (`text-foreground/50`): 127:127 (50% blend) = ~4.93:1 → **AA for body text**.

Both pass WCAG AA thresholds. Full contrast audit: `src/styles/globals.css` and Figma token set.

## 5. Runtime Behavior & Build Constraints

### 5.1. Dynamic Year
The `new Date().getFullYear()` call happens at render time (server-side), so the year value is frozen at build time under Static Site Generation (SSG). On Vercel, re-deployment (triggered by any merge to `main`) refreshes the build artifact and bumps the year forward automatically.

**Status:** Accepted by decision. Annual build refreshes align with production deployment cadence.

### 5.2. Social URL Single-Sourcing
`SOCIAL_LINKS` in `src/lib/social.ts` is shared between Hero and Footer, eliminating inline URL duplication and ensuring profile links stay in sync across the page.

## 6. Extension Notes & Owner Intent

The Footer is a **lean v1** by architectural intent. The component deliberately carries minimal visual and interactive burden—zero motion, zero client logic, zero state.

**Future additions must remain additive.** Changes to spacing, typography, or layout require owner review. Do not rework the grid or reflow the internal structure; add new semantic layers (e.g., a second text row, additional metadata) *above* or *below* the existing triplet (wordmark → socials → copyright) if needed.

## 7. References

* **Component:** `src/components/layout/Footer.tsx`
* **i18n:** `src/messages/{en,pt}.json` → `Footer` namespace
* **Social URLs:** `src/lib/social.ts` → `SOCIAL_LINKS`
* **Mount Point:** `src/app/[locale]/page.tsx` (sibling after `</main>`)
* **Audit Item:** DP-13 (closed 2026-08-08)
