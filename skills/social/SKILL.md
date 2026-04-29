---
name: social
description: >
  Use to create, plan, or repurpose social content for a client across Instagram,
  LinkedIn, X, Facebook, TikTok, Pinterest, and Google Business. Default mode is
  from-scratch creation given a topic — no source material required. Other modes:
  fill the social calendar from research, repurpose an existing blog or URL,
  draft a single quick post, or check analytics. Schedules drafts via Portal MCP
  with status=Draft until explicitly approved for scheduling. Triggers on:
  "create social posts for [client]", "draft a [platform] post about [topic]",
  "write a tweet about [X]", "fill [client]'s social calendar", "what should we
  post for [client] this week", "repurpose [URL] into social", "social posts
  from [URL]", "how is social performing for [client]".
owner: Ben
last_reviewed: 2026-04-29
---

# Social

Create, plan, or repurpose social content for a Voyager client. The default mode is **from-scratch creation given a topic** — no blog or URL required. Repurposing is one of several modes, not the headline.

**Reference:** `references/platform-playbook.md` is the agency-wide source of truth for platform character limits, peak posting windows, content quality rules, hashtag strategy, content mix targets, and hard guardrails. Read it before drafting captions or scheduling.

**Hard policy:** every post is created with `status=Draft`. Promotion to `Scheduled` or `Published` requires explicit user instruction via `social_update_post`. This skill never publishes directly.

---

## Modes

| Mode | When to use | Primary MCP tools |
|---|---|---|
| **Create** (default) | Alex provides a topic, no source material | `social_get_calendar`, `social_create_post` |
| **Calendar** | Plan a week or month, possibly from research | `social_research_topics`, `social_get_calendar`, `social_create_post` (batch) |
| **Repurpose** | A specific blog or URL exists as source | `social_repurpose_url` or `social_trigger_from_blog`, `social_create_post` |
| **Quick post** | One-shot, one platform, no client context juggling | `social_create_post` |
| **Analytics** | Read-only check on what's performing | `social_get_analytics`, `social_list_posts` |

Pick by intent. If ambiguous, default to **Create** and ask the user to confirm.

---

## Mode 1 — Create from topic (default)

Use when the user asks "create social posts for [client] about [topic]" or "draft an Instagram post about [topic]" with no source URL.

### Flow

1. **Resolve client.** From the user's phrasing or `--client=<name>`. Look up `client_id`, `brand_voice`, primary platforms, and timezone from the client's Notion CRM row. If brand voice is unclear, **ask** before drafting — never assume.
2. **Resolve platform(s).** If the user named a platform ("Instagram post about X"), use only that. If unspecified, default to the client's primary 3 (typically Instagram + LinkedIn + Facebook for B2C; LinkedIn + X for B2B).
3. **Calendar check.** Run `social_get_calendar(client_id, from=today, to=+7days)` to avoid clustering. If a similar post is already scheduled within 14 days, surface it and ask whether to skip or angle differently.
4. **Generate drafts.** One post per platform, written platform-native (see `references/platform-playbook.md` for hooks, hashtag strategy, character limits per platform).
5. **Show drafts in chat for review.** Do NOT call `social_create_post` until the user approves.
6. **On approval, schedule as Draft:**

```
social_create_post(
  client_id,
  caption,
  platforms,
  publish_date,        # in client's local timezone
  scheduled_time,      # peak window per platform-playbook
  first_comment        # Instagram hashtags only
)
```

Status defaults to Draft. Alex flips to Scheduled in Portal once final.

### Output to user (chat)

```
## Social Drafts: {Client} — {Topic}

### Instagram
[caption]

First comment (hashtags):
[20-30 hashtags]

Suggested time: Tue 11am ET (next peak window per platform-playbook)
Media needed: [image/video description + dimensions]

### LinkedIn
[caption]
[3-5 hashtags inline at end]
Suggested time: Wed 9am ET

[continue per platform...]

---
Approve all / edit specific / discard?
```

---

## Mode 2 — Calendar (plan ahead)

Use when the user asks "fill [client]'s social calendar" or "what should we post for [client] this week."

### Flow

1. Resolve client + timeframe (default: next 7 days).
2. **Research topics:**

```
social_research_topics(
  client_name,
  industry,
  brand_voice,
  existing_topics,     # pull from social_list_posts(last 30 days)
  count=10
)
```

3. Returns topic angles with platform, content type (educational/promotional/social-proof/behind-scenes), and hook line for each. Per `platform-playbook.md`, target content mix: 40% value, 25% social proof, 20% behind-scenes, 15% promotional.
4. Present the plan to the user as a calendar table (date / platform / topic / hook / content type).
5. On approval, batch-create as Drafts via repeated `social_create_post`. Pause 2 sec between calls.

### Confirm before batch-creating > 3 posts

The platform-playbook hard guardrail: confirm before creating more than 3 posts at once. Show the plan, get explicit approval, then create.

---

## Mode 3 — Repurpose from blog or URL

Use only when the user has an explicit source ("repurpose [URL] into social", "social posts from [blog URL]", "turn this blog into social").

### From a freshly-published blog (async)

```
social_trigger_from_blog(
  post_url,
  platforms      # ["instagram","linkedin","facebook","twitter"]
)
```

Returns a `taskId`. Generated captions land in Notion (Type=Social, Status=In Review) for Alex to review in the Portal content planner.

### From any URL on demand (sync)

```
social_repurpose_url(
  url,
  platforms,
  client_name,
  brand_voice
)
```

Returns ready-to-use platform captions immediately. **Extract 2-3 distinct angles** from the source rather than just summarizing — one post per angle, not one post per platform-of-the-same-thing. Show drafts for approval, then schedule via `social_create_post`.

---

## Mode 4 — Quick post (one-shot)

Use for "write a tweet about X", "Instagram caption for X", "quick LinkedIn post on X" — when the user wants one post, one platform, fast.

### Flow

1. Confirm client (or ask).
2. Confirm platform (from the user's phrasing).
3. Generate one caption respecting platform-playbook rules.
4. Show the draft.
5. On approval, `social_create_post` for that single platform.

Skip calendar check unless the user asks. This mode is optimized for speed.

---

## Mode 5 — Analytics check (read-only)

Use for "how is social performing for [client]" or "social analytics for [client]."

```
social_get_analytics(
  client_id,
  from,             # default: 30 days ago
  to,               # default: today
  platforms?        # default: all
)
```

Plus, for context:

```
social_list_posts(client_id, status="published", from=30d, to=today)
```

Output a summary table: platform | posts published | reach | engagement rate | top performer. Highlight outliers and suggest content-mix shifts based on what's working.

This mode never creates or modifies posts.

---

## Quick reference — platform character limits

(Canonical: `references/platform-playbook.md`. This is the at-a-glance.)

| Platform | Limit | Format note |
|---|---|---|
| Instagram | 2,200 | Hook + value + CTA in caption; 20-30 hashtags in `first_comment` |
| LinkedIn | 3,000 | Insight + story + CTA + 3-5 hashtags inline |
| Facebook | 63,206 | Short hook, let link preview carry weight |
| Twitter/X | 280 | Stat or sharp claim + link |
| TikTok | 2,200 | Hook question + 3 value points (caption — video carries the rest) |
| Pinterest | 500 | Keyword-rich, no `#` symbol needed |
| Google Business | 1,500 | Local/helpful framing + CTA |

---

## Format rules per platform

**Instagram** — line 1 hook (question or bold claim), lines 2-4 value (tips/steps/insight), final line CTA. 20-30 hashtags in `first_comment`, not caption.

**LinkedIn** — line 1 insight or data point, lines 2-5 short story or breakdown, final line CTA + 3-5 hashtags inline. Keep readable, don't over-use line breaks.

**Twitter/X** — stat, sharp claim, or question in first 100 chars. Include link when repurposing. Stay under 280, no threads unless explicitly requested.

**Facebook** — 1-2 sentence hook max. Conversational, no jargon. Let the link preview do visual work.

**TikTok** — caption is supporting, not lead. Video carries the message; caption hooks the swipe-stoppers.

**Pinterest** — keyword-rich description, vertical 2:3 image required, no hashtag symbols (Pinterest treats keywords semantically).

**Google Business** — local-first framing ("If you're in [city]..."), direct CTA ("Call us", "Book online"), no promotional hyperbole.

---

## Constraints (mode-agnostic)

- **Never use "elevate"** in any caption. Word is banned per Voyager voice.
- **Match brand voice exactly** — pull from the client's Notion config before generating. If unsure, ask.
- **Instagram hashtags ALWAYS in `first_comment`**, never in caption body.
- **Confirm `client_id` and `brand_voice`** before generating in any mode.
- **One post, one idea.** Don't cram multiple messages into one caption (per platform-playbook).
- **Hook first.** First line stops the scroll. Never start with "We" or the brand name.
- **CTA always.** Every post needs a clear next step.
- **Confirm before > 3 posts.** Hard guardrail from platform-playbook.

---

## Hard guardrails (from platform-playbook.md, restated)

1. **NEVER publish directly.** All posts are `status=Draft` until explicit user instruction via `social_update_post`.
2. **NEVER schedule without calendar check** in Create or Calendar mode. Check first; cluster prevention.
3. **NEVER ignore platform limits.** Revise, don't truncate.
4. **NEVER post identical content cross-platform.** Same topic, different platform-native execution.
5. **NEVER assume timezone.** Use the client's Notion-configured timezone. Ask if unknown.
6. **NEVER skip the hook.** First line is 80% of performance.
7. **Always flag media needs** — exact dimensions and format. This skill cannot upload media.
8. **Always attribute repurposed content** — link back to the source where appropriate.
9. **Always check recent posts for topic duplication** — if covered in the last 14 days, skip or angle differently.
10. **Confirm with user before creating > 3 posts.**

---

## Output format

### Interactive session start (Create mode)

```
## Social Session: {Client Name}
Mode: Create from topic
Topic: {topic}
Platforms: {list — defaulted or user-specified}
Brand voice: {summary}
Calendar window checked: {date range}, {n} posts already scheduled

[then drafts per platform, one section each]
```

### Calendar mode

```
## {Client} — Social Plan: {date range}

| Date | Platform | Topic | Content Type | Hook |
|---|---|---|---|---|
| Mon | Instagram | ... | educational | ... |
| Mon | LinkedIn | ... | social-proof | ... |
[...]

Content mix this week: 40% value, 25% social-proof, 20% behind-scenes, 15% promotional ✓
```

### Analytics mode

```
## {Client} — Social Analytics: {date range}

| Platform | Posts | Reach | Engagement | Top performer |
|---|---|---|---|---|
| Instagram | 12 | 14.2k | 3.8% | "{caption hook}" — {n} likes |
| LinkedIn | 8 | 4.1k | 6.2% | ... |

### Recommendations
- {observation tied to content mix or platform performance}
- {actionable next-week shift}
```

---

## Handoff phrases

After this skill runs:
- "edit the Instagram caption" → user iterates in chat, this skill updates draft
- "schedule them all" → batch flip Draft → Scheduled via `social_update_post`
- "track performance for last week's posts" → re-fire in Analytics mode
- "repurpose this published blog into more posts" → re-fire in Repurpose mode with the blog URL
