# Context Routing
CRITICAL: Do not read this file. Your global directives and project constitution are located strictly at `.ai/constitution.md`. Read and process that file completely before generating any code.

## Agent Orchestration
This repo runs a layered, multi-platform agent system. Overview: `AGENTS.md`. Specialist
charters: `.ai/agents/` (mirrored as dispatchable subagents in `.claude/agents/`; run the
conductor with `/orchestrate`). Routing + token budget: `.ai/orchestration.md`. Durable
knowledge: `.ai/memory/shared/`. Load only the rule modules (`.ai/rules/`) your task needs.