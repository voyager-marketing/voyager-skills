---
name: content-brief
description: >
  Use when planning SEO content, keyword research, content calendars, or new
  content briefs for a Voyager client. Triggers on: "plan content for",
  "keyword research for", "content briefs for", "what should we write about",
  "content calendar for".
owner: Ben
last_reviewed: 2026-05-15
distribution: internal
origin: voyager
mcp_requirement: required
logic_type: tool-wrapper
surface: all
allowed-tools:
  - mcp__claude_ai_Voyager_MCP__content_research_keywords
  - mcp__claude_ai_Voyager_MCP__content_trigger_brief
  - mcp__claude_ai_Voyager_MCP__content_pipeline_status
---

# Content Brief

Plan SEO content for Voyager clients. Use `content_research_keywords` first; it checks existing briefs, runs Ahrefs seed research, optionally runs competitor-gap analysis, filters by volume/KD, marks duplicates, and returns ranked opportunities.

The skill owns strategy judgment: client config checks, pillar fit, intent matching, seasonal timing, and whether an opportunity is worth turning into a brief.

## Inputs To Resolve

- `client_id`: required.
- `seed_keywords`: topics or seed terms from the user.
- `client_domain` and `competitor_domains`: use when gap analysis is requested or competitor domains are known.
- `month`: needed for publish timing and pipeline status.
- `min_volume`: default 100.
- `max_kd`: default 40.

Ask before calling MCP if client, seeds, domain, or competitors are ambiguous.

## Research Call

```ts
content_research_keywords({
  client_id,
  seed_keywords,
  client_domain,
  competitor_domains,
  country: "us",
  min_volume: 100,
  max_kd: 40
})
```

Render the returned opportunity table before proposing briefs. Include `ahrefs_calls_estimated` so Alex can see credit impact.

## Quality Rules

1. No keyword overlap: each proposed brief targets a distinct cluster.
2. Intent match: how-to for informational, comparison for commercial, service/CTA for transactional.
3. Pillar alignment: map each brief to a configured client pillar.
4. Anti-duplication: never propose items marked duplicate or listed in `filtered_out.duplicate_keywords`.
5. Seasonal relevance: factor in the target publish month.
6. Avoid the word "elevate" in titles, angles, and brief copy.

## Brief Shape

```text
Title: <=60 chars, includes focus keyword naturally
Focus keyword: one primary keyword
Secondary keywords: 3-5 related terms
Intent: informational | commercial | transactional
Pillar: configured client pillar
Angle: 2-3 sentence reader-value summary
Outline: 4-6 H2 sections
Internal links: 2-4 suggestions
Target word count: 1500-2500
Publish timing: spread across preferred publish days
```

## Approval Flow

1. Show the research table.
2. Propose 3-5 briefs max unless the user asks for a larger batch.
3. Ask: `Approve all / edit specific / discard?`
4. Only after explicit approval, call `content_trigger_brief` for each approved topic/keyword set.
5. Use `content_pipeline_status(client_id, month)` when the user asks what is already in motion.

## Output

```md
## Content Plan - {Client} - {Month}

Research: {seed_count} seeds, {opportunity_count} viable opportunities, {ahrefs_calls_estimated} Ahrefs calls

| Keyword | Volume | KD | Gap | Intent | Source | Recommendation |
|---|---:|---:|---|---|---|---|

### Brief 1
Title:
Focus Keyword:
Pillar:
Intent:
Angle:
Outline:
Publish:

Approve all / edit specific / discard?
```
