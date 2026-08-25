# Workspace Rules — nicolasbrito.com (Antigravity)

Antigravity loads every file in `.agent/rules/` on every turn, so this file is kept lean
and routes into the modular system rather than copying it. Full overview:
[`AGENTS.md`](../../AGENTS.md).

## Always apply
* **[`.ai/rules/core.md`](../../.ai/rules/core.md)** — Principal-engineer standard; push back
  on insecure/inefficient asks; 100% complete code (no placeholders); delete dead code;
  professional English; Conventional Commits.
* **[`.ai/rules/stack.md`](../../.ai/rules/stack.md)** — Next.js 16 App Router, TypeScript
  `strict`, Tailwind v4; reuse `src/components/ui/` primitives; semantic CSS tokens (no
  hardcoded hex); every string in both `src/messages/{en,pt}.json`; constant-duration Framer
  Motion (`transform`, not layout).

## Load only when the task needs it (token economy)
[`architecture`](../../.ai/rules/architecture.md) · [`design`](../../.ai/rules/design.md)
(UI) · [`security`](../../.ai/rules/security.md) (inputs/auth) ·
[`testing`](../../.ai/rules/testing.md) (tests) · [`git`](../../.ai/rules/git.md)
(commits) · [`polyglot`](../../.ai/rules/polyglot.md) (only off the Next.js/TS stack).
Manifest: [`.ai/constitution.md`](../../.ai/constitution.md).

## Specialist agents
Reference one by name in the Agent Manager; each loads only its rule subset. Charters +
routing: [`.ai/agents/README.md`](../../.ai/agents/README.md) ·
[`.ai/orchestration.md`](../../.ai/orchestration.md).

`orchestrator` · `frontend-architect` · `performance-engineer` · `token-economist` ·
`test-engineer` · `security-analyst` · `i18n-a11y-steward` · `docs-scribe`

## Memory
Read [`.ai/memory/shared/`](../../.ai/memory/) (decisions, patterns, glossary) before
re-deriving facts. Keep session scratch in `.ai/memory/private/`.
