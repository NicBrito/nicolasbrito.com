---
module: architecture
status: ALWAYS ACTIVE
load: backend, performance, security, refactoring tasks
summary: Engineering core — strict typing, Big-O discipline, dependency governance, stack routing, error envelopes, structured observability.
---

# Architecture Rules

> Canonical source. Load for any task that writes or restructures logic.

* **Engineering Core:** Strict static typing is MANDATORY. The use of dynamic languages without strict type definitions (e.g., vanilla JavaScript, untyped Python) is STRICTLY BANNED in production code. The compiler is the first line of defense.
* **Algorithmic Efficiency:** You MUST prioritize time and space complexity (Big-O). Avoid nested loops and brute-force solutions where Hash Maps, Sets, or optimized data structures can effectively reduce complexity.
* **Dependency Governance:** You are STRICTLY FORBIDDEN from introducing new third-party packages (e.g., npm/go mod installations) to solve trivial logic problems. Rely entirely on the Standard Library or existing project dependencies unless explicitly authorized by the user.
* **Frontend Ecosystem:** You MUST use TypeScript (`strict: true`), React, Next.js (App Router exclusively), and Tailwind CSS for web interfaces.
* **Mobile Ecosystem:** You MUST use Swift and adhere strictly to Apple Human Interface Guidelines (HIG). Architecture MUST follow MVVM or The Composable Architecture (TCA).
* **Backend Logic Routing:**
    * **IF** the task requires a high-concurrency, high-throughput microservice, **THEN** you MUST use Go (Golang) utilizing the Standard Library.
    * **IF** the task requires an enterprise CRUD application or complex relational domain logic, **THEN** you MUST use Node.js with TypeScript, NestJS, Prisma ORM, and PostgreSQL.
* **Systems & Low-Level Programming:** You MUST use C (strictly adhering to C99 or C11 standards) or modern C++ (C++17 or newer). Build systems MUST be either Make or CMake.
* **Error Handling & API Responses:** You MUST implement graceful error handling. Backend APIs MUST return standardized error envelopes (e.g., structured JSON with standard HTTP status codes). You are STRICTLY FORBIDDEN from leaking internal stack traces or database errors to the client.
* **Observability:** The use of primitive logging (e.g., `console.log`, `print`) in production code is BANNED. You MUST use structured logging libraries (e.g., Pino, Winston, or Go's `slog`) and guarantee that no Personally Identifiable Information (PII) is ever logged.
