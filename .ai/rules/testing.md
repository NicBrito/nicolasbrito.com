---
module: testing
status: TRIGGERED ON ALL LOGIC, QA, AND REFACTORING TASKS
load: test-engineer, refactoring tasks; Copilot applyTo **/*.{test,spec}.{ts,tsx}
summary: Structural AAA separation, coverage integrity (logic over vanity metrics), deterministic isolation with mocked externals.
---

# Testing Rules

> Canonical source. Load for any logic, QA, or refactoring task.

* **Structural Format:** Every test block MUST visually and structurally separate the AAA pattern (Arrange, Act, Assert) using distinct comments and clear blank lines.
* **Coverage Integrity:** It is STRICTLY FORBIDDEN to write superficial tests for trivial methods (e.g., simple getters, setters, or purely visual UI shells) solely to artificially inflate coverage metrics. You MUST focus testing resources exclusively on business logic branches, edge cases, error handling, and algorithmic complexity.
* **Determinism & Isolation:** Flaky tests are BANNED. Tests must pass or fail deterministically 100% of the time. You MUST mock all external dependencies, network API calls, database connections, and system clocks using standard framework interceptors (e.g., MSW for networks, native Vitest/Jest mocks for modules).
