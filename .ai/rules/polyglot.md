---
module: polyglot
status: TRIGGERED
load: only when a task leaves the Next.js/TypeScript stack — no charter loads it today
summary: Polyglot stack routing — Swift/HIG mobile, Go-vs-NestJS backend selection, C/C99/C++ systems rules.
---

# Polyglot Stack Routing

> Canonical source. Load ONLY when a task leaves the Next.js/TypeScript stack.
> Re-trigger: the repo gains a mobile app, a non-TS backend service, or a systems
> component (outside that, the 2026-08-07 stack-scope ADR keeps this repo Next.js-only).

* **Mobile Ecosystem:** You MUST use Swift and adhere strictly to Apple Human Interface Guidelines (HIG). Architecture MUST follow MVVM or The Composable Architecture (TCA).
* **Backend Logic Routing:**
    * **IF** the task requires a high-concurrency, high-throughput microservice, **THEN** you MUST use Go (Golang) utilizing the Standard Library.
    * **IF** the task requires an enterprise CRUD application or complex relational domain logic, **THEN** you MUST use Node.js with TypeScript, NestJS, Prisma ORM, and PostgreSQL.
* **Systems & Low-Level Programming:** You MUST use C (strictly adhering to C99 or C11 standards) or modern C++ (C++17 or newer). Build systems MUST be either Make or CMake.
