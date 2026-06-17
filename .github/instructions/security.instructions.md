---
applyTo: "src/app/**/route.ts,src/app/api/**,src/proxy.ts,**/middleware.ts,**/*.action.ts"
description: Security rules — zero-trust validation, parameterized queries, crypto, RBAC.
---

Apply [`.ai/rules/security.md`](../../.ai/rules/security.md) (canonical) at every boundary:
validate all inputs against a strict schema (`zod`) before use; parameterized queries / ORM
parameterization only (never string-built SQL); Argon2id or Bcrypt for passwords (no
MD5/SHA-1/custom crypto); confirm input validation **and** RBAC before finalizing any
route/mutation; never leak stack traces, DB errors, or PII.
