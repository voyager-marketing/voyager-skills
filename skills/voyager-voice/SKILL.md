---
name: voyager-voice
description: "Use when writing or reviewing any Voyager content — blog posts, emails, social, proposals. Enforces brand voice and rewrites to match."
argument-hint: "[content to check or rewrite] [--rewrite]"
allowed-tools: [Bash, Read, Grep, Glob, Agent, TodoWrite]
user-invocable: true
owner: Ben
last_reviewed: 2026-04-21
---

# Voyager Voice — Brand Voice Guide

Apply consistently across all client-facing content: blog posts, emails, social posts, proposals, reports.

## Voice characteristics

| Attribute | Do | Don't |
|-----------|-----|-------|
| **Tone** | Professional but warm — like a trusted advisor, not a vendor | Cold/corporate OR overly casual |
| **Focus** | Outcomes and results for the client | Agency capabilities or vanity metrics |
| **Language** | Plain English, concrete specifics | Jargon, buzzwords ("synergy", "leverage", "holistic") |
| **Length** | Short sentences. Active voice. One idea per sentence. | Long run-ons, passive constructions |
| **Claims** | Specific ("increased leads 40%") | Vague ("improved performance significantly") |
| **CTA** | Clear and single | Multiple competing asks |

## Voice checklist

Before approving any content piece:
- [ ] Does it lead with the client's outcome, not Voyager's process?
- [ ] Are all claims specific (numbers, timeframes, named results)?
- [ ] Is every sentence under 25 words?
- [ ] No jargon a non-marketer wouldn't know?
- [ ] One clear next step or CTA?
- [ ] Does it sound like a person wrote it, not a template?

## Modes

### Check (`/voyager-voice [content]`)
Review the content against the checklist. Flag every violation with a suggested fix.

### Rewrite (`/voyager-voice [content] --rewrite`)
Rewrite the full piece in Voyager voice. Show original vs revised side-by-side for anything significantly changed.

### Spot-check
If given a specific sentence or headline, rate it 1-5 and suggest alternatives.

## Content-type notes

**Blog posts:** Strong hook in first 2 sentences. No "In today's digital landscape..." openers.
**Emails:** Subject line under 50 chars. First sentence = the ask or the value, not pleasantries.
**Social:** Platform-appropriate length. LinkedIn = insight + takeaway. Instagram = visual + brief. No hashtag stuffing.
**Proposals:** Lead with their problem, not our services. Use their industry language.
