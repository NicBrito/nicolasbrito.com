---
module: stack
status: ALWAYS ACTIVE — PROJECT SPECIFIC (nicolasbrito.com)
load: every agent operating in this repository
summary: nicolasbrito.com specifics — Next.js 16 App Router, next-intl en/pt parity, Apple motion system, existing UI primitives, docs protocol.
---

# Repository Context — nicolasbrito.com

> Canonical source. This is the only repo-specific rule module; always relevant here.

* **Architecture & Flow:**
  * Framework: Next.js 16.1 (App Router), TypeScript, Tailwind v4.
  * i18n Routing: Managed by `next-intl`. ALL text must exist in `src/messages/en.json` and `pt.json`. NEVER hardcode strings. Use `useTranslations("Namespace")`.
  * Directory Constraints: Localized routes in `src/app/[locale]/`, shared utils in `src/lib/`, UI primitives in `src/components/ui/`.
* **Motion & Physics (Apple Design System):**
  * Framer Motion is the standard. Use constant durations with custom `cubic-bezier` easing (e.g., `[0.2, 0, 0.2, 1]` for entry).
  * NEVER use default springs. Do not animate layout properties directly; use `transform` via `useTransform` to offload to the GPU.
  * Always use `<AnimatePresence mode="popLayout">` to prevent layout thrashing.
* **Component Library Status (DO NOT RECREATE):**
  * Existing Primitives: `PrimaryButton`, `SecondaryButton`, `Container`, `MorphingLabel` (letter-by-letter animation), `ProjectCard`, `SocialLink`.
  * Before generating new UI elements, verify if these primitives can be extended or utilized.
* **Documentation Protocol:**
  * System architecture and component details are maintained in English within the `docs/` directory (e.g., `docs/Foundation.md`, `docs/Navbar.md`). You MUST review these files before refactoring corresponding components.
