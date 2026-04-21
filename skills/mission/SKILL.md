---
name: mission
description: "Use when starting a major build session — frame the mission, define done, check against operating principles before writing code."
argument-hint: "[feature or project description]"
allowed-tools: [Bash, Read, Grep, Glob, Agent, TodoWrite]
user-invocable: true
owner: Ben
last_reviewed: 2026-04-21
---

# Mission — Session Framing

Before writing code, define what you're actually trying to accomplish and why. Anchors the session and prevents scope creep.

## Operating principles check (run first)

Before any build, apply Voyager's principles:
- **Operate first, build second** — can an existing tool (Notion, MCP, existing Portal feature) solve this without building?
- **Boring beats clever** — is the simplest implementation sufficient?
- **Monthly recurring > one-off** — does this create leverage or just solve one problem once?

If any principle flags "hold," surface it before proceeding.

## Mission brief format

```
## Mission: [Name]

**Problem:** What breaks or is missing today? Who feels the pain?

**Proposed solution:** One sentence. What are we building?

**Done looks like:** 3-5 bullet points describing the finished state a non-technical person could verify.

**Minimum viable version:** What's the smallest thing that proves this works?

**Out of scope:** What are we explicitly NOT doing this session?

**Risks:** What could go wrong? What's the fallback?

**Success metric:** How will we know in 30 days this was worth building?
```

## Procedure

1. Ask clarifying questions if the feature is vague
2. Apply the operating principles check — flag if "operate first" applies
3. Output the mission brief
4. Confirm with the user before starting implementation
5. Pin the brief at the top of the session (refer back when scope creep appears)

## Guardrails

- If the answer to "operate first" is yes, recommend the operating solution and only proceed to build if the user explicitly chooses build
- Cap mission briefs at one page — if it's longer, use `/project-splitter` first
- Never start implementation in the same response as the mission brief — confirm first
