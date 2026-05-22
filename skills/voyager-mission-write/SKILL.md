---
name: voyager-mission-write
description: "Use when writing a Chat-to-Code handoff for a Voyager build, bugfix, audit, or repo task that should become a Notion dispatch task and start in Code with /mission."
argument-hint: "[mission or task brief]"
allowed-tools: [mcp__claude_ai_Notion__notion-search, mcp__claude_ai_Notion__notion-fetch, mcp__claude_ai_Notion__notion-create-pages, mcp__claude_ai_Notion__notion-update-page]
user-invocable: true
owner: Ben
last_reviewed: 2026-05-22
distribution: internal
origin: voyager
mcp_requirement: optional
logic_type: workflow
surface: claude-chat
---

# voyager-mission-write

Write a clean Chat-to-Code handoff for Voyager work. Chat frames the work, Notion stores the dispatch task, and Code starts with `/mission`.

## When to use

Use this when Ben wants a build, bugfix, audit, research pass, or repo task handed to Code. Do not use it for quick answers, client-facing copy, or work that can be finished inside the current Chat.

## Notion convention

- Use Notion MCP as the source for project and task context.
- Prefer full-page Markdown reads when reviewing project pages, prior discoveries, specs, or handoff notes.
- Write task bodies as Markdown in one page create/update operation when the tool surface supports it.
- Put start markers and handoff notes in task comments or block discussions when comments are available. Do not use `Agent Notes` as a chronological log.
- Link to GitHub, project pages, specs, and discoveries instead of pasting full source bodies into Notion.

## Procedure

1. Confirm the target repo, task goal, autonomy level, and any hard constraints.
2. Check whether an existing Notion task already covers the work. Reuse it when possible.
3. Create or update a Tasks DB row with:
   - `Name`: concise task title.
   - `Repo`: the target repo select when available.
   - `Labels`: include `dispatch`; add priority labels only when justified.
   - `Status`: `Up Next` unless Ben asks for another state.
   - `Autonomy Mode`: `Plan`, `Execute`, or `Plan+Execute` based on the request.
4. Write a Markdown handoff that Code can execute without reading the whole Chat.
5. Tell Ben the task URL and the first Code command: `/mission`.

## Handoff template

```markdown
## Goal

One paragraph. What should Code accomplish?

## Context

- Repo:
- Related Notion pages:
- Related GitHub issues or PRs:
- Current known state:

## What to do

1. First concrete step.
2. Second concrete step.
3. Verification step.

## Acceptance criteria

- A non-technical person can verify this outcome.
- Tests or validation commands pass.
- Changelog or session note is updated if the repo requires it.

## Out of scope

- Explicit exclusions.

## Start in Code

Run `/mission` in the target repo. Read this task, the linked project page, and relevant Discoveries before editing files.
```

## Guardrails

- Do not over-spec implementation details that Code should discover from the repo.
- Do not create duplicate tasks when an existing dispatch task can be updated.
- Do not mark work as autonomous if Ben asked for planning only.
- Do not paste `SKILL.md` bodies or large source files into Notion. Link to GitHub or repo paths.
