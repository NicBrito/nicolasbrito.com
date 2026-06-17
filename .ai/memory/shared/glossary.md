# Glossary

Shared vocabulary so agents and humans use terms consistently.

## Orchestration system

* **Rule module** — a single composable directive file under `.ai/rules/` (the canonical
  source). Agents load a subset to save tokens.
* **Agent charter** — a platform-agnostic role definition under `.ai/agents/` declaring
  which rules and memory scopes the agent loads.
* **Thin adapter** — a per-platform file (`.claude/agents/*`, `.github/chatmodes/*`,
  `.agent/rules/*`) that *points to* a charter/module rather than copying it.
* **Conductor / orchestrator** — the lead agent that decomposes a task, routes subtasks to
  specialists, enforces the token budget, and aggregates results.
* **Shared vs private memory** — committed team knowledge vs gitignored session scratch.
* **Token budget** — the per-task policy in `.ai/orchestration.md` limiting which rules,
  context, and model tier an agent may use.

## Project domain

* **Locale** — `en` (default) or `pt`; routed by next-intl.
* **Primitive** — a reusable UI building block in `src/components/ui/`.
* **Token (design)** — a semantic CSS variable in `globals.css` (e.g. `--accent`). Note
  the collision with **token (LLM)**; disambiguate when ambiguous.
* **Glass / glassmorphism** — the `.glass` backdrop-blur surface treatment.
* **Carousel internals** (`src/components/home/games/`) — `pendingIndexRef` (next slide
  awaiting commit), `swipeLockedRef` (gesture lock), idle-unlock window (ms before a new
  gesture is accepted).
