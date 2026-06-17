# Agent Registry

Platform-agnostic agent charters. Each file is the **single source of truth** for one
agent; per-platform files (`.claude/agents/`, `.github/chatmodes/`, `.agent/`) are thin
adapters that point here. Run any agent on any LLM — the `model:` field is an advisory
recommendation, the role prose is model-neutral.

## Roster

| Agent | Role | Rules loaded | Model tier |
| --- | --- | --- | --- |
| [`orchestrator`](./orchestrator.md) | Conductor — decompose, route, budget, aggregate | core | top |
| [`frontend-architect`](./frontend-architect.md) | UI/UX implementation, design system | core, stack, design, architecture | top |
| [`performance-engineer`](./performance-engineer.md) | Time/space, bundle, render cost | core, stack, architecture | top |
| [`token-economist`](./token-economist.md) | Orchestration & context efficiency (meta) | core | mid |
| [`test-engineer`](./test-engineer.md) | Vitest/RTL coverage, determinism | core, stack, testing | mid |
| [`security-analyst`](./security-analyst.md) | Zero-trust, validation, crypto, RBAC, deps | core, security, architecture | top |
| [`i18n-a11y-steward`](./i18n-a11y-steward.md) | en/pt parity, WCAG AA | core, stack, design | cheap |
| [`docs-scribe`](./docs-scribe.md) | docs/ + shared-memory curation | core, stack | cheap |

No agent loads all six rule modules — that subset *is* the token optimization.

## How to invoke

* **Claude Code** — agents are mirrored to `.claude/agents/`; dispatch with the `Task`
  tool or `/orchestrate`. Each runs in an isolated context window.
* **GitHub Copilot** — agents are mirrored to `.github/chatmodes/`; pick the mode in Chat.
  Path-scoped `.github/instructions/*` auto-attach the right rule module by file glob.
* **Google Antigravity** — reads the root [`AGENTS.md`](../../AGENTS.md) and `.agent/rules/`;
  reference an agent by name in the Agent Manager.

## Charter format

```yaml
---
name: <id>
description: <when to invoke — phrased so platforms can auto-route>
rules: [core, ...]          # token scope — a SUBSET of .ai/rules/
memory: { read: [...], write: [...] }
tools: [...]                # least privilege
model: { claude: <id>, gemini: <tier>, gpt: <tier> }   # advisory
---
```

Routing, token budget, and handoff format: [`../orchestration.md`](../orchestration.md).
