---
name: publish
description: "Use when asked to publish content to WordPress, schedule content from Notion, check publish queue, or run the publishing pipeline for a client site."
argument-hint: "[--dry-run] [--status] [content-item-url]"
user-invocable: true
owner: Ben
last_reviewed: 2026-04-21
---

# Notion -> WordPress Publisher

Schedule content from the Notion Content DB to WordPress via the Voyager MCP Server.

**CRITICAL POLICY: NEVER set status=publish. Always status=future. WordPress cron handles go-live.**

## Notion IDs

| Database | ID |
|----------|----|
| Content | `cba94900-3a60-4292-ba6b-f8aeea62e439` |
| Client Profiles | `collection://1e9bfa0d-34b6-4864-a693-9118c8f71033` |
| Websites | `c6685c2d-de74-48ef-8225-ffdbc63ee1a8` |

## Modes

- `--status`: Query Content DB for items ready to schedule. Show table.
- `--dry-run`: Full pipeline simulation — no WP calls, no Notion writeback.
- **default**: Schedule all qualifying items (or specific item if URL provided).

## Pipeline Gates (ALL must pass before publishing)

- [ ] Status = "Scheduled"
- [ ] Approved = checked (human gate — NEVER skip)
- [ ] Type = "Blog" or "Page"
- [ ] HTML property not empty
- [ ] Keyword property set
- [ ] Scheduled date set
- [ ] Client relation set

Fail any gate -> skip with clear error message.

## Pipeline Steps

### Step 1: Validate Gates
Query via `notion-query-database-view` on Content DB `cba94900-3a60-4292-ba6b-f8aeea62e439`.
Filter: Status = "Scheduled" + Approved = true + Type in ["Blog", "Page"].

### Step 2: Check for existing post
```
wp_get_post(site, notion_id=notion_page_id)
```
If found, update. If not found, create.

### Step 3: Schedule on WordPress
```
wp_upsert_content(
  site,               # client's site domain (from Websites DB)
  post_type,          # "post" for Blog, "page" for Page
  title,              # from Notion Name property
  html,               # from Notion HTML property
  publish_datetime,   # ISO-8601 from Notion Scheduled date
  notion_id,          # Notion page ID (idempotency key)
  categories,         # from client's default_categories config
  tags,               # from client's default_tags config
  featured_image_url  # from Notion Featured Image URL (optional)
)
```
**Always status=future — never status=publish.**

### Step 4: Set SEO metadata
```
wp_set_seo_meta(
  site,
  post_id,
  focus_keyword,      # from Notion Keyword property
  meta_title,         # from Notion SEO Meta Title (max 60 chars)
  meta_description,   # from Notion SEO Meta Description (max 155 chars)
  schema_type         # Article | BlogPosting | HowTo | FAQ
)
```
Auto-detects RankMath or Yoast and maps to correct meta keys.

### Step 5: Write back to Notion
On SUCCESS:
```
notion-update-page:
  page_id: {notion_page_id}
  properties:
    "WP Post ID": {post_id}
    "Published Link": {permalink}
```
Do NOT change Status — leave as "Scheduled". Status moves to "Published" only after WP cron publishes.

On ERROR: write "Publish Error" property with actionable message. Don't change other fields.

## Output

```
## Scheduling Results
| # | Title | Client | Result | WP Post ID | Scheduled For |
|---|-------|--------|--------|-----------|---------------|
| 1 | Blog Title | Client | Scheduled | 92 | 2026-04-15 09:00 |
| 2 | Page Title | Client | Error: HTML empty | — | — |

Scheduled: 1 | Skipped: 0 | Errors: 1
```

## Guardrails
- Confirm with user before running (unless --force flag given)
- NEVER skip the Approved checkbox — it is a human gate
- NEVER set post_status to "publish"
- Always write back WP Post ID for idempotency on re-runs
