# Orchestration Playbook

How agents collaborate in this repository. This is the conductor's policy — routing,
token budget, model tiering, parallelism, context isolation, and memory discipline. It is
platform-agnostic: it governs Claude Code subagents, Antigravity agents, and Copilot chat
modes identically.

## 1. Pattern: lead agent + specialist workers

A single **`orchestrator`** (lead) owns the task end-to-end. It does **not** implement;
it decomposes the request, routes each subtask to the cheapest capable specialist, runs
independent subtasks in parallel, and aggregates their summaries into one coherent result.
Specialists own a narrow domain, run in an **isolated context window**, and return a
compact summary — never their raw exploration transcript.

```
                 ┌──────────────┐
   user task ───▶│ orchestrator │  decompose · route · budget · aggregate
                 └──────┬───────┘
        ┌───────────────┼───────────────┬───────────────┐
        ▼               ▼               ▼               ▼
 frontend-architect  performance-   security-       test-engineer ...
                     engineer       analyst
```

## 2. Routing table (task signal → agent)

| If the task is about… | Route to | Loads rules |
| --- | --- | --- |
| Components, layout, motion, styling, UX | `frontend-architect` | core, stack, design, architecture, git |
| Time/space complexity, bundle size, render/RSC cost | `performance-engineer` | core, stack, architecture, git |
| Prompt/context bloat, agent or orchestration efficiency | `token-economist` | core (+ this file, + agents registry) |
| Unit/integration tests, coverage, flakiness | `test-engineer` | core, stack, testing, git |
| Input validation, auth, crypto, dependency CVEs, RBAC | `security-analyst` | core, security, architecture, git |
| en/pt catalog parity, WCAG AA, aria, focus order | `i18n-a11y-steward` | core, stack, design |
| `docs/` upkeep, shared-memory curation | `docs-scribe` | core |
| Multi-domain / unclear / needs decomposition | `orchestrator` | core (+ this file) |

A task may fan out to several agents (e.g. "add a settings panel" → `frontend-architect`
to build, `i18n-a11y-steward` for strings + aria, `test-engineer` for coverage,
`security-analyst` if it touches input). The orchestrator sequences and parallelizes them.

## 3. Token budget (the core efficiency contract)

1. **Load only your charter's rule modules.** Never load the whole `constitution.md` /
   all of `.ai/rules/`. A subset is mandatory, not optional.
2. **Read shared memory before exploring.** `.ai/memory/shared/` replaces re-scanning
   `src/` and re-reading `docs/`. Re-derive from source only when memory is silent or
   stale.
3. **Isolate context.** Specialists run in their own window; their intermediate reading
   does not enter the orchestrator's context. This is what keeps the lead context small.
4. **Return summaries, not transcripts.** A specialist hands back: what changed, which
   files, residual risks, and follow-ups — typically < 200 words. No raw file dumps.
5. **Parallelize independent work**; serialize only true dependencies.
6. **Right-size the model** (next section) — do not spend a top-tier model on mechanical
   work.
7. **Prefer editing over regenerating.** Touch the minimum surface; honor the constitution's
   dead-code and zero-filler rules.

## 4. Model tiering (advisory, per provider)

Charters recommend a tier per provider; all are overridable, and the role prose is
model-agnostic so any LLM can run any agent. Model ids drift — verify this table (and
the charters' `model:` fields) against current provider lineups each audit cycle.

| Tier | Claude (exact id) | Gemini | GPT | Use for |
| --- | --- | --- | --- | --- |
| **top** | `claude-opus-4-8` | Gemini 3 Pro | GPT top tier | Decomposition, architecture, security, perf reasoning |
| **mid** | `claude-sonnet-5` | Gemini 3 Flash | GPT mid tier | Test authoring, token analysis |
| **cheap** | `claude-haiku-4-5` | Gemini 3 Flash | GPT mini tier | Mechanical parity checks, doc/memory upkeep |

## 5. Context isolation & least privilege

* Each agent declares the **minimum** toolset in its charter. The `orchestrator` and
  `token-economist` are analysis/routing roles — no broad write access. Implementers
  (`frontend-architect`, `test-engineer`, …) get edit/build tools scoped to their domain.
* An agent must not act outside its mandate; it hands off instead. Cross-domain findings
  are reported up to the orchestrator, which re-routes.

## 6. Memory discipline

* **Read:** per `.ai/memory/README.md`, before exploring.
* **Write:** durable, reusable facts → `.ai/memory/shared/` (curated by `docs-scribe`);
  session scratch → `.ai/memory/private/`. Keep entries compressed; prune stale ones.

## 7. Handoff format (every specialist → orchestrator)

```
SUMMARY    one sentence: what was done
CHANGES    files touched (path — what)
RISKS      anything unverified, assumptions, follow-ups
NEXT       recommended next agent(s), if any
```

## 8. Stop / escalate

Escalate to the user (do not guess) when: requirements are ambiguous in a way that changes
the outcome; a change is destructive or outward-facing; or two rules genuinely conflict.
Per `core.md`, push back on insecure/inefficient requests rather than complying.
