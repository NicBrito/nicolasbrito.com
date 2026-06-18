# Decision Log

Durable architectural decisions and their rationale. Newest first. One entry per
decision. Record *why*, not just *what* — the code already shows the *what*.

---

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
