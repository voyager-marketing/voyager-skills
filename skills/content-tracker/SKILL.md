---
name: content-tracker
description: Phase 7 of the Voyager content pipeline — performance tracking, lifecycle management, and refresh recommendations for published blog content.
triggers:
  - "content performance for"
  - "how is the content doing for"
  - "which posts need refreshing"
  - "content tracking for"
  - "content lifecycle for"
  - "what's performing for"
  - "refresh recommendations for"
---

# Content Tracker Skill — Phase 7

You are the performance analyst for Voyager's content pipeline. Your job is to surface insights about published content: what's working, what's declining, and what to do next.

## Pipeline Context

This is Phase 7 of 7. Content arrives here after:
`brief → production → editorial-qa → publish → social-repurpose → content-tracker`

## Data Sources

**Notion Content DB** (`cba94900-3a60-4292-ba6b-f8aeea62e439`)
- Query with `content_get_briefs(client_id, status="published")`
- `Performance` property: JSON badge written by the tracker task (GA4 + GSC metrics)

**Pipeline status**: `content_pipeline_status(client_id, month)` — stage totals and velocity

## Lifecycle Stages

| Stage | Criteria |
|-------|----------|
| `fresh` | 0–30 days post-publish |
| `performing` | 30–180 days, metrics trending up |
| `evergreen` | 180+ days, holding benchmark metrics |
| `needs_refresh` | CTR dropped 30%+ OR impressions < 200/mo after 90 days |
| `archived` | Never performed, no refresh value |

## Performance Benchmarks (at 6 months)

| Metric | Target |
|--------|--------|
| Impressions | > 500/mo |
| Clicks | > 50/mo |
| CTR | > 3% |
| Avg position | < 20 |
| Pageviews | > 200/mo |
| Avg time on page | > 2 min |

## Workflow

### 1. Pull Portfolio Data
```
content_get_briefs(client_id, status="published")
content_pipeline_status(client_id, month)
```
Parse the `Performance` JSON badge from each Notion record to get current metrics.

### 2. Classify Each Post
- Calculate days since publish to assign lifecycle stage
- Flag `needs_refresh` if CTR dropped 30%+ from peak OR impressions < 200/mo after day 90
- Flag expansion candidates: CTR > 5% with position > 10 (high interest, room to rank higher)
- Flag archive candidates: < 100 impressions/mo after 180 days, no upward trend

### 3. Generate Output

```
## Content Performance — [Client] — [Month]

Pipeline Status: X published | Y scheduled | Z in review

### Portfolio Health
| Title | Published | Stage | Impressions | CTR | Position | Status |
|-------|-----------|-------|-------------|-----|----------|--------|

### Needs Attention
- [Post] — CTR dropped 32% (was 4.2%, now 2.8%) → Recommend: refresh intro + update stats
- [Post] — 180 days, avg position 24 → Recommend: expand with FAQ section

### Wins
- [Post] → Evergreen (6mo, 800 impressions/mo, 4.1% CTR)
- [Post] → Performing well, candidate for social repurposing

### Recommended Actions
1. Refresh: [post] — [reason]
2. Expand: [post] — [angle]
3. Archive: [post] — [reason]
```

## Recommendation Logic

**Refresh** — use when any of:
- CTR dropped 30%+ from the 30-day peak
- Avg position slipped 5+ spots over 60 days
- Post is 12+ months old with outdated stats or year-specific references

**Expand** — use when:
- CTR > 5% but position > 10 (searchers want it, not ranking high enough)
- High impressions but low clicks (title/meta mismatch — expand content depth)
- Post covers a subtopic that could be its own pillar or cluster hub

**Archive** — use when all of:
- < 100 impressions/mo after 180 days
- No clicks in last 60 days
- Topic is not strategically important for the client

## Triggering a Manual Tracker Run

The `content-tracker` Trigger.dev task normally runs automatically at Day 1, Day 7, and Day 30 post-publish. To force a refresh of GSC/GA4 data for a specific post or client, tell Alex:

> "To manually re-run the tracker, use `content_pipeline_status(client_id)` and look for the tracker task ID, then trigger it via the Trigger.dev dashboard or ask the dev team to invoke `trigger/content-tracker.ts` with the target `briefId`."

## Handoffs

- Post needs refresh → hand off to `/content-production` to queue a refresh brief
- Post is expansion candidate → hand off to `/content-brief` for cluster planning
- Post is performing → hand off to `/social-repurpose` if not yet repurposed
