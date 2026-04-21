---
name: voyager-feature-spec
description: "Use when specifying a new feature before building — problem statement, user stories, data model, API surface, UI flows, edge cases, success metrics."
argument-hint: "[feature idea or request]"
allowed-tools: [Bash, Read, Grep, Glob, Agent, TodoWrite]
user-invocable: true
owner: Ben
last_reviewed: 2026-04-21
---

# Voyager Feature Spec

Write a full specification before touching code. Catches ambiguity, surfaces edge cases, and produces a Notion-ready doc.

## Operating principles check

Before speccing:
- Is this a build or an operate problem? (Notion + existing MCP tools = operate)
- Does this create recurring leverage or solve a one-off?
- What's the simplest version that's worth building?

## Spec template

```markdown
## Feature: [Name]

### Problem
What breaks or is missing? Who experiences it? How often?

### Proposed solution
One paragraph. What does the feature do?

### User stories
- As [Alex/Ben/client], I want to [action] so that [outcome]
- ...

### Data model
- New tables or columns: ...
- Modified tables: ...
- Supabase migrations needed: yes/no

### API surface
- New endpoints: POST /api/...
- Modified endpoints: ...
- New server actions: ...

### UI flows
- Entry point: where does the user start?
- Happy path: step-by-step
- Error states: what can go wrong, how is it handled?

### Edge cases
- ...

### Out of scope
- ...

### Success metrics
- How do we measure this worked in 30 days?

### Implementation order
1. [Data model first]
2. [Server actions / API]
3. [UI]
4. [Tests]
```

## Stack reminders

- Auth: Clerk (`auth()` from `@clerk/nextjs/server`)
- DB: Supabase — use `createClient()` server-side, `createAdminClient()` for RLS bypass
- Actions: `createSafeActionClient()` from `next-safe-action`, return `ActionResponse<T>`
- Tasks: Trigger.dev v4 — no `setTimeout`, no `Promise.all(triggerAndWait)`
- UI: Shadcn/UI components, Tailwind mobile-first, RSC by default

## Output

Produce the spec as markdown. Offer to save it to Notion as a child page under the relevant client or project.
