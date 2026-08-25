# Decision Log

Durable architectural decisions and their rationale. Newest first. One entry per
decision. Record *why*, not just *what* — the code already shows the *what*.
**Bounded log:** the *Active Decisions* digest below is the per-dispatch read for
conductors; full entries follow it. Closed wave/audit entries are collapsed to stubs,
their full text relocated verbatim to [`decisions-archive.md`](./decisions-archive.md)
per the protocol in [`../README.md`](../README.md).

## Active Decisions (digest — every in-force decision, one line each)

* **Git governance** (2026-07-06, `rules/git.md`): `type(scope): subject` + concise bullet; **no AI attribution**; MERGE COMMITS only; branches `<type>/kebab`; temp branches deleted on merge.
* **Repo audit #2**: Wave 1 done 2026-08-07 (HIG, motion gates, docs cleared; DP-13 closed); Wave 2 done 2026-08-09 (165 tests); Waves 3/4 pending (`docs/audit-2026-07-06.md`).
* **Token audit CLOSED** (2026-08-09): Waves 1–3 done — bounded digest, `git.md` split, first-read pointers, `src/` index, `polyglot.md` split, Continuation Protocol → Copilot adapter only (`GEMINI.md` excluded: Antigravity reads it agentically). Re-triggers: `polyglot.md` frontmatter + adapter note (`docs/token-efficiency-audit-2026-07-06.md`).
* **DESIGN-1 CLOSED** (2026-08-07): tuned springs ratified; constant-duration beziers rule entry/transition.
* **Hit-area policy** (2026-08-07): interactive == visual (24×24 px WCAG 2.5.8 floor); hamburger ≥44×44 px (Apple HIG) via invisible extensions.
* **Stack & hosting** (2026-08-07): Next.js-only (unlocks TOK-2); Vercel stays, Cloudflare parked (re-trigger: backend/outgrow static).
* **Security**: SEC-3 = 2 moderate postcss-in-next advisories (build-time, clears on Next re-pin). SEC-5 = preload submitted 2026-08-07, pending inclusion — HSTS directives must never be weakened (single-sourced `src/lib/security-headers.ts`). META-5 won't-fix (inline summaries).
* **Contrast tokens**: `--accent-strong` #0071e3; `--accent` #2997ff (6.96:1 text-on-dark).
* **Motion**: `useReducedMotion` gates entry/transition (additive only). **Standing lesson**: behavior-changing UI edits are browser-tested; never remove an affordance.
* **Architecture**: five-layer `.ai/`; adapters point (never copy); minimal rules per charter.
* **Memory**: `shared/` committed, `private/` gitignored; log bounded via digest + archive.
* **Visual/i18n/gates**: dark-mode-first tokens; en/pt catalogs (no hardcode); pre-commit `npm test` + commitlint; HTTPS dev.

---

## 2026-08-09 — Token-efficiency Wave 3: polyglot split + Continuation relocation (closes the audit)

**Decision:** TOK-2: the polyglot routing block (Mobile/Swift, Go-vs-NestJS, C/C99/C++)
moved verbatim from `architecture.md` (350 → 276 words) into the new TRIGGERED
`rules/polyglot.md` (181 words) — no charter loads it; re-trigger in its frontmatter
(mobile app, non-TS backend service, or systems component). TOK-3: verification first —
the git pickaxe finds the pause string only in the two commits that authored the rule;
a tree-wide grep finds only the definition site; agentic runners emit files via tool
calls and cannot fire a chat-stream pause. Premise held, with one correction: `GEMINI.md`
sits in Antigravity's agentic read set (per `AGENTS.md`), so the clause relocated to
`.github/copilot-instructions.md` ONLY, not to `GEMINI.md` as the audit sketched.
`core.md` 344 → 295 words.

**Why:** Always-unreachable text taxed every dispatch. Realized steady-state: the
core-only charters' rules load fell 508 → 295 words (−42%, matching the audit's
estimate); architecture loaders shed another 74 words; nothing was deleted — both moves
are reversible pointer swaps with explicit re-triggers. The token audit is CLOSED.

## 2026-08-09 — Audit #2 Wave 2: regression net over the behavioral surface (NEW-7/NEW-8)

