# AGENTS.md — nicolasbrito.com

Universal entry point for AI coding agents, in the open [AGENTS.md](https://agents.md)
format. Read natively by GitHub Copilot, OpenAI Codex/GPT, Gemini CLI, Google Antigravity,
Cursor, and others. Claude Code reads [`CLAUDE.md`](./CLAUDE.md), which routes to the same
sources. **One source of truth, many platforms.**

## Project

Personal portfolio of Nicolas Brito — bilingual (en/pt), motion-rich single page.
Next.js 16 (App Router) · React 19 · TypeScript (`strict`) · Tailwind v4 · next-intl ·
Framer Motion · Vitest.

## Setup & commands

```bash
npm install
npm run dev            # experimental HTTPS at https://localhost:3000 → redirects to /en
npm run build          # production build
npm run lint           # ESLint (eslint-config-next)
npm test               # Vitest (run once) — also enforced by the Husky pre-commit hook
npm run test:coverage  # V8 coverage
```

Commits MUST follow Conventional Commits (enforced by commitlint `commit-msg`).

## How the AI system is organized

A layered, DRY orchestration system. Everything canonical lives under `.ai/`; every
platform file points back to it — never copy rules.

```
.ai/rules/*.md         Composable rule modules (the only source of directives)
.ai/agents/*.md        8 specialist agent charters (each loads only the rules it needs)
.ai/orchestration.md   Routing, token budget, model tiering, handoff format
.ai/memory/            shared/ (committed knowledge) + private/ (gitignored scratch)
AGENTS.md · CLAUDE.md · GEMINI.md · .github/ · .agent/   Thin per-platform adapters
```

**Read order for any task:** the rule modules your work needs (see manifest) → relevant
`.ai/memory/shared/` files → then act. Do not load the whole rulebook.

## Agents

Decompose non-trivial work with the **`orchestrator`**, which routes to specialists. Full
roster, routing table, and invocation per platform: **[`.ai/agents/README.md`](./.ai/agents/README.md)**.

| Agent | Use for |
| --- | --- |
| `orchestrator` | Multi-domain / ambiguous tasks — decompose & route |
| `frontend-architect` | UI/UX, components, motion, styling |
| `performance-engineer` | Time/space, bundle, render cost |
| `token-economist` | Orchestration & context efficiency |
| `test-engineer` | Vitest/RTL coverage, flakiness |
| `security-analyst` | Validation, auth, crypto, RBAC, deps |
| `i18n-a11y-steward` | en/pt parity, WCAG AA |
| `docs-scribe` | docs/ + shared-memory upkeep |

## Directives (modular)

Load only what the task needs — manifest: **[`.ai/constitution.md`](./.ai/constitution.md)**.

* Always: [`core`](./.ai/rules/core.md), [`architecture`](./.ai/rules/architecture.md), [`security`](./.ai/rules/security.md), [`stack`](./.ai/rules/stack.md)
* On UI work: [`design`](./.ai/rules/design.md) · On tests/refactor: [`testing`](./.ai/rules/testing.md)
* Off the Next.js/TS stack only: [`polyglot`](./.ai/rules/polyglot.md)

Non-negotiables: act as a Principal engineer (push back on bad asks); 100% complete code,
no placeholders; strict typing; semantic CSS tokens (no hardcoded hex); every string in
both `src/messages/{en,pt}.json`; reuse the `src/components/ui/` primitives.

## Memory

Before re-deriving project facts, read **[`.ai/memory/shared/`](./.ai/memory/)** (committed:
decisions, patterns, glossary). Keep session scratch in `.ai/memory/private/` (gitignored).
Protocol: [`.ai/memory/README.md`](./.ai/memory/README.md).

## Per-platform entry points

| Platform | Reads |
| --- | --- |
| **Claude Code** | [`CLAUDE.md`](./CLAUDE.md) → `.ai/`; subagents in [`.claude/agents/`](./.claude/agents/); `/orchestrate` |
| **GitHub Copilot** | [`.github/copilot-instructions.md`](./.github/copilot-instructions.md); path-scoped `.github/instructions/`; chat modes `.github/chatmodes/` |
| **Google Antigravity** | this `AGENTS.md` + [`GEMINI.md`](./GEMINI.md) + `.agent/rules/` |
| **Other (Codex, Cursor, …)** | this `AGENTS.md` |
