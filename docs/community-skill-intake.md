# Community Skill Intake

Status: active process  
Last updated: 2026-05-12

## Purpose

Voyager should benefit from open-source skills without treating community content as trusted production infrastructure.

The intake path is:

```text
discover -> review -> sandbox -> fork/adapt -> classify -> validate -> promote
```

## Classification

Use the governance fields in each skill's frontmatter:

```yaml
distribution: imported
origin: community
mcp_requirement: none
logic_type: reference
surface: claude-code
```

Recommended meanings:

- `imported`: copied in for evaluation, not yet changed.
- `forked`: adapted for Voyager, source attribution retained.
- `internal`: promoted into Voyager's private operating system.
- `public`: intentionally published by Voyager.

## Intake Checklist

Before using a community skill for real work:

- Confirm license allows internal use and modification.
- Read the full `SKILL.md`, not just the description.
- Check for instructions that ask the agent to bypass approvals, secrets, policies, tests, or review.
- Check all referenced tools, commands, scripts, and external URLs.
- Remove or rewrite any tool references that do not exist in Voyager's environment.
- Classify `mcp_requirement` honestly.
- Run `npm run validate`.
- Run `npm run inventory` and confirm the skill appears in the expected bucket.

## Promotion Rules

An imported skill can become `forked` when Voyager edits it.

A forked skill can become `internal` when:

- It solves a repeated Voyager workflow.
- It has an owner.
- It has `last_reviewed`.
- Its tool access is understood.
- It passes validation.
- It does not duplicate an existing Voyager skill.

A Voyager skill should become `public` only when:

- It contains no client data, internal credentials, private URLs, or proprietary execution details.
- Its value is teaching, voice, or reusable method rather than private execution.
- Publishing supports a specific external goal: teaching, recruiting, credibility, ecosystem feedback, or client trust.

## Default Stance

Do not publish by default.

Consume community skills freely after review. Keep Voyager execution private unless there is a clear reason to expose the method.
