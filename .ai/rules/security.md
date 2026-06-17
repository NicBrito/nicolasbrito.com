---
module: security
status: ALWAYS ACTIVE
load: security-analyst, backend/architecture tasks; Copilot applyTo src/app/api/**, src/proxy.ts, **/middleware.*
summary: Zero-trust posture, boundary input validation (zod), parameterized queries, Argon2id/Bcrypt, mandatory pre-execution RBAC checklist.
---

# Security Rules

> Canonical source. Load for any task touching inputs, data access, auth, or network boundaries.

* **Zero Trust Architecture:** Assume all networks, users, and inputs are hostile by default.
* **Input Validation:** Trust no input. All incoming data (payloads, parameters, headers) MUST be validated against strictly defined schemas at the boundary layer (e.g., utilizing `zod` in TypeScript).
* **Database Security:** You MUST use parameterized queries or native ORM parameterization exclusively. SQL injection vectors MUST be rendered structurally impossible. String concatenation for SQL queries is STRICTLY BANNED.
* **Authentication & Cryptography:** Password hashing MUST utilize Argon2id or Bcrypt. The use of MD5, SHA-1, or custom cryptographic implementations is STRICTLY FORBIDDEN.
* **Pre-Execution Checklist:** Before finalizing and outputting any backend route, endpoint, or database mutation, you MUST perform a silent internal verification confirming that rigorous input validation and Role-Based Access Control (RBAC) have been applied.
