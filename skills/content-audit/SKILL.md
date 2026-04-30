---
name: content-audit
description: "Use when asked to audit content quality, check for stale content, find thin pages, run a content freshness scan, audit image SEO, find content gaps, or assess overall site content health for a client. Triggers: 'audit content for [client]', 'stale content check', 'image seo audit', 'content gaps for [keyword]', 'how is [client]'s content performing', 'full content audit'."
argument-hint: "[client] [--mode freshness|images|gaps|performance|full] [--months 6] [--keyword 'topic'] [--post-id 123] [--limit 20]"
user-invocable: true
owner: Ben
last_reviewed: 2026-04-30
---

# Content Audit

Identify stale content, thin pages, image SEO issues, content gaps, and post-level performance risk for a Voyager client site. One MCP call per mode. No shell, no SSH, no `wp eval`.

## Mode switch

Pick a single mode from the user's intent. If unclear, ask once before running.

| Intent phrase | Mode | Tool |
|---|---|---|
| "audit content", "content health", "full audit", "complete audit" | `full` | run `freshness` + `images` + `performance` in parallel, merge findings |
| "stale content", "freshness", "old posts", "needs updating" | `freshness` | `seo_audit_freshness` |
| "image SEO", "alt text", "missing alts", "oversized images" | `images` | `seo_audit_images` |
| "content gaps for X", "missing content on X", "what should we write about X" | `gaps` | `content_analyze_gaps` (requires `keyword`) |
| "score this post", "predict performance for post N", "is this post going to rank" | `performance` | `seo_predict_performance` (requires `post_id`) |

<!-- TODO: no `mode: "full"` exists on `content_audit` today; this skill calls the three sub-tools serially or in parallel and merges client-side. Roll up into a server-side full mode when the catalog supports it. -->

## Inputs

- `client_site` (domain or Notion client slug, required for all modes)
- `months` (freshness threshold, default 6)
- `keyword` (gaps mode only)
- `post_id` (performance mode only)
- `post_type` (default `post`; accepts `page`, `service_area`)
- `limit` (default 20 freshness, 50 images)

If `client_site` is missing, ask once. Don't guess.

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
