# Token-Efficiency Audit — the `.ai/` Agent System

**Date:** 2026-07-06 · **HEAD:** `be48b61` (post PR #1 merge; includes governance commit
`d0ab8de`) · **Mode:** read-only (no rules, charters, prompts, or code changed) ·
**Method:** `token-economist`-led single-lane analysis dispatched by the `orchestrator`;
measurements pre-computed with shell primitives (`wc`, `grep` — no dependencies added);
all cited lines spot-verified by the conductor before publication.

> Severity: **S0** critical · **S1** high · **S2** medium · **S3** low. Token estimates
> use ≈1.33 tokens/word (static estimate; see §6 on why no token-counting tooling was
> added). "Per task" = paid on every dispatch of the affected agent(s).

---

## 1. Executive summary

* **The architecture is doing its job.** Modular rule-loading, charter subsets, bounded
  handoffs, and pointer-not-copy adapters are real and mostly honored — the audit found
  **no S0** and only **one S1**. The system optimizes at the architecture layer, which is
  the right layer (see §6 on the external tools).
* **The single biggest leak is memory growth on the most expensive agent:** the
  `orchestrator` charter mandates reading `decisions.md` **in full** on every dispatch,
  and that file is now **1,485 words ≈ 1,976 tokens, unbounded and newest-first with no
  archive protocol**. Two of its entries also duplicate each other (~225 words). A
  ≤300-word "active decisions" digest at the top would cut ~1,600–1,700 tokens from every
  top-tier dispatch with zero information loss (full history stays below the fold).
* **The always-on floor for the general assistant is ≈2,177 tokens** (constitution
  manifest + core + architecture + security + stack). Two structural trims are available
  without dropping a single directive that applies to this repo: the new 5-part Git
  governance block (~286 tokens) is unusable by the 4 charters that have no shell access,
  and `architecture.md` carries Mobile/Swift, Go/NestJS backend, and C/C++ routing rules
  (~133 tokens) that no task in this Next.js-only repo can trigger.
* **DRY is largely honored**: the accepted adapter duplication (META-5) is now quantified
  (~1,418 words repo-wide, but only ~310–350 words paid per task) and stands. Two small
  genuine duplications were found (docs-scribe charter copies stack.md's Documentation
  Protocol; the agents README repeats the rules-loaded table a third time).
* **Two cheap additive wins** would convert bulk reads into targeted reads: charters don't
  point implementers at the existing `docs/<Component>.md` files as cheap first reads, and
  no `src/` path→purpose index exists anywhere in `.ai/` or `docs/`.

## 2. Baseline measurements

### Always-on modules and policy files

| File | Lines | Words | ≈Tokens | Loaded by |
| --- | --- | --- | --- | --- |
| `.ai/rules/core.md` | 22 | 508 | 676 | every agent, every task |
| `.ai/rules/architecture.md` | 22 | 350 | 466 | general assistant + 3 charters |
| `.ai/rules/security.md` | 16 | 176 | 234 | general assistant + security-analyst |
| `.ai/rules/stack.md` | 24 | 243 | 323 | general assistant + 5 charters |
| `.ai/rules/design.md` | 21 | 285 | 379 | triggered (UI tasks) |
| `.ai/rules/testing.md` | 14 | 164 | 218 | triggered (test tasks) |
| `.ai/constitution.md` (manifest) | 42 | 360 | 479 | routing read |
| `.ai/orchestration.md` | 98 | 739 | 983 | orchestrator, token-economist |
| `.ai/memory/README.md` | 44 | 326 | 434 | memory protocol |
| `.ai/memory/shared/decisions.md` | 169 | 1,485 | **1,976** | orchestrator (full, every dispatch) — **unbounded** |
| `.ai/memory/shared/patterns.md` | 67 | 487 | 648 | on demand |
| `.ai/memory/shared/glossary.md` | 28 | 205 | 273 | on demand |

