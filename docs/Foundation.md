# Project Foundation Summary: nicolasbrito.com

## 1. Overview & Objective
Complete UI reconstruction strictly adhering to the **Apple Design System** (extreme minimalism, San Francisco/Inter typography, Bento Grids, Glassmorphism, and Micro-interactions). The project is built upon a "Bleeding Edge" technical infrastructure, following Senior Software Engineering standards.

## 2. Tech Stack (Implemented)
* **Core Framework:** Next.js 16.1.0 (App Router / Turbopack).
* **Language:** TypeScript (Strict Mode).
* **Styling:** Tailwind CSS v4 (Configured via native CSS Variables and `@theme` directive).
* **Internationalization (i18n):** `next-intl` (Supports `/en` and `/pt` routes, automatic detection, and middleware).
* **Motion & Gestures:** Framer Motion (Page transitions, scroll physics, hover effects).
* **Icons:** Lucide React.
* **Testing:** Vitest + React Testing Library + JSDOM.
* **Quality & Git Hooks:** ESLint, Husky, Commitlint (Conventional Commits).
* **Local Environment:** Custom HTTPS server (`server.ts`) with local certificates (`mkcert`).

## 3. Directory Architecture (Feature-based)
The project adopts a clean structure within `src/`, decoupling business context from global utilities.

```text
src/
├── app/                 # Next.js App Router
│   ├── [locale]/        # Localized routes (en/pt)
│   └── globals.css      # CSS Variables & Tailwind v4 Theme
├── components/
│   ├── home/            # Page-specific components (Hero, Projects)
│   ├── layout/          # Global layout (Navbar, ScrollProgress)
│   └── ui/              # Design System Primitives (Button, Container)
├── i18n/                # Routing & Request logic
├── lib/                 # Shared utilities (clsx, tailwind-merge)
├── messages/            # JSON translation strings
└── tests/               # Test setup & configuration
```

## 4. Component Architecture
* **Navbar (Glassmorphism):**
    * Uses `backdrop-filter: blur()` with semi-transparent borders.
    * **State Logic:** Detects scroll position to toggle visibility.
    * **Motion:** Staggered entry animations.
    * Footer includes action buttons (Portfolio/CV) and social links.
* **Projects Section (Bento Grid):**
    * Responsive grid layout inspired by Apple product cards.
    * Cards feature subtle backgrounds (`#fbfbfd` in light mode), hierarchical typography, and elegant visual placeholders.
* **ScrollProgress (Lateral Navigation):**
    * Visual "thread" on the left side indicating reading progress.
    * **Advanced Logic:** Segmented lines allow transparency between points without visual bugs.
    * **Smart Visibility:** Automatically hides at the top (Hero) or after user inactivity.

## 5. Infrastructure & Local DevOps

### 5.1. Security & HTTPS
* Implementation of a custom server (`server.ts`) to run `localhost` with real HTTPS, enabling faithful testing of secure APIs and browser features.

### 5.2. Quality Pipeline
* **Unit Testing:** Vitest configuration (`vitest.config.ts`) with JSDOM environment.
* **Git Hooks (Husky):**
    * `commit-msg`: Enforces **Conventional Commits** (e.g., `feat:`, `fix:`, `refactor:`).
    * `pre-commit`: Executes Linting (and optionally tests) before accepting code.

## 6. Current Status (Checkpoint)
The codebase is **fully refactored**, free of residual comments, utilizing strict TypeScript typing, and featuring finalized English/Portuguese texts via `next-intl`. The architecture is ready for the development of complex visual sections.