**Decision:** The layout/home behavioral surface is pinned: new suites for Navbar (40
tests — hit-area ADR split, dropdown semantics, keyboard paths), ScrollProgress (5 —
progress/visibility semantics, DP-8/DP-12 cleanup pairs pinned as-is), GamesSection
shell (5 — aria-live status, play/pause, focus; gesture physics stays browser-tested),
plus extended HamburgerMenu (10) and ProjectCard (23 — image state machine, NEW-8).
Suite 104 → 165; statements 30.68% → 78.01% overall (coverage reported, not targeted,
per testing.md). Zero source changes — the net pins today's decided behavior ahead of
Waves 3/4.

**Why:** NEW-7 was the audit's only S1: the `b92ad03` class of undocumented behavioral
change had no net under it. Findings surfaced while pinning are parked for their own
fronts: Navbar dropdown APG keyboard semantics; MorphingLabel's ungated per-character
transition; GamesSection double-landmark and play/pause `aria-pressed`; DP-14 sharpened
(a cached broken image sticks in `loading` forever); `docs/Foundation.md` §4 still
describes ScrollProgress's old left-side thread design.

## 2026-08-08 — Token-efficiency Wave 2: git.md extraction + read-targeting (TOK-1/12/13)

**Decision:** Wave 2 executed: the 5-part Git governance block moved verbatim from
`core.md` into the new triggered `rules/git.md`, loaded via the `rules:` manifests by the
four Bash-equipped charters (frontend-architect, performance-engineer, security-analyst,
test-engineer) and the general assistant; core keeps the language clause plus a one-line
pointer. First-read pointers to `docs/<Component>.md` added to the two implementer
charters (TOK-12); `patterns.md` "Components" extended into a `src/` path→purpose index
(TOK-13). Riders: `.claude/launch.json` gitignored; component docs no longer carry
absolute suite totals (rule codified in `stack.md`'s Documentation Protocol; Games.md and
SocialLink.md reworded).

**Why:** ~286t shed per dispatch for the four no-shell charters that structurally cannot
act on git rules; zero information loss — every agent that can commit still loads the
module. Suite totals in docs drifted on every unrelated PR (three fixes in two days);
deferring to `npm test` ends the class.

## 2026-08-08 — Footer landmark shipped (closes DP-13)

**Decision:** The page's semantic structure is complete: `src/components/layout/Footer.tsx`
renders the `contentinfo` landmark as a sibling after `<main>` in `page.tsx` — a static
async server component (no client JS of its own, no entry motion, zero CLS): hairline
divider (`border-white/5`), name wordmark, the two `SocialLink`s (hrefs single-sourced in
`src/lib/social.ts`, shared with Hero), and a localized copyright line with dynamic year
under the new `Footer` namespace (en/pt parity, appended last in both catalogs). Lean v1
by owner intent; extensions must stay additive (no layout rework).

**Why:** DP-13 was the last missing landmark. A static server-component coda ships zero
client JS and cannot shift layout; `social.ts` removes the only inline duplication of the
social profile URLs. The copyright `{year}` freezes at build time under SSG — acceptable
for a site redeployed on every merge.

## 2026-08-07 — Hit-area policy: pointer precision with a HIG touch exception (D1; closes NEW-1/NEW-2/NEW-12)

**Decision:** For pointer-driven controls (nav pills, dropdown labels) the interactive
area equals the visual bounds, pixel-perfect — the `b92ad03` pointer-events split is
ratified and NEW-2 is ACCEPTED — subject to a hard floor of 24×24 CSS px (WCAG 2.5.8 AA)
that no visual bound may undercut. Exception (NEW-1, FIXED this wave): the hamburger
menu's touch controls — trigger and back button — follow Apple HIG with an interactive
target ≥44×44 px, delivered by invisible absolutely-positioned hit-area extensions inside
each button; rendered visuals (glyph size, focus ring, spacing) stay byte-identical.
Retroactive entry for `b92ad03` (NEW-12), which also carried unlogged fixes: SocialLink
`noopener`, localized `aria_label`, `SITE_URL` DRY, carousel status/title.

**Why:** Pointers reward precision — clicks outside the visible pill should not
activate; thumbs need area, and 24×24 is a floor, not a target, for touch. Splitting the
policy by input modality serves both without visual compromise.

## 2026-08-07 — DESIGN-1 CLOSED: tuned springs ratified for gesture-driven motion (D2)

