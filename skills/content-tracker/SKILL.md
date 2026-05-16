---
name: content-tracker
description: >
  Use when reviewing published content performance, lifecycle health, refresh
  recommendations, expansion candidates, archive candidates, or content
  portfolio status for a Voyager client. Triggers on: "content performance for",
  "which posts need refreshing", "content tracking for", "content lifecycle for",
  "what's performing for", "refresh recommendations for".
owner: Ben
last_reviewed: 2026-05-15
distribution: internal
origin: voyager
mcp_requirement: required
logic_type: tool-wrapper
surface: all
allowed-tools:
  - mcp__claude_ai_Voyager_MCP__content_track_portfolio
---

# Content Tracker

Review a client's published content portfolio. Use `content_track_portfolio`; MCP owns published-brief lookup, pipeline status, performance summary, lifecycle classification, threshold logic, and refresh/expand/archive recommendations.

The skill owns interpretation: explain the portfolio health, group actions into a clear next move, and hand off to the right content workflow.

## Inputs

- `client_id`: required.
- `client_name`: include when known for display and performance filtering.
- `month`: default to the current month unless the user asks for another period.
- `days`: default 30-day performance lookback.

Ask if the client is ambiguous.

## MCP Call

```ts
content_track_portfolio({
  client_id,
  client_name,
  month,
  days
})
```

The MCP returns:

- `pipeline_status`: briefs, drafts, review, scheduled, published totals.
- `posts`: each post with lifecycle stage, metrics, and optional recommendation.
- `summary`: counts by lifecycle and action type.
- `recommended_actions`: sorted archive, refresh, and expand actions.
- `thresholds`: exact deterministic rules used.

## Output

```md
## Content Performance - {Client} - {Month}

Pipeline: {published} published | {scheduled} scheduled | {in_review} in review

### Portfolio Health
| Title | Published | Stage | Impressions | CTR | Position | Action |
|---|---:|---|---:|---:|---:|---|

### Needs Attention
- {title}: {reason} -> {action}

### Wins
- {title}: evergreen or performing signal

### Recommended Actions
1. Archive: {post} - {reason}
2. Refresh: {post} - {reason}
3. Expand: {post} - {reason}
```

## Handoffs

- `refresh`: hand off to `content-production` to queue a refresh brief.
- `expand`: hand off to `content-brief` for cluster or supporting-article planning.
- `archive`: confirm with Alex before removing, noindexing, redirecting, or consolidating.
- `fresh`: do not judge early performance harshly; wait for more data.
- `evergreen`: consider social repurpose or internal linking, not rewrite by default.

## Guardrails

1. Never invent metrics. Use only MCP-returned metrics.
2. Do not recommend deleting/archive actions without explicit user confirmation.
3. Treat `fresh` content as watchlist unless MCP flags an explicit issue.
4. Explain why each recommendation exists using the returned reason/threshold.
5. If performance data is missing, say "insufficient data" rather than guessing.
