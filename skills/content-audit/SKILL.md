---
name: content-audit
description: "Use when asked to audit content quality, check for stale content, find thin pages, run a content freshness scan, audit image SEO, find content gaps, or assess overall site content health for a client. Triggers: 'audit content for [client]', 'stale content check', 'image seo audit', 'content gaps for [keyword]', 'how is [client]'s content performing', 'full content audit'."
argument-hint: "[client] [--mode freshness|images|gaps|performance|full] [--months 6] [--keyword 'topic'] [--post-id 123] [--limit 20]"
user-invocable: true
owner: Ben
last_reviewed: 2026-05-14
distribution: internal
origin: voyager
mcp_requirement: required
logic_type: tool-wrapper
surface: all
---

# Content Audit

Identify stale content, thin pages, image SEO issues, content gaps, and post-level performance risk for a Voyager client site. Call the `content_audit` MCP tool once with the selected mode. No shell, no SSH, no `wp eval`.

## Mode switch

Pick a single mode from the user's intent. If unclear, ask once before running.

| Intent phrase | Mode | Tool call |
|---|---|---|
| "audit content", "content health", "full audit", "complete audit" | `full` | `content_audit` with `mode: "full"` |
| "stale content", "freshness", "old posts", "needs updating" | `freshness` | `content_audit` with `mode: "freshness"` |
| "image SEO", "alt text", "missing alts", "oversized images" | `images` | `content_audit` with `mode: "images"` |
| "content gaps for X", "missing content on X", "what should we write about X" | `gaps` | `content_audit` with `mode: "gaps"` and `keyword` |
| "score this post", "predict performance for post N", "is this post going to rank" | `performance` | `content_audit` with `mode: "performance"` and `post_id` |

## Inputs

- `client_site` (domain or Notion client slug, required for all modes)
- `months` (freshness threshold, default 6)
- `keyword` (gaps mode only)
- `post_id` (performance mode only)
- `post_type` (default `post`; accepts `page`, `service_area`)
- `limit` (default 20 freshness, 50 images)

If `client_site` is missing, ask once. Don't guess.

## Tool contract

Use `content_audit` as the single MCP entrypoint. The MCP owns orchestration and error isolation. In `full` mode, read each returned mode result and report partial failures clearly instead of retrying sub-tools from the skill.

## Output

Markdown tables per finding type, then a single prioritized action list at the bottom grouped by severity (`critical`, `moderate`, `low`). Sort within each bucket by impact, not alphabetical.

Honesty rule: every action cites the source data (post ID, image filename, keyword, score). No invented metrics. No "consider improving SEO" filler. If the audit returns zero findings in a category, say so and move on.

Specificity rule: an action is "rewrite intro for post 412 (CTR 0.4%, position 14, 8 months stale)", not "refresh older posts". The data is there; use it.

## Handoff phrases

End the report with the next move, mapped to the right skill:

- Findings need editing or rewrite: "Run `/editorial-qa` on post [ID] to tighten copy."
- Findings need republishing or status change: "Run `/publish` to push the refreshed draft."
- Gaps suggest new briefs: "Run `/content-brief` to scope the missing topics."
- Image issues across the fleet: "Run `/fleet-health` to scope beyond this one site."
