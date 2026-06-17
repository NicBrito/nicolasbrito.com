# Agent Memory Protocol

Two sectors keep agents fast and cheap by replacing repeated codebase re-discovery
with curated, compressed knowledge.

| Sector | Path | Git | Holds | Lifetime |
| --- | --- | --- | --- | --- |
| **Shared** | `.ai/memory/shared/` | **Committed** | Durable, team-wide truth: decisions, recurring patterns, glossary. | Long-lived; evolves with the codebase. |
| **Private** | `.ai/memory/private/` | **Gitignored** | Per-developer / per-session scratch: active task context, scratchpads, exploration notes. | Ephemeral; never travels in git. |

> The folder `private/` is kept via `.gitkeep`; its contents are ignored. By
> convention the live working file is `private/activeContext.md` (create it as needed).

## Why this saves tokens

An agent that reads three short, curated files in `shared/` does **not** re-scan
`src/`, re-read `docs/`, or re-derive conventions every session. Curated memory is the
highest-leverage token optimization in this system — write findings down once, reuse
them forever.

## Read protocol

* **Every agent, before exploring:** read the `shared/` file(s) relevant to its domain
  (the `orchestrator` reads `decisions.md`; `frontend-architect` reads `patterns.md` +
  `glossary.md`; etc.). Trust shared memory, but if it names a file/symbol, verify it
  still exists before acting — memory reflects what was true when written.

## Write protocol

* **Promote to `shared/`** only durable, non-obvious facts that future agents will reuse:
  an architectural decision and its rationale, a recurring code pattern, a domain term.
  Do **not** record what the code/git already makes obvious.
* **Keep entries compressed.** One fact per entry, newest first, with a date. Prune or
  correct stale entries — wrong memory is worse than no memory.
* **Keep session noise in `private/`.** Task-specific TODOs, half-formed ideas, and
  transient state never belong in `shared/`.
* The **`docs-scribe`** agent owns shared-memory hygiene; any agent may append, but
  `docs-scribe` curates and de-duplicates.

## Files

* [`shared/decisions.md`](./shared/decisions.md) — architecture decision log (newest first).
* [`shared/patterns.md`](./shared/patterns.md) — recurring, verified code patterns.
* [`shared/glossary.md`](./shared/glossary.md) — project + orchestration vocabulary.
