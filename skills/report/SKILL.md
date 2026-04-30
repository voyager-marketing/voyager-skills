---
name: report
description: "Use this skill when the user asks to generate a client report, monthly report, check client performance, or produce analytics for a client."
argument-hint: "<client-name> [month] [--notion] [--format=table|markdown]"
allowed-tools: [mcp__claude_ai_Voyager_MCP__report_generate, mcp__claude_ai_Voyager_MCP__client_get_profile]
user-invocable: true
owner: Ben
last_reviewed: 2026-04-30
---

# Client Report Generator

Generate a monthly client report from Voyager Orbit lead, analytics, and content data. Server-side composite. No SSH, no SQL.

## Trigger phrases

"monthly report for [client]", "generate report", "client performance for [month]", "March report for Built Right Homes", "send the [client] report to Notion".

## Step 1: Resolve client

If the user named a client, call `client_get_profile(client: "<name>")` to fuzzy-match. If multiple match, list them and ask. If no name, list available clients via `client_get_profile` and ask.

## Step 2: Resolve month

Default to the current month. Accept "March 2026", "2026-03", "last month". Resolve to `YYYY-MM`.

## Step 3: Generate the report

One call:

```
report_generate(
  client: "<resolved-client-slug>",
  month: "YYYY-MM",
  format: "markdown" | "table",   // optional, default markdown
  publish_to_notion: true | false  // optional, true if --notion flag
)
```

Returns `{ markdown, leads, content, activities, mom_change, notion_url? }`.

If `publish_to_notion` is true and `notion_url` returned, share the URL with the user.

## Step 4: Render

Show the `markdown` field directly. Shape (server-rendered):

```
## Monthly Report: <Client> -- <Month Year>

### Executive Summary
- X leads captured (MoM change)
- Y content items published
- Z admin activities tracked

### Lead Performance
| Metric | Value |
|--------|-------|
| Total Leads | X |
| Phone Clicks | X |
| Form Submissions | X |
| Top Source | Organic (X%) |
| Avg Score | X/100 |

### Content Published
| Title | Type | Keyword | Link |
|-------|------|---------|------|
| ... | ... | ... | ... |

### Activity Summary
- Total activities: X
- Key activity types and counts

### Recommendations
- MoM trend
- Content strategy notes
- Lead source optimization
```

For `--format=table`, drop Executive Summary and Recommendations. Tables only.

## Guardrails

- Never inflate or invent metrics. Show only what `report_generate` returns.
- Always cite the month and source dates from the response.
- MoM math is server-side. Do not recompute in chat.
- If lead count is zero, report that clearly. Do not pad.
- If the call errors, surface the error verbatim. Do not fall back to ad-hoc queries.

<!-- TODO: confirm report_generate returns mom_change and notion_url in current shape; if not, extend server-side per docs/skills-vs-mcp-roadmap.md #1. -->
