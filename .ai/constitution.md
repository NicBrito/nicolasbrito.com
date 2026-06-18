# Project Constitution & AI Directives — Manifest

> **This file is the directive manifest, not the directive body.** The rules were
> decomposed into composable modules under [`.ai/rules/`](./rules/) so that any agent
> loads only the context its task requires (token economy) instead of the whole
> rulebook. Per the **Context-First Execution** directive in
> [`core.md`](./rules/core.md), you MUST read the modules you load *completely* before
> generating code or text.
>
> New to this repo's AI system? Start at the root [`AGENTS.md`](../AGENTS.md) for the
> full orchestration overview (agents, memory, per-platform entry points).

## Rule modules (single source of truth)

| Module | Status | Load when |
| --- | --- | --- |
| [`rules/core.md`](./rules/core.md) | **ALWAYS ACTIVE** | Every task. Anti-sycophancy, completeness, dead-code, context-first, language/VCS. |
| [`rules/architecture.md`](./rules/architecture.md) | **ALWAYS ACTIVE** | Any logic. Strict typing, Big-O, dependency governance, stack routing, error envelopes, observability. |
| [`rules/security.md`](./rules/security.md) | **ALWAYS ACTIVE** | Any input / data / auth / network boundary. Zero-trust, validation, parameterized queries, crypto, RBAC. |
| [`rules/stack.md`](./rules/stack.md) | **ALWAYS ACTIVE** (this repo) | Always here. Next.js 16, next-intl en/pt parity, Apple motion, primitives, docs protocol. |
| [`rules/design.md`](./rules/design.md) | TRIGGERED | UI/UX & frontend tasks. Hierarchy, 8-pt grid, typography, states, theming, glassmorphism, WCAG AA. |
| [`rules/testing.md`](./rules/testing.md) | TRIGGERED | Logic, QA & refactoring tasks. AAA structure, coverage integrity, deterministic isolation. |

> **Note:** the Status column describes the **general project assistant** (whole-repo
> context). A **specialized agent ignores these labels** and loads only the `rules:`
> subset declared in its charter — see "How to load" below.

## How to load (default for whole-project context)

If you are operating as the **general project assistant** (no specialized agent), load
the four `ALWAYS ACTIVE` modules now — `core`, `architecture`, `security`, `stack` —
and add `design` and/or `testing` the moment the task touches UI or tests.

If you are operating as a **specialized agent**, load exactly the modules listed in your
charter under [`.ai/agents/`](./agents/) — nothing more. See
[`.ai/orchestration.md`](./orchestration.md) for routing and the token budget.

## Memory

Before re-deriving project facts, consult durable knowledge in
[`.ai/memory/shared/`](./memory/) (committed). Record session-scoped state in
`.ai/memory/private/` (gitignored). Protocol: [`.ai/memory/README.md`](./memory/README.md).
