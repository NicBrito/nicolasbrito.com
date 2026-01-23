# AI Coding Agent Instructions - nicolasbrito.com

## Project Overview
Apple-design-system portfolio built with **Next.js 16.1 + TypeScript + Framer Motion + Tailwind v4**. Strict adherence to minimalism, physics-based animations, and Senior-level software engineering practices.

## Architecture Essentials

### Directory Structure
```
src/
├── app/[locale]/          # Localized routes (en/pt) - i18n routing
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
- **New components:** `docs/ComponentName.md` with sections: Overview, Visual Implementations, Architecture, Performance Notes
- **Significant refactors:** Update `docs/Foundation.md` (System Overview section)
- **Major patterns:** Add to `.github/copilot-instructions.md` (this file)

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

## Documentation Structure

### Top-Level Documentation Files
- **Foundation.md** - System overview, tech stack, architecture summary
- **Hero.md** - Hero section implementation details
- **Navbar.md** - Navigation component with dropdown and keyboard support
- **Projects.md** - Projects section (Bento grid) implementation
- **ScrollProgress.md** - Scroll progress indicator with scroll tracking
- **Refinement.md** - Engineering excellence and code quality improvements

### Component-Level Documentation Files
- **ButtonComponents.md** - PrimaryButton & SecondaryButton (reusable UI buttons)
- **MorphingLabel.md** - Letter-by-letter text morphing animation component
- **ProjectCard.md** - Reusable project card component with image/orbs fallback
- **SocialLink.md** - Reusable social media link component with glassmorphism

### Documentation Language
**ALL DOCUMENTATION MUST BE IN ENGLISH.** This ensures consistency across the codebase and makes the project accessible to the wider development community.

## Critical Files to Know
- `src/components/layout/Navbar.tsx` - Reference for morphing labels + keyboard accessibility
- `src/components/layout/ScrollProgress.tsx` - Reference for scroll tracking + Framer Motion useTransform
- `src/components/ui/MorphingLabel.tsx` - Reusable letter-by-letter animation component
- `src/components/ui/Button.tsx` - PrimaryButton and SecondaryButton components
- `src/components/ui/ProjectCard.tsx` - Reusable project card with image/orbs rendering
- `src/components/ui/SocialLink.tsx` - Reusable social media link component
- `src/app/globals.css` - Tailwind v4 theme (CSS variables + @theme)
- `src/messages/{en,pt}.json` - Master translation dictionaries
- `src/lib/animations.ts` - Centralized animation configuration (morphingLabelSpeed presets)
- `commitlint.config.mjs` - Conventional Commits validation rules

## UI Component Library Status

### Available Design System Primitives
1. **PrimaryButton** - Blue accent button for primary actions
   - `src/components/ui/PrimaryButton.tsx`
   - File: `docs/ButtonComponents.md` (shared with SecondaryButton)

2. **SecondaryButton** - Glassmorphism button for secondary actions
   - `src/components/ui/SecondaryButton.tsx`
   - File: `docs/ButtonComponents.md` (shared with PrimaryButton)

3. **Container** - Responsive layout wrapper
   - `src/components/ui/Container.tsx`
   - Simple layout utility for consistent spacing

4. **MorphingLabel** - Letter-by-letter text animation
   - `src/components/ui/MorphingLabel.tsx`
   - File: `docs/MorphingLabel.md`
   - Used in Navbar, ScrollProgress, and available for new components

5. **ProjectCard** - Project showcase card (reusable)
   - `src/components/ui/ProjectCard.tsx`
   - File: `docs/ProjectCard.md`
   - Supports image or gradient orbs fallback

6. **SocialLink** - Social media link with glassmorphism
   - `src/components/ui/SocialLink.tsx`
   - File: `docs/SocialLink.md`
   - Supports any Lucide React icon

### Test Coverage
- **Total Tests:** 53 passing with zero warnings
- **Test Files:** 4 (Buttons.test.tsx, MorphingLabel.test.tsx, ProjectCard.test.tsx, SocialLink.test.tsx)
- **Coverage:** 100% of critical functionality
- **Build Status:** Turbopack 1.6-1.9s ✓

## Common Pitfalls to Avoid
1. **Hardcoding text** → Use i18n always
2. **Spring animations** → Use custom easing with specific durations (Apple doesn't bounce)
3. **Layout animations** → Use `transform` instead of width/height
4. **Missing TypeScript types** → Strict mode enforced; types required on all props
5. **Forgetting "use client"** → Required for interactive components (React 19 Server Components)
6. **Over-complicating state** → Prefer simple `useState` over Redux for UI state
7. **Missing documentation** → Document new components, significant changes, and major patterns
8. **Adding comments in code** → Code should be self-documenting; use docs/ for detailed explanations

## Code Quality Standards

### Cleanliness
- ✅ No comments in production code (self-documenting)
- ✅ No console.log statements (use debugging tools)
- ✅ No commented-out code (use git history)
- ✅ Configuration constants at top of files
- ✅ Imports organized logically

### Testing
- ✅ Unit tests for all UI components
- ✅ Integration tests for complex interactions
- ✅ No console warnings in test output
- ✅ All tests passing before commit

### Internationalization
- ✅ All user-visible text in i18n files
- ✅ No hardcoded English or Portuguese strings
- ✅ Keys updated in BOTH en.json and pt.json
- ✅ Consistent namespace conventions

---

**Last Updated:** January 2026 | **Version:** 0.3.0 | **Status:** Production-Ready