**General-assistant always-on floor:** constitution + core + architecture + security +
stack = 1,637 words ≈ **2,177 tokens** before any task-specific rule, charter, or memory
read.

### Per-agent load (rules subset + charter + charter-named memory)

| Agent | Words | ≈Tokens | Tier |
| --- | --- | --- | --- |
| token-economist (loads orchestration + full registry) | 3,766 | 5,009 | mid |
| docs-scribe (curates full `shared/`) | 3,260 | 4,336 | cheap |
| orchestrator (orchestration + full `decisions.md`) | 2,975 | 3,957 | top |
| frontend-architect | 2,315 | 3,079 | top |
| performance-engineer | 1,826 | 2,429 | top |
| i18n-a11y-steward | 1,750 | 2,328 | cheap |
| security-analyst | 1,747 | 2,323 | top |
| test-engineer | 1,636 | 2,176 | mid |

Note the inversion: the two *cheap-tier* curation agents carry the heaviest context, and
the *top-tier* orchestrator's load grows every time a decision lands. Charters themselves
are uniformly lean (226–271 words each).

## 3. Findings

| ID | Area | Sev | Evidence | Est. token impact | Concrete fix | Quality-safety note |
| --- | --- | --- | --- | --- | --- | --- |
| TOK-8 | 4/5 Memory·handoff | **S1** | `.ai/agents/orchestrator.md:24-25` mandates full `decisions.md` read; file is 1,976t, unbounded | ~1,600–1,700t saved **per orchestrator dispatch**, compounding | docs-scribe maintains a ≤300w "Active decisions" digest at the top of `decisions.md`; orchestrator reads only the digest | Full rationale stays in the same file below the fold (plus `docs/audit-*.md` + git); routing never needed the 2026-06 wave narratives |
| TOK-1 | 1/2 Always-on | S2 | `.ai/rules/core.md:17-22` — 5-part Git governance block in the always-on core | ~286t per task for the 4 charters with no shell tool | Extract to `rules/git.md`; loaded by Bash-equipped charters (frontend-architect, performance-engineer, security-analyst, test-engineer) + general assistant; core keeps the language clause | orchestrator, token-economist, i18n-a11y-steward, docs-scribe **cannot run git** (no Bash in their toolsets) — the text is structurally unusable there; every agent that can commit still loads it |
| TOK-2 | 1 Always-on | S2 | `.ai/rules/architecture.md:16-20` — Mobile/Swift, Go-vs-NestJS backend routing, C/C99/C++ systems rules | ~133t per load (general assistant + 3 charters) | Split the polyglot routing into a triggered appendix; keep typing/Big-O/deps/error-envelope/observability always-on | `stack.md` pins this repo to Next.js; no reachable task can trigger the Swift/Go/C rules — **gate on owner confirming the repo stays single-stack** |
| TOK-12 | 7 Prompt-shape | S2 | `frontend-architect.md`, `i18n-a11y-steward.md` — no pointer to `docs/<Component>.md` first-reads despite `stack.md:23-24` maintaining them | avoids repeated bulk `src/` reads (statically unmeasurable; each avoided component re-read ≈ hundreds of tokens) | Add one charter line: "check `docs/<Component>.md` before touching an existing component" | Additive; the core verify-don't-assume rule (reading the real file before editing) is unchanged |
| TOK-13 | 7 Prompt-shape | S2 | No `src/` path→purpose index anywhere in `.ai/` or `docs/` | cheaper targeted reads for every specialist exploration | docs-scribe extends `patterns.md` "Components" into a short index (routes, `lib/`, `components/ui/`) | Pure reference addition; agents still verify against the real file before editing |
| TOK-9 | 5 Memory | S2 | `decisions.md:8-24` + `:26-39` — governance entry and no-AI-attribution entry overlap (~225w); the newer one states they are "part of the same protocol" | ~300t per orchestrator dispatch (paid on every read of the file) | Merge into one entry, per docs-scribe's own merge-duplicates mandate | Consolidation, not deletion — all rationale and the re-trigger survive |
| TOK-3 | 1 Always-on | S3 | `.ai/rules/core.md:15` — Continuation Protocol (self-reported token-limit pausing) | ~73t always-on | Verify whether agentic harnesses (Claude Code, Antigravity) ever exercise it; if not, move to the raw-chat adapters (Copilot/Gemini) only | **Do not remove blind** — relocate only after confirming it never fires in agentic runners; it may still protect raw-chat use |
| TOK-4 | 2 Load-correctness | S3 | `.ai/agents/test-engineer.md:33-35` cites `(stack)` for jsdom/`setup.ts` conventions that live in `memory/patterns.md` | ~15w + one wasted `stack.md` search per test task | Fix the citation | Citation correction only; no directive changes |
| TOK-5 | 3 DRY | S3 | `.ai/agents/docs-scribe.md:23-26` duplicates `stack.md:23-24` Documentation Protocol (docs-scribe loads `[core]` only, so it copied the text) | ~40t per docs-scribe dispatch | Replace the copy with a pointer to the stack.md bullet | The instruction still reaches the agent — via reference instead of copy |
| TOK-6 | 3 DRY | S3 | `.ai/agents/README.md:12-19` vs `.ai/orchestration.md:30-37` — third copy of each charter's `rules:` list | ~64w maintenance surface (drift risk > token cost) | Drop the "rules loaded" column from one table; charter frontmatter stays canonical | Documentation view deduped; the enforced source (charter frontmatter) is untouched |
| TOK-7 | 3 DRY | S3 | `.claude/agents/*` (863w) + `.github/chatmodes/*` (555w) vs charters (1,925w) | ~1,418w exists repo-wide; only ~310–350w paid per task (charter + the one active adapter) | **No change** — quantifies and confirms META-5's accepted pointer+summary trade-off | Keeping it protects Copilot/Antigravity agents that may not follow relative links |
| TOK-10 | 5 Memory | S3 | `decisions.md:41-122` (~800w of closed audit-wave narrative); `memory/README.md:33-34` has no concrete archive trigger | bounds future growth (the S1's root cause) | Add a rule: collapse a wave entry to ≤40w once its `docs/audit-*.md` report exists and all items are closed | The full detail already lives in the committed audit reports — collapse is a pointer swap, zero loss |
| TOK-11 | 6 Staleness | S3 | `.ai/orchestration.md:68`, `test-engineer.md:10`, `token-economist.md:10` — `claude-sonnet-4-6` superseded (= audit NEW-13, still open) | negligible tokens; prevents wrong cost estimates | Update the three ids + add a "verify each audit cycle" note | Advisory field; nothing executes off the literal string |

**Counts:** 0 × S0 · 1 × S1 · 5 × S2 · 7 × S3. Area 4 (handoff/isolation) otherwise came
back clean: the ≤200-word handoff contract, context isolation, and lane non-overlap held
in practice across both 2026 audits (7 parallel lanes, no cross-lane file re-reads
mandated; the conductor received summaries only).

## 4. What the audit verified as already-efficient (no findings)

* **Charter discipline:** all 8 charters are 226–271 words — uniformly lean; every
  `rules:` subset except the TOK-4 mis-citation checked out as minimal-and-sufficient.
* **Adapter discipline:** `CLAUDE.md` (74w), `GEMINI.md` (78w), `.agent/rules/00-project.md`
  (165w) are true thin pointers; `.github/instructions/*` (~349w total) scope rules per
  file-glob without copying module text.
* **Startup minimization** (external principle #2) is exactly what `constitution.md`'s
  manifest + TRIGGERED modules implement; on-demand topic-keyed knowledge (#3) is what
  `design.md`/`testing.md` triggering implements.

## 5. External prior art — considered, not adopted

`nadimtuhin/claude-token-optimizer` and `alexgreensh/token-optimizer` were read as
checklist input only (measure-before-cut; startup minimization; archiving history out of
the hot path; delta/targeted reads; bounded outputs; cache-prefix stability; ghost-token
hunting). **Both are client-side runtime utilities** — hooks, session snapshots,
compaction survival, output compression. This repo optimizes **upstream, at the
architecture layer** (modular rule-loading, charter subsets, bounded handoffs,
pointer-not-copy adapters), so their principles apply but their tooling does not: bolting
on measurement/trimming dependencies to a system whose static surface is ~15 small
markdown files would be over-engineering, and the Free/OSS no-new-deps policy stands.
**Parked with re-trigger:** adopt measurement tooling only if the `.ai/` system grows past
what static `wc`/`grep` estimation can audit (e.g. >50 modules, or per-session dynamic
context assembly).

## 6. Waved optimization plan (future gated fronts — none executed here)

**Wave 1 — zero-quality-risk, highest saving (recommend gating first):**
| Item | Owner | Est. saving | Dependency |
| --- | --- | --- | --- |
| TOK-9 merge the two overlapping governance entries | docs-scribe | ~300t/orchestrator dispatch | none |
| TOK-8 add the ≤300w "Active decisions" digest; orchestrator charter reads digest only | docs-scribe + token-economist (one-line charter edit) | ~1,600t/orchestrator dispatch | after TOK-9 |
| TOK-10 codify the archive/collapse trigger in `memory/README.md` | docs-scribe | bounds future growth | with TOK-8 |
| TOK-11 refresh 3 stale model ids + per-cycle note | docs-scribe | hygiene | none |
| TOK-4 fix the test-engineer citation | docs-scribe | hygiene | none |
| TOK-5 docs-scribe charter: copy → pointer | docs-scribe | ~40t/dispatch | none |
| TOK-6 drop the third rules-loaded table copy | docs-scribe | drift-risk removal | none |

**Wave 2 — structural, low risk:**
| Item | Owner | Est. saving | Dependency |
| --- | --- | --- | --- |
| TOK-1 extract `rules/git.md` from core; re-scope the 4 Bash-equipped charters + manifest | token-economist (spec) + docs-scribe (edit) | ~286t/task for 4 agents | Wave 1 merged (touches the same governance text) |
| TOK-12 add `docs/<Component>.md` first-read pointers to the 2 implementer charters | token-economist | avoided bulk reads | none |
| TOK-13 `src/` path→purpose index in `patterns.md` | docs-scribe | avoided bulk reads | none |

**Wave 3 — needs owner confirmation before touching:**
| Item | Owner | Est. saving | Gate |
| --- | --- | --- | --- |
| TOK-2 split `architecture.md` polyglot routing into a triggered appendix | token-economist | ~133t/load | owner confirms the repo stays Next.js-only |
| TOK-3 relocate the Continuation Protocol to raw-chat adapters | token-economist | ~73t always-on | verify it never fires under agentic harnesses first |

Estimated steady-state effect of Waves 1–2: the orchestrator's per-dispatch load drops
from ≈3,957t to ≈2,100–2,300t (−42%), and every non-git specialist task sheds ~286t, with
zero directives removed from any agent that can act on them.

## 7. Notes & caveats (anti-sycophancy)

* **All token figures are static estimates** (words × 1.33). That is the right precision
  for ranking fixes; it is not billing-grade. Adopting counting tooling to sharpen ±10%
  on a 15-file system would cost more than it saves (§5).
* **TOK-2 and TOK-3 are deliberately gated, not queued** — each removes text that is
  *currently* unreachable but could become reachable if scope changes (a mobile app; a
  raw-chat platform relying on self-pausing). The gate is the owner's call, not the
  auditor's.
* **TOK-7/META-5 duplication is re-confirmed as correct** — the cheap insurance that
  non-link-following platforms still get charter summaries outweighs ~40 words per task.
* **Read-only held:** no rule, charter, prompt, or product file was modified; the only
  writes are this report and one decision-log entry. Gate: `npm run lint` + `npm test` +
  `npm run build` green on unchanged product code (verified at commit time).
