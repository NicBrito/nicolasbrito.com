# AI Coding Agent Instructions - nicolasbrito.com

## Project Overview
Apple-design-system portfolio built with **Next.js 16.1 + TypeScript + Framer Motion + Tailwind v4**. Strict adherence to minimalism, physics-based animations, and Senior-level software engineering practices.

## Architecture Essentials

### Directory Structure
```
src/
├── app/[locale]/          # Localized routes (en/pt) - InternationalizationObserver pattern
├── components/
│   ├── home/              # Hero, ProjectsSection - page-specific features
│   ├── layout/            # Navbar, ScrollProgress - global, reusable shells
│   └── ui/                # Button, Container - design system primitives
├── i18n/                  # next-intl routing logic (request.ts, routing.ts)
├── lib/                   # Shared utilities (utils.ts: clsx+tailwind-merge helpers)
├── messages/              # JSON translation dictionaries (en.json, pt.json)
└── tests/                 # Vitest setup (setup.ts)
```

### Critical Data Flows
1. **i18n Flow:** Route parameters → `request.ts` (locale detection) → `useTranslations()` hook → messages JSON
2. **Motion Pipeline:** Component state → `framer-motion` variants → GPU-accelerated transforms (no re-renders via `useTransform`)
3. **Scroll Tracking:** `useScroll()` → `useTransform()` mapping → fixed-position UI bound to scroll position

## Component Patterns

### Motion Components (Navbar, ScrollProgress, Hero)
**Key principle:** Constant durations with custom cubic-bezier easing, never default springs.
- **Entry animations:** Fast, precise easing like `[0.2, 0, 0.2, 1]` (no overshoot)
- **Exit animations:** Slow-start easing like `[0.4, 0.0, 0.2, 1]` (deceleration)
- **Example:** `ScrollProgress.tsx` uses `duration: isScrolling ? 0.3 : 0.35` with tailored easing per state
- **AnimatePresence:** Always use `mode="popLayout"` to prevent layout thrashing during rapid state changes

### State Management Pattern
Prefer lightweight `useState` + `useEffect` hooks over Redux. Use `useRef` for timeout cleanup:
```typescript
const scrollTimeout = useRef<NodeJS.Timeout | null>(null);
useEffect(() => {
  return () => {
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
  };
}, []);
```

### i18n Integration
All user-visible text lives in `src/messages/{en,pt}.json`. Use `useTranslations()`:
```typescript
const t = useTranslations("ScrollProgress");
const label = t(sectionKey); // Resolves at runtime
```
**DO NOT hardcode strings.** Add new keys to BOTH `en.json` and `pt.json` immediately.

### Typography & Color System
- **Primary font:** `font-black` for headings, `tracking-wide` for elegant spacing
- **Opacity:** `text-foreground/80` (80% opacity) is Apple's standard for secondary elements
- **Rendering:** Always set `style={{ textRendering: "geometricPrecision" }}` for pixel-perfect text
- Tailwind v4 CSS Variables defined in `src/app/globals.css` via `@theme` directive

## Developer Workflows

### Local Development
```bash
npm run dev              # Starts custom HTTPS server (server.ts) on localhost:3000
npm run lint            # ESLint check
npm run test            # Vitest run once
npm run test:watch      # Vitest watch mode
npm run build           # Production build (validates Turbopack compilation)
npm run clean           # Deep sanitization (node_modules, .next, coverage)
```

### Git Workflow
- **Commits:** Conventional Commits via Commitlint (enforced by Husky hooks)
  - `feat(ui): ...` for component/UI work
  - `chore(infra): ...` for build/dev tooling
  - `docs: ...` for documentation
- **Detailed bullet points** required (see `git log --oneline`). Each feature deserves 5-8 bullets explaining "what" and "why"

### Testing Strategy
- **Test files:** Colocate tests with components (`Button.test.tsx` next to `Button.tsx`)
- **Libraries:** Vitest + React Testing Library + JSDOM
- **Coverage target:** Priority on critical paths (animations, i18n routing)
- **Run:** `npm run test:coverage` to verify thresholds

## Performance Guardrails

### Motion Optimization
- **GPU acceleration:** Framer Motion's `useTransform` automatically offloads to GPU (prefer over direct state updates)
- **Never animate layout properties** (width, height) directly—use `transform` instead
- **60fps target:** Use browser DevTools Performance tab to verify frame rate

### Rendering Performance
- **"use client"** directive required for all interactive components
- **Lazy load images:** Use Next.js `Image` component with `priority={false}` (default)
- **CSS-in-JS:** Avoid. Use Tailwind utilities exclusively

## Internationalization Rules

### Locale Detection Flow
1. User navigates to `/en/...` or `/pt/...`
2. `src/i18n/request.ts` intercepts, validates, and stores locale in request headers
3. `useTranslations()` resolves keys from `src/messages/[locale].json`
4. Component renders translated content

### Adding New Sections
1. Create component in `src/components/`
2. Add section ID to a "SECTIONS" constant (e.g., `ScrollProgress.tsx` line 6)
3. Add translation keys to BOTH `en.json` and `pt.json` under a namespace:
   ```json
   "MyComponent": {
     "title": "English text",
     "description": "More text..."
   }
   ```
4. Use `useTranslations("MyComponent")` in component
5. Update documentation in `docs/` with architecture details

## Documentation Standards

### When to Document
- New components → `docs/ComponentName.md` with sections: Overview, Visual Implementations, Architecture, Performance Notes
- Significant refactors → Update `docs/Foundation.md` (System Overview section)
- Major patterns → Add to `.github/copilot-instructions.md` (this file)

### Documentation Template
```markdown
# Component Name

## 1. Overview & Objective
[What does it do and why]

## 2. Visual Implementations
[Animation details with timings, easing values, and design rationale]

## 3. State Management & Visibility Logic
[How component handles visibility, active states, lifecycle]

## 4. Architecture & Performance
[Technical implementation, optimization techniques, hooks used]
```

## Critical Files to Know
- `src/components/layout/Navbar.tsx` - Reference for morphing labels + keyboard accessibility
- `src/components/layout/ScrollProgress.tsx` - Reference for scroll tracking + Framer Motion useTransform
- `src/app/globals.css` - Tailwind v4 theme (CSS variables + @theme)
- `src/messages/{en,pt}.json` - Master translation dictionaries
- `commitlint.config.mjs` - Conventional Commits validation rules

## Common Pitfalls to Avoid
1. **Hardcoding text** → Use i18n always
2. **Spring animations** → Use custom easing with specific durations (Apple doesn't bounce)
3. **Layout animations** → Use `transform` instead of width/height
4. **Missing TypeScript types** → Strict mode enforced; types required on all props
5. **Forgetting "use client"** → Required for interactive components (React 19 Server Components)
6. **Over-complicating state** → Prefer simple `useState` over Redux for UI state

---

**Last Updated:** January 2026 | **Version:** 0.2.0
