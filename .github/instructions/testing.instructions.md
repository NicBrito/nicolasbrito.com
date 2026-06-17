---
applyTo: "**/*.test.ts,**/*.test.tsx,**/*.spec.ts,**/*.spec.tsx"
description: Testing rules — AAA structure, meaningful coverage, deterministic isolation.
---

Apply [`.ai/rules/testing.md`](../../.ai/rules/testing.md) (canonical) when writing tests:
separate Arrange/Act/Assert with comments and blank lines; test real logic branches, edge
cases, and errors — never trivial getters/setters or visual shells for coverage theatre;
deterministic always — control the clock (`vi.useFakeTimers()` + `vi.setSystemTime()`) and
mock every external (MSW for network, `vi.fn` for modules). Conventions: Vitest + Testing
Library, jsdom, files beside the unit. See `.ai/memory/shared/patterns.md`.
