# nicolasbrito.com

Personal portfolio of Nicolas Brito — a bilingual (English / Portuguese),
motion-rich single page built with the Next.js App Router.

## Tech stack

- **Next.js 16** (App Router) + **React 19**
- **TypeScript** (`strict`)
- **Tailwind CSS v4** (CSS-first config in [`src/app/globals.css`](src/app/globals.css))
- **next-intl** for i18n routing and messages
- **Framer Motion** for the Apple-inspired motion system
- **Vitest** + **Testing Library** for unit tests

## Getting started

```bash
npm install
npm run dev
```

The dev server runs over HTTPS (`next dev --experimental-https`). Open
[https://localhost:3000](https://localhost:3000) — it redirects to the default
locale (`/en`).

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the dev server (experimental HTTPS) |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint (`eslint-config-next`) |
| `npm run test` | Run the Vitest suite once |
| `npm run test:watch` | Vitest in watch mode |
| `npm run test:coverage` | Vitest with V8 coverage |
| `npm run clean` | Remove `node_modules`, `.next`, `coverage` |

A Husky `pre-commit` hook runs `npm test`, and `commit-msg` enforces
[Conventional Commits](https://www.conventionalcommits.org/).

## CI

Every pull request and every push to `main` runs the full verification chain — `lint` → `type-check` → `test` → `build` — on GitHub Actions (`.github/workflows/ci.yml`). The `main` branch stays green by construction because a red check blocks the merge. Local Husky hooks are the first line of defense; CI serves as the non-bypassable backstop. Node is pinned via `.nvmrc` (24).

## Project structure

```
src/
  app/[locale]/      Localized routes (layout + page)
  app/globals.css    Tailwind theme + design tokens
  components/
    home/            Page sections (Hero, ProjectsSection, GamesSection)
    home/games/      Games carousel internals (constants, hooks, sub-components)
    layout/          Navbar, HamburgerMenu, ScrollProgress
    ui/              Reusable primitives (Buttons, Container, ProjectCard, …)
  i18n/              next-intl routing + request config
  lib/               Shared utilities, hooks, and assets
  messages/          en.json / pt.json translation catalogs
  proxy.ts           next-intl middleware (locale negotiation)
```

## Internationalization

Locales are defined once in [`src/i18n/routing.ts`](src/i18n/routing.ts)
(`en`, default; `pt`). Every user-facing string lives in
[`src/messages/en.json`](src/messages/en.json) and
[`src/messages/pt.json`](src/messages/pt.json) — never hardcode copy; use
`useTranslations("Namespace")`.

## Conventions & docs

- Engineering directives: [`.ai/constitution.md`](.ai/constitution.md)
- Component documentation: [`docs/`](docs/)

## PWA & metadata

PWA icons (`apple-touch-icon.png`, `icon-192x192.png`, `icon-512x512.png`) are committed in `public/` and referenced in `site.webmanifest`.
