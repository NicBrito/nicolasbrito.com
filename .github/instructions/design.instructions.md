---
applyTo: "src/components/**,src/app/**/*.tsx,src/app/**/*.css"
description: Design system rules — hierarchy, 8-point grid, typography, interactive states, theming, glassmorphism, WCAG AA.
---

Apply [`.ai/rules/design.md`](../../.ai/rules/design.md) (canonical) when editing UI: clear
visual hierarchy; 8-point (or 4-point) grid for all spacing; ≤ 6 font sizes; semantic CSS
variables from `globals.css` only (no hardcoded hex); define every interactive state
(default/hover/active/disabled/focus); glassmorphism + squircles; verify WCAG AA contrast and
precise `aria-label`s. Dark mode conveys depth via lighter surfaces, not shadows.
