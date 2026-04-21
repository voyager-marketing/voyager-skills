---
name: voyager-client-message
description: "Use when drafting client-facing messages — project updates, deliverable handoffs, check-ins, or escalations."
argument-hint: "[client] [update|delivery|checkin|escalation] [context]"
allowed-tools: [Bash, Read, Grep, Glob, Agent, TodoWrite]
user-invocable: true
owner: Ben
last_reviewed: 2026-04-21
---

# Voyager Client Message

Draft polished, on-brand client messages. Always warm, specific, and outcome-focused.

## Modes

### `update` — Project status update
Use when: reporting progress mid-project or at a milestone.
```
Subject: [Project Name] — Update

Hi [Name],

Quick update on [project]: [what's done]. [what's next + ETA].

[If there's a blocker]: We need [X] from you by [date] to stay on track.

[Name]
```

### `delivery` — Sending a deliverable
Use when: handing off a completed piece of work for review or approval.
```
Subject: [Deliverable] — Ready for your review

Hi [Name],

[Deliverable] is ready: [link or attachment].

[1-2 sentences on what they're looking at and what you want from them — approve, give feedback, etc.]

Deadline for feedback: [date, if any].

[Name]
```

### `checkin` — Proactive touchpoint
Use when: no active project but maintaining the relationship. Monthly or when triggered by a signal.
```
Subject: Checking in — [month or context]

Hi [Name],

[Specific observation about their business, site, or results — NOT generic]. [One question or offer.]

[Name]
```

### `escalation` — Flagging an issue diplomatically
Use when: something went wrong or is at risk. Lead with facts, not apologies. Give the path forward.
```
Subject: [Issue] — heads up + next steps

Hi [Name],

[What happened — one sentence, factual, no blame]. [Impact].

Here's what we're doing: [action + timeline].

[What we need from them, if anything].

[Name]
```

## Voice rules

- No "I hope this email finds you well" or similar filler
- Lead with the most important thing (not pleasantries)
- Keep emails under 150 words unless complexity requires more
- Specific dates > "soon" or "shortly"
- One ask per email — don't combine requests

## Usage

Give the mode, client name, and any relevant context. The skill will draft the message and ask if you want adjustments before sending.
