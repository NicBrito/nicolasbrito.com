---
module: git
status: TRIGGERED
load: any agent that runs git — frontend-architect, performance-engineer, security-analyst, test-engineer, and the general assistant
summary: Git governance — Conventional Commits format, no AI attribution, merge-commits-only, branch naming and lifecycle.
---

# Git Rules

> Canonical source. Load for any task that creates commits, branches, or pull requests.

The Git conventions below bind every agent, commit, and branch:

* **Commit format** — every message is `type(scope): subject` (Conventional Commits, enforced by the commitlint `commit-msg` hook) followed by a body of concise bullets naming the main changes. Keep messages clean, direct, and brief: state what changed, nothing more.
* **No AI attribution** — commit messages MUST NOT carry any AI-authorship trailer or credit: no `Co-Authored-By:` line naming an AI agent (e.g. Claude), no "Generated with…" or "Co-authored with an AI" note. Every commit is authored solely by Nicolas.
* **Merge preserves full history** — integrate branches with MERGE COMMITS only; NEVER squash or rebase a pull request. The complete commit history is always carried from branch to the `main` trunk.
* **Branch naming** — branches use a Conventional-Commits prefix + a short kebab-case scope: `feat/…`, `fix/…`, `docs/…`, `chore/…`, `refactor/…`, `test/…`, `perf/…` (e.g. `fix/reduced-motion-hover`). `main` is the permanent trunk; every other branch is temporary.
* **Branch lifecycle** — a temporary branch is deleted the moment its PR merges (GitHub auto-deletes the head branch; delete any local copy too). Keep the repository clean, stable, and well-structured — no stale branches.
