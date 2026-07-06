# Decision Log

Durable architectural decisions and their rationale. Newest first. One entry per
decision. Record *why*, not just *what* — the code already shows the *what*.

---

## 2026-07-06 — Commit, merge & branch governance

**Decision:** Formalized the repo's Git conventions in `.ai/rules/core.md` (Language &
Version Control Protocol): commits are `type(scope): subject` + a concise bullet body of
the main changes (clean, direct, brief); branches integrate via MERGE COMMITS only —
never squash/rebase — so the full commit history is preserved from branch to `main`;
branch names use a Conventional-Commits prefix + kebab scope (`feat/…`, `fix/…`,
`docs/…`, `chore/…`, `refactor/…`, `test/…`, `perf/…`); a temporary branch is deleted
once its PR merges. (The no-AI-attribution rule logged above is part of the same protocol.)

**Why:** GitHub previously allowed squash and rebase merging (both collapse/rewrite
history) with auto-delete off and no branch-naming convention. Codifying the rules AND
aligning the GitHub PR settings — merge-commits only, auto-delete head branches, auto-merge
off — makes history preservation and repo hygiene enforceable, not merely disciplined.

**Re-trigger:** Revisit only if the project moves to a multi-contributor or
linear-history/squash workflow (would require re-enabling squash/rebase and rewriting this rule).

## 2026-07-06 — No AI attribution in commit messages

**Decision:** Commit messages carry no AI-authorship trailer or credit — no
`Co-Authored-By:` line naming an AI (e.g. Claude), no "Generated with…" note.
Every commit is authored solely by Nicolas. Codified in `.ai/rules/core.md`
(Language & Version Control Protocol).

**Why:** Consistency with the established history (every commit before this one
follows the pattern) and Nicolas's sole authorship of the public portfolio. The
2026-07-06 audit commit initially carried a `Co-Authored-By: Claude Fable 5`
trailer that broke the pattern; it was amended out before merge and the rule
codified here.

**Re-trigger:** Only if Nicolas later decides to credit tooling explicitly.

## 2026-07-06 — Repository audit #2 (read-only, orchestrated, baseline-reconciled)

**Decision:** A second full audit ran at HEAD b92ad03 via the orchestrator dispatching 7 specialist lanes in parallel, verifying every 2026-06-17 baseline finding and sweeping for new issues. Report: `docs/audit-2026-07-06.md`.

**Why / durable facts:** 0 baseline regressions; 28/42 baseline findings Fixed/Closed, 14 Open (11 actionable deferred + SEC-3/META-5/DESIGN-1 standing dispositions). 13 new findings (1 S1, 5 S2, 7 S3), headline: undocumented commit b92ad03 shrank tap targets to the WCAG 2.5.8 floor (HamburgerMenu ~28×24px) with zero test coverage over the pointer-events rework; SocialLink + ProjectCard hover motion still ungated by useReducedMotion; docs drift (README assets, stale test counts/versions). Security green (2 moderate accepted), tests 86/86 with coverage tooling working (~17.8%). DESIGN-1 (tuned springs vs constant-duration) remains an unresolved owner decision. Remediation is planned as 4 gated waves in the report; Wave 1 (hit areas, reduced-motion gates, doc refresh) recommended first. See [[patterns]].

## 2026-06-18 — Deep second pass (Wave 3): new findings, safe fixes

