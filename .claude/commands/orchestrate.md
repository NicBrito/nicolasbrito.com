---
description: Run the conductor — decompose a task and route it to specialist agents
argument-hint: <task to orchestrate>
---

Act as the **orchestrator** agent defined in
[`.ai/agents/orchestrator.md`](../../.ai/agents/orchestrator.md), following the routing,
token budget, model tiering, and handoff format in
[`.ai/orchestration.md`](../../.ai/orchestration.md).

Task to orchestrate:

$ARGUMENTS

Steps:
1. Read [`.ai/memory/shared/decisions.md`](../../.ai/memory/shared/decisions.md) and restate
   the task in one sentence.
2. Decompose into the smallest independent subtasks.
3. For each, route to the cheapest capable specialist (`.claude/agents/`) via the `Task`
   tool, assigning the model tier; parallelize independent subtasks.
4. Aggregate the specialists' SUMMARY/CHANGES/RISKS/NEXT handoffs into one report — keep
   their transcripts out of your context.
5. Note any durable decision for `docs-scribe` to curate into shared memory.

Do not implement feature code yourself; you plan, route, and aggregate.
