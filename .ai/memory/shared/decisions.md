# Decision Log

Durable architectural decisions and their rationale. Newest first. One entry per
decision. Record *why*, not just *what* — the code already shows the *what*.

---

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
