---
applyTo: "src/**/*.ts,src/**/*.tsx"
description: Architecture rules — strict typing, Big-O, dependency governance, error handling, observability.
---

Apply [`.ai/rules/architecture.md`](../../.ai/rules/architecture.md) (canonical) when editing
these files: strict static typing (the compiler is the first defense); prefer Hash Maps/Sets
over nested loops; introduce **no** new dependencies for trivial logic; standardized error
envelopes with no stack-trace/PII leakage; structured logging, never `console.log` in
production paths.
