---
name: voyager-operating-principles
description: "Use when evaluating a decision, feature request, or business direction against Voyager's operating principles."
argument-hint: "[decision or situation to evaluate]"
allowed-tools: [Bash, Read, Grep, Glob, Agent, TodoWrite]
user-invocable: true
owner: Ben
last_reviewed: 2026-04-21
---

# Voyager Operating Principles

Reference when making decisions, evaluating build requests, or advising on direction.

## The principles

### 1. Operate first, build second
Before building, ask: can an existing system handle this with better configuration or workflow? Building creates maintenance. Operating creates leverage.
**Test:** "Is there a Notion workflow, MCP tool, or existing Portal feature that solves this?"

### 2. Boring beats clever
Simple, predictable systems beat clever architectures. The system that works at 2am is the one with fewest moving parts.
**Test:** "Would a junior dev understand this in 5 minutes?"

### 3. Monthly recurring > one-off
Every deliverable should have a logical continuation. Retainer-first model.
**Test:** "Does this create a reason for the client to keep paying next month?"

### 4. Client outcomes > agency metrics
Optimise for what the client cares about (calls, leads, revenue) not what's easy to measure (rankings, DA, impressions).
**Test:** "Would the client's owner see this as meaningful to their business?"

### 5. Systems over heroics
If a task needs doing more than once, document it, automate it, or make it a skill.
**Test:** "Could Alex (or a future hire) do this without asking Ben?"

### 6. Proactive > reactive
Flag issues before clients notice. Send updates before they ask.
**Test:** "Is there anything the client will ask about next week we can address today?"

## How to apply

When asked to evaluate a situation:
1. List which principles apply
2. State whether each supports or flags the proposed action
3. Give a verdict: **proceed / modify / hold**
4. If "hold" — suggest the operating alternative

## Common patterns

| Situation | Principle triggered | Typical verdict |
|-----------|--------------------|-----------------| 
| "Should we build X feature?" | Operate first | Check Portal + MCP first |
| "Let's add another dashboard" | Boring beats clever | Only if existing one is broken |
| "One-off client request" | Monthly recurring | Find the retainer angle |
| "Client asking about rankings" | Client outcomes | Redirect to leads/calls |
| "We keep forgetting to do X" | Systems over heroics | Document or automate it |