**Decision:** Explicitly-tuned springs (custom `stiffness`/`damping`, e.g. the games
carousel's `CARD_SPRING`/`btnSpring`) are ratified for physics/gesture-driven
interactions; constant-duration custom cubic-bezier easing remains the rule for
entry/transition motion. `stack.md` already encodes this split — no code change; this
entry closes the item.

**Why:** Gesture-driven motion answers to finger velocity, which a clock cannot express;
scripted entries stay deterministic. Last open decision from audit #1.

## 2026-08-07 — Stack scope: Next.js-only, single-stack (D3)

**Decision:** This repository is and stays Next.js-only — a single stack of
best-in-class web technologies; no secondary frameworks or parallel stacks. Unlocks
TOK-2 (token Wave 3): non-Next guidance may be pruned from always-on rules.

**Why:** One deployment target; speculative multi-stack guidance costs tokens on every
dispatch and hedges against a future the owner has ruled out.

## 2026-08-07 — Hosting: Vercel stays; Cloudflare parked (D4)

**Decision:** Hosting remains Vercel free tier (auto-deploy `main`, per-PR previews).
Cloudflare migration is parked.

**Why:** Integrated PR previews and zero-config Next.js deployment outweigh portability
while the site is fully static.

**Re-trigger:** the repo gains backend services or outgrows static hosting.

## 2026-07-06 — Token-efficiency Wave 1: bounded decision log

**Decision:** Implemented the token audit's Wave 1: this log now opens with a ≤300-word
Active Decisions digest; closed wave/audit entries collapsed to stubs with full text
relocated verbatim to `decisions-archive.md`; the collapse trigger + digest duty are
codified in `.ai/memory/README.md`. Also merged the two overlapping governance entries
and fixed stale model ids (`claude-sonnet-4-6` → `claude-sonnet-5`) and cross-references
(TOK-4/5/6/9/10/11).

**Why:** TOK-8 (S1): conductors re-read this file every dispatch and it grew unbounded
(≈1,976 tokens). Digest-first reading cuts that to ≈400 tokens with zero information
loss — history is relocated, never deleted.

## 2026-07-06 — Token-efficiency audit of the .ai/ system

**Decision:** The token-economist audited the .ai/ system's token economy (read-only) at HEAD be48b61. Report + 3-wave optimization plan: `docs/token-efficiency-audit-2026-07-06.md`. Deliberately short entry — the audit's top finding (TOK-8/S1) is that this file is read in full by the orchestrator every dispatch and needs a digest + archive protocol.

**Why:** Always-on floor ≈2,177 tokens; orchestrator load ≈3,957 tokens/dispatch and growing with this file. 13 findings (1 S1, 5 S2, 7 S3), zero directives proposed for deletion that any agent can act on. External optimizer tools reviewed and parked (client-side; this system optimizes at the architecture layer).

**Re-trigger:** Adopt measurement tooling only if the system outgrows static wc/grep auditing.

## 2026-07-06 — Git governance: format, attribution, merge & branches

**Decision:** The repo's Git conventions are codified in `.ai/rules/core.md` (Language &
Version Control Protocol), five parts: (1) commits are `type(scope): subject`
(Conventional Commits, commitlint-enforced) followed by a concise bullet body naming the
main changes — clean, direct, brief; (2) commit messages carry **no AI-authorship trailer
or credit** — no `Co-Authored-By:` line naming an AI (e.g. Claude), no "Generated with…"
note; every commit is authored solely by Nicolas; (3) branches integrate via **MERGE
COMMITS only** — never squash or rebase a PR — so the full commit history is preserved
from branch to `main`; (4) branch names use a Conventional-Commits prefix + short
kebab-case scope (`feat/…`, `fix/…`, `docs/…`, `chore/…`, `refactor/…`, `test/…`,
`perf/…`); (5) `main` is the permanent trunk; a temporary branch is deleted the moment
its PR merges (GitHub auto-deletes the head branch; delete local copies too).

**Why:** The 2026-07-06 audit commit initially carried a `Co-Authored-By: Claude Fable 5`
trailer — breaking the sole-authorship pattern every prior commit follows — and was
amended out before merge. GitHub also allowed squash and rebase merging (both
collapse/rewrite history) with auto-delete off and no naming convention; the rules were
codified AND the GitHub PR settings aligned (merge-commits only, auto-delete head
branches, auto-merge off) so history preservation and repo hygiene are enforceable, not
merely disciplined.

**Re-trigger:** Credit tooling only if Nicolas explicitly decides to. Revisit the merge
policy only if the project moves to a multi-contributor or linear-history/squash workflow.

## 2026-07-06 — Repository audit #2 (read-only, orchestrated, baseline-reconciled)

