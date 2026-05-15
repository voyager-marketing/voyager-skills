---
name: social
description: >
  Use when creating, planning, repurposing, or reviewing social content for a
  client across Instagram, LinkedIn, X, Facebook, TikTok, Pinterest, and Google
  Business.
  Default mode is from-scratch creation given a topic. Other modes: fill the
  calendar, repurpose a URL, draft a quick post, or check analytics.
  Triggers on: "create social posts for [client]", "draft a [platform] post
  about [topic]", "fill [client]'s social calendar", "repurpose [URL] into
  social", "how is social performing for [client]".
owner: Ben
last_reviewed: 2026-05-15
distribution: internal
origin: voyager
mcp_requirement: required
logic_type: tool-wrapper
surface: all
allowed-tools:
  - mcp__claude_ai_Voyager_MCP__social_create_session
  - mcp__claude_ai_Voyager_MCP__social_create_post
  - mcp__claude_ai_Voyager_MCP__social_update_post
---

# Social

Create, plan, repurpose, or review social content for a Voyager client. Use the MCP `social_create_session` composite first; it gathers client context, calendar state, research/repurpose output, analytics, conflicts, and draft candidates without creating posts.

Reference: `references/platform-playbook.md` remains the agency source for platform limits, posting windows, content mix, hashtag rules, and hard guardrails.

Hard policy: every created post must remain `Draft`. Moving to `Scheduled` or `Published` requires explicit user instruction via `social_update_post`.

## Intent Picker

- `create`: topic-based social drafts. Default when the user gives a client + topic.
- `calendar`: weekly/monthly plan or "what should we post?"
- `repurpose`: explicit source URL/blog.
- `quick`: one platform, one fast post.
- `analytics`: read-only performance check.

If client, platform, topic, URL, or intent is ambiguous, ask before calling MCP.

## Session Call

```ts
social_create_session({
  client,
  intent,
  topic,
  source_url,
  platforms,
  timeframe_days
})
```

The MCP returns:

- `client_context`: brand voice, timezone, primary platforms.
- `calendar_conflicts`: recent or upcoming posts that may overlap.
- `drafts`: review-ready captions or plan items.
- `research_topics`: calendar/create ideas when relevant.
- `analytics`: read-only summary for analytics mode.
- `next_actions`: what to do after review.

## Approval Flow

1. Render the session summary and drafts.
2. Surface calendar conflicts before the drafts.
3. Ask: `Approve all / edit specific / discard?`
4. Do not call `social_create_post` until the user explicitly approves.
5. On approval, call `social_create_post` for each approved draft with `status` left as Draft by the tool.

For batches over 3 posts, confirm twice: first approve the plan, then approve draft creation.

## Output

```md
## Social Session: {Client}
Mode: {intent}
Platforms: {platforms}
Brand voice: {summary}
Calendar conflicts: {n}

### Drafts
#### {Platform}
{caption}
First comment: {first_comment if present}
Suggested time: {scheduled_for if present}
Media needed: {media_needed if present}

Approve all / edit specific / discard?
```

For analytics mode, render platform performance and recommendations only. Do not create posts.

## Hard Guardrails

1. NEVER publish directly. All posts are `Draft` until explicit user instruction via `social_update_post`.
2. NEVER schedule without explicit user instruction.
3. NEVER ignore platform limits. Revise, do not truncate.
4. NEVER post identical content cross-platform.
5. NEVER assume timezone. Use the MCP-returned client timezone or ask.
6. NEVER skip the hook. First line is 80% of performance.
7. ALWAYS flag media needs with dimensions/format when known.
8. ALWAYS attribute repurposed content to the source URL where appropriate.
9. ALWAYS surface calendar conflicts and recent-topic duplication.
10. Confirm with the user before creating more than 3 draft posts.

## Handoff Phrases

- "edit the Instagram caption" -> revise in chat, then create only after approval.
- "create the drafts" -> call `social_create_post` for approved drafts, still Draft status.
- "schedule them all" -> requires explicit `social_update_post` calls.
- "track performance" -> run `social_create_session` with `intent="analytics"`.
