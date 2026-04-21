---
name: project-splitter
description: "Use when a feature or project is too large for one session — splits into ordered, shippable slices with scope estimates and dependency map."
argument-hint: "[feature or project description]"
allowed-tools: [Bash, Read, Grep, Glob, Agent, TodoWrite]
user-invocable: true
owner: Ben
last_reviewed: 2026-04-21
---

# Project Splitter

Break a large feature into independent, shippable slices. Prioritizes risk reduction first, user value second.

## Splitting principles

1. **Each slice ships independently** — no slice should require another to be useful
2. **Data model first** — schema changes before any UI
3. **Parallel-friendly** — flag slices that can run in parallel worktrees
4. **Smallest useful thing** — prefer 5 small slices over 2 large ones
5. **Apply operating principles** — flag any slice that should be an operate solution instead

## Output format

Produce a table suitable for a Notion sprint board:

```
## [Feature Name] — Sliced

| # | Slice | Deliverable | Size | Deps | Parallel? | Notes |
|---|-------|-------------|------|------|-----------|-------|
| 1 | Data model | Supabase migration + types | S | none | no | Always first |
| 2 | Server actions | CRUD actions + Zod schemas | S | 1 | no | |
| 3 | API route | GET /api/... + auth | S | 1 | yes | Parallel with 4 |
| 4 | Core UI | RSC page + data fetch | M | 2 | yes | |
| 5 | Edge cases | Empty states, errors, loading | S | 4 | no | |
| 6 | Tests | Unit + integration | S | 2,4 | yes | |

**Size key:** S = <2 hours, M = 2-4 hours, L = 4+ hours (consider splitting further)

**Recommended session order:** 1 → 2 → [3+4 parallel] → 5 → 6

**Operate alternatives found:** [any slices that could be replaced with existing tools]
```

## Guardrails

- Flag any slice sized L — suggest splitting further
- If the total is >10 slices, ask whether the full feature is the right scope
- Always put data model + migrations as slice 1
- Call out slices that touch shared infrastructure (auth, RLS, Trigger.dev) — those need extra care
