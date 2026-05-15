---
name: publish
description: "Use when asked to publish content to WordPress, schedule content from Notion, check publish queue, or run the publishing pipeline for a client site."
argument-hint: "[--dry-run] [--status] [content-item-url]"
user-invocable: true
owner: Ben
last_reviewed: 2026-05-15
distribution: internal
origin: voyager
mcp_requirement: required
logic_type: tool-wrapper
surface: all
---

# Notion -> WordPress Publisher

Schedule approved Notion content to WordPress through Voyager MCP.

Critical policy: never set `status=publish`. The MCP tool `content_publish_with_gates` schedules only; WordPress cron handles go-live.

## Notion IDs

| Database | ID |
|----------|----|
| Content | `cba94900-3a60-4292-ba6b-f8aeea62e439` |
| Client Profiles | `collection://1e9bfa0d-34b6-4864-a693-9118c8f71033` |
| Websites | `c6685c2d-de74-48ef-8225-ffdbc63ee1a8` |

## Modes

- `--status`: Query the Content DB for items ready to schedule. Show a table only.
- `--dry-run`: Run Notion lookup plus MCP gates with `dry_run=true`. No WordPress writes and no Notion writeback.
- Default: Schedule qualifying items, or the specific item when a content URL is provided.

## Thin Pipeline

### Step 1: Query Notion

Use `notion-query-database-view` on Content DB `cba94900-3a60-4292-ba6b-f8aeea62e439`.

Filter for:

- `Status = Scheduled`
- `Approved = true`
- `Type in ["Blog", "Page"]`

For each item, collect:

- Notion page ID
- Client relation page ID
- Target site domain from the related Website record
- Name/title
- HTML
- Type (`Blog` -> `post`, `Page` -> `page`)
- Scheduled date as ISO-8601
- Keyword
- SEO Meta Title, if present
- SEO Meta Description, if present
- Featured Image URL, if present
- Categories/tags from client defaults, if configured

If any of the basic Notion fields are missing, skip before calling MCP and report the missing field.

### Step 2: Call MCP

For each item that passes the Notion field gate, call:

```ts
content_publish_with_gates({
  site,
  notion_page_id,
  client_page_id,
  title,
  html,
  publish_datetime,
  keyword,
  post_type,
  slug,
  meta_title,
  meta_description,
  schema_type: "Article",
  categories,
  tags,
  featured_image_url,
  dry_run
})
```

The MCP owns:

- Client isolation against the site's `voyager_notion_databases` content `sync_filter_value`
- Existing post lookup by `notion_id`
- 800+ word count hard block
- SEO meta fallback generation
- Internal link count warning
- CTA append
- Open Graph field preparation
- WordPress scheduled upsert
- SEO metadata write

Gate failures return `status="blocked"` with structured `gate_results` and `errors`. Treat blocked results as fatal for that item.

### Step 3: Write Back to Notion

Only in default mode, after MCP returns `status="scheduled"`:

```yaml
notion-update-page:
  page_id: {notion_page_id}
  properties:
    "WP Post ID": {wp_post_id}
    "Published Link": {permalink}
```

Do not change `Status`. Leave it as `Scheduled`; it moves to `Published` only after WordPress cron publishes.

On MCP error or blocked result, write `Publish Error` with the actionable error message when that property exists. Do not retry blindly.

## Output

```md
## Scheduling Results
| # | Title | Client | Result | WP Post ID | Scheduled For |
|---|-------|--------|--------|------------|---------------|
| 1 | Blog Title | Client | Scheduled | 92 | 2026-04-15 09:00 |
| 2 | Page Title | Client | Blocked: Content too short | - | - |

Scheduled: 1 | Blocked: 1 | Errors: 0
```

For `--dry-run`, show `status`, gate summary, generated SEO fields, warnings, and whether a CTA would be appended.

## Guardrails

1. Never expose or pass a publish status; the MCP schedules only.
2. Never run without `Approved=true`; this is the human gate.
3. Never run without HTML, scheduled date, keyword, client relation, and target site.
4. Never bypass `content_publish_with_gates` for WordPress writes.
5. Always write back WP Post ID and Published Link after success.
6. Keep Notion `Status` as `Scheduled`.
7. On failure, write `Publish Error` when available.
8. Confirm with the user before scheduling unless a force/automation context explicitly authorizes execution.