**Decision:** A second full audit ran at HEAD b92ad03 via the orchestrator dispatching 7 specialist lanes in parallel, verifying every 2026-06-17 baseline finding and sweeping for new issues. Report: `docs/audit-2026-07-06.md`.

**Why / durable facts:** 0 baseline regressions; 28/42 baseline findings Fixed/Closed, 14 Open (11 actionable deferred + SEC-3/META-5/DESIGN-1 standing dispositions). 13 new findings (1 S1, 5 S2, 7 S3), headline: undocumented commit b92ad03 shrank tap targets to the WCAG 2.5.8 floor (HamburgerMenu ~28×24px) with zero test coverage over the pointer-events rework; SocialLink + ProjectCard hover motion still ungated by useReducedMotion; docs drift (README assets, stale test counts/versions). Security green (2 moderate accepted), tests 86/86 with coverage tooling working (~17.8%). DESIGN-1 (tuned springs vs constant-duration) remains an unresolved owner decision. Remediation is planned as 4 gated waves in the report; Wave 1 (hit areas, reduced-motion gates, doc refresh) recommended first. See [[patterns]].

## 2026-06-18 — Deep second pass (Wave 3) *(archived stub)*

DP-1..7 fixed (perf, contrast, SEO metadata, robots/sitemap, og-image); DP-8..14
deferred as risk-over-value. Full detail: `docs/audit-2026-06-17.md` §7 and
[[decisions-archive]].

## 2026-06-18 — Wave 2 audit closure *(archived stub)*

Nav/menu reduced-motion re-applied as pure additive gate; PWA icons generated; PERF-3 /
A11Y-5 / ARCH-1 closed by verification or KEEP decision. Full detail:
`docs/audit-2026-06-17.md` §6 and [[decisions-archive]].

## 2026-06-18 — Wave 1 remediation *(archived stub)*

CSP (env-aware, render-tested), next 16.2.9, `--accent-strong`, +22 tests; UX-2/A11Y-5
reverted — source of the standing never-remove-an-affordance lesson. Full detail:
`docs/audit-2026-06-17.md` §6 and [[decisions-archive]].

## 2026-06-17 — Repository audit #1 *(archived stub)*

Six-lane orchestrated baseline audit; opened DESIGN-1. Report:
`docs/audit-2026-06-17.md`; full entry in [[decisions-archive]].

## 2026-06-17 — Layered, DRY agent orchestration system

**Decision:** AI configuration is organized as five layers — modular rules
(`.ai/rules/`) → agent charters (`.ai/agents/`) → orchestration policy
(`.ai/orchestration.md`) → memory (`.ai/memory/`) → thin per-platform adapters
(`AGENTS.md`, `.claude/`, `.github/`, `.agent/`).

**Why:** The previous monolithic `constitution.md` was loaded in full for every task on
every platform, wasting tokens. Decomposition lets each agent load only the rule modules
its task needs. Every platform adapter is a *thin pointer* into `.ai/` (never a copy) to
honor the constitution's DRY mandate and keep one source of truth.

## 2026-06-17 — Shared memory committed, private memory gitignored

**Decision:** `.ai/memory/shared/` is version-controlled; `.ai/memory/private/` is
gitignored (folder kept via `.gitkeep`).

**Why:** Curated team knowledge should travel with the repo across platforms and
developers; ephemeral session scratch should not pollute history of a public portfolio.

## (pre-existing) — Dark-mode-first visual system

**Decision:** `globals.css` sets `color-scheme: dark` with a single `:root` token set
(`--background:#000`, `--foreground:#f5f5f7`, `--accent:#2997ff`, `--surface`, `--card`).
No light theme tokens are defined yet.

**Why:** Apple-inspired aesthetic. Per `design.md`, dark mode conveys depth via lighter
surface backgrounds, not shadows — note this when a light theme is eventually added.

## (pre-existing) — Bilingual routing via next-intl

**Decision:** Locales are `en` (default) and `pt`, defined once in
`src/i18n/routing.ts`. Every user-facing string lives in `src/messages/en.json` and
`pt.json`; never hardcode copy.

**Why:** Single source for locale negotiation; the `i18n-a11y-steward` enforces en/pt
key parity.

## (pre-existing) — HTTPS dev + quality gates

**Decision:** `npm run dev` serves over experimental HTTPS (`TRUST_STORES=system,nss`).
A Husky `pre-commit` hook runs `npm test`; `commit-msg` enforces Conventional Commits via
commitlint.

**Why:** Production-parity local TLS; commits cannot land with failing tests or
non-conventional messages.
