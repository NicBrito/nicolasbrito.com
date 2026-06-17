# GitHub Copilot — Repository Instructions

Always-on baseline for nicolasbrito.com. Kept lean on purpose: domain rules attach
automatically by file path (see `.github/instructions/`), and specialist personas live in
`.github/chatmodes/`. Full system overview: [`AGENTS.md`](../AGENTS.md).

## Always apply
* **[`.ai/rules/core.md`](../.ai/rules/core.md)** — act as a Principal engineer; push back on
  insecure/inefficient asks; output 100% complete code (no placeholders); delete dead code;
  professional English; Conventional Commits.
* **[`.ai/rules/stack.md`](../.ai/rules/stack.md)** — Next.js 16 App Router, TypeScript
  `strict`, Tailwind v4. Reuse `src/components/ui/` primitives. Semantic CSS tokens only (no
  hardcoded hex). Every string in **both** `src/messages/en.json` and `pt.json` via
  `useTranslations`. Constant-duration Framer Motion; animate `transform`, not layout.

## Load on demand (auto-attached by path, or load when relevant)
* [`architecture.md`](../.ai/rules/architecture.md) — strict typing, Big-O, dependency
  governance, error envelopes, observability.
* [`design.md`](../.ai/rules/design.md) — UI/UX hierarchy, 8-pt grid, states, theming,
  glassmorphism, WCAG AA *(editing components/styles)*.
* [`security.md`](../.ai/rules/security.md) — zero-trust validation, parameterized queries,
  crypto, RBAC *(editing routes/middleware/inputs)*.
* [`testing.md`](../.ai/rules/testing.md) — AAA, meaningful coverage, deterministic mocks
  *(editing tests)*.

## Before re-deriving facts
Read [`.ai/memory/shared/`](../.ai/memory/) (decisions, patterns, glossary). Don't re-scan
`src/` for what's already recorded there.

## Specialists
Switch to a chat mode in `.github/chatmodes/` (`frontend-architect`, `performance-engineer`,
`test-engineer`, `security-analyst`, `i18n-a11y-steward`, `docs-scribe`, `token-economist`,
`orchestrator`) for focused, token-scoped work. Routing: [`.ai/orchestration.md`](../.ai/orchestration.md).