**Decision:** Original Waves 0–2 backlog exhausted, so 3 specialists ran a fresh READ-ONLY deep
review (correctness/perf, a11y/i18n/SEO, code-quality/types). Leak/error/type surfaces came back
**clean** — no resource leaks (all timers/listeners/RAF/observers are torn down), no unsafe async,
i18n parity intact. Fixed the safe/additive net-new findings: (DP-1) `useMediaQuery` cached its
`MediaQueryList` per query in a ref (was allocating `window.matchMedia` every render in the carousel
hot path; test-safe — keyed by query string, not the mock-absent `.media`); (DP-2) removed a dead
`bg-radial-gradient` div in Hero (not a Tailwind v4 utility → compiled to zero CSS); (DP-3) `encodeURI`
on the CV PDF hrefs (raw spaces/`í`/apostrophe → CDN-404 risk); (DP-4) Blog placeholder text `/40`→`/60`
(3.98:1→~6.8:1 AA); (DP-5) full OpenGraph + Twitter card metadata; (DP-6) added `app/robots.ts` +
`app/sitemap.ts` (next-intl matcher `['/', '/(pt|en)/:path*']` doesn't intercept them); (DP-7)
generated `public/og-image.png` (1200×630, accent "N" monogram + name) via sharp.

**Why / deferred:** kept the no-breakage mandate — every fix is additive/correctness or invisible
(metadata/perf), none touch navbar/carousel motion. Deferred DP-8..14 (ScrollProgress stale-closure
& double-observer, carousel sync-complete & wrap-direction, Navbar `setTimeout(0)`, `<footer>`
landmark, latent ProjectCard cached-broken-image) — they touch sensitive motion components, add
visible UI, or are unreachable today. Gate: lint clean, 86/86, build green (7 routes), smoke all 200.
See [[patterns]].

## 2026-06-18 — Wave 2 audit closure (completed)

**Decision:** Wave 2 finished. Code-completed: (1) **A11Y-1 nav/menu** reduced-motion — re-applied
to Navbar + HamburgerMenu as a PURE additive gate (every `reduced===false` branch git-diff-verified
identical to the prior working code; locals `contentItem`/`column`/`itemMotion`/`staggerMotion`
fall back to the exact module-level variants). Drops blur + large slide/stagger under reduced-motion;
disclosure `height` sweeps + icon rotation kept. (2) **SEC-4** icons — generated placeholder PWA
icons with `sharp` (accent `#2997ff` "N" monogram on `#000`): apple-touch-icon 180, icon-192, icon-512;
all serve 200, manifest valid, owner-replaceable. Closed by verification/decision: **PERF-3** font CLS
(next/font emits size-adjust fallback), **A11Y-5** (existing `group-focus-visible:text-foreground` is a
valid WCAG 2.4.7 indicator), **ARCH-1** KEEP (showArrow / image branch are intentional forward API,
not dead code). ProjectCard test now mocks framer-motion (warnings gone). Gate: lint clean, 86/86,
build green, prod smoke (routes + icons all 200).

**Why / still open:** the owner stressed "do not break established/working functionality" — so the
nav re-do was done as a provably-additive gate (not the entangled edit that broke it before). Genuinely
blocked, NOT auto-completable: **PERF-1** (Hero RSC — win needs killing the Hero entry animation +
Lighthouse), **PERF-2** (LazyMotion — invasive across carousel/navbar, uncertain win), **SEC-5** (HSTS
submission — external owner action), **UX-2** (per-item detail routes don't exist). See [[patterns]].

## 2026-06-18 — Wave 1 remediation (security, a11y, UX, tests)

**Decision:** Wave 1 remediation landed in commit series; final gate: lint clean, 86/86 tests
(was 64), build green (SSG /en + /pt + middleware), npm audit = 2 moderate / 0 high / 0 critical.

**Why / durable facts:** SEC-1 (env-aware CSP in next.config.ts — `script-src` needs `'unsafe-inline'`
for Next's inline RSC scripts; a bare `script-src 'self'` blacked out the whole page, caught only on
browser render, not curl — now fixed + render-tested), SEC-2 (next 16.2.9), A11Y-3
(`--accent-strong` #0071e3 for white-on-fill at 4.70:1 AA), A11Y-1 **partial** (reduced-motion kept in
Hero + ScrollProgress only), PERF-4 (GamesSection track sync-seeded), TEST-2/3/4/5 (+22 tests, AAA).
Two standing decisions: (a) SEC-3 residual postcss-in-next moderate accepted (build-time CSS, not
runtime XSS; clears when Next re-pins), (b) white-on-accent fills use `--accent-strong` while brand
`--accent` (#2997ff) stays for text-on-dark (6.96:1).

**REVERTED (audit must not break existing behavior):** UX-2 and A11Y-5 were rolled back to commit
`6343736`. Converting the Navbar/HamburgerMenu dropdown items from `<Link>` to non-interactive `<div>`
(UX-2) silently stripped their `group-hover:text-foreground … transition-colors` hover affordance,
breaking the dropdown; the A11Y-5 `focus-visible:ring-accent` ring was visually intrusive and rejected.
Lesson: **behavior-changing UI edits in an audit must be browser-tested and must never remove an existing
affordance** — prefer minimal/additive changes; when unsure, leave working UI alone. Separately fixed a
pre-existing Framer warning (Navbar animated color to the `"transparent"` keyword → now `rgba(0,0,0,0)`).
See [[patterns]] for contrast + security surface updates.

## 2026-06-17 — Repository audit (read-only, orchestrated)

**Decision:** A full evidence-based audit (performance, architecture, security, tests,
i18n/a11y, UX) was run via the `orchestrator` dispatching six specialists in parallel.
Findings + a waved remediation plan live in `docs/audit-2026-06-17.md`.

**Why / durable facts:** Code is O(n)-clean; the cost is delivery — the whole home page is
client-rendered, Framer Motion is ~71 KB gz, no RSC offload. Top gaps: no CSP, `next` 16.1.6
HIGH advisories, broken coverage tooling (`@vitest/coverage-v8` not installed), partial
`prefers-reduced-motion`, and a hardcoded Blog section. **Open decision (DESIGN-1):** permit
tuned (non-default) springs in the carousel vs. enforce the constant-duration rule —
unresolved.

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
