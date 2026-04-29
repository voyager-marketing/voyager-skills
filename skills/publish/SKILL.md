---
name: publish
description: "Use when asked to publish content to WordPress, schedule content from Notion, check publish queue, or run the publishing pipeline for a client site."
argument-hint: "[--dry-run] [--status] [content-item-url]"
user-invocable: true
owner: Ben
last_reviewed: 2026-04-29
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
- [ ] **Client Isolation Check passes** (Client relation matches site's `sync_filter_value`)
- [ ] **Content Quality Gate passes** (word count, SEO meta, internal links, CTA, OG meta)

Fail any gate -> skip with clear error message. Client isolation and quality gates are HARD BLOCKS, not warnings.

## Pipeline Steps

### Step 1: Validate Gates
Query via `notion-query-database-view` on Content DB `cba94900-3a60-4292-ba6b-f8aeea62e439`.
Filter: Status = "Scheduled" + Approved = true + Type in ["Blog", "Page"].

**Client Isolation Gate (CRITICAL — HARD BLOCK):**
Before publishing any content item, verify the Client relation page ID matches the target site's configured sync filter value. Read the `voyager_notion_databases` option to get the expected client page ID:

```bash
wp --path=$WP_ROOT eval '
$dbs = get_option("voyager_notion_databases", []);
foreach ($dbs as $db) {
    if (($db["alias"] ?? "") === "content") {
        echo $db["sync_filter_value"] ?? "NOT SET";
    }
}
'
```

Compare against the content item's `Client` relation page ID from Notion. If they don't match, **HARD BLOCK** and skip with error: `"Client mismatch: content belongs to {actual_client_id}, site expects {expected_client_id}. REFUSING to publish cross-client content."` This is a fatal gate, not a warning. It cannot be overridden.

If the site has NO sync filter configured, **HARD BLOCK** all items: `"No client filter configured. Run /onboard-client Step 3c to set up client isolation before publishing."`

### Step 2: Check for existing post
```
wp_get_post(site, notion_id=notion_page_id)
```
If found, update. If not found, create.

### Step 2.5: Content Quality Gate

Verify all quality requirements before scheduling. In `--dry-run`, report failures. In default mode, auto-fix what's possible and HARD BLOCK on the rest.

1. **Word count minimum (HARD BLOCK):** Post HTML content must be 800+ words (strip tags, count words). If under 800, skip with error: `"Content too short ({n} words, minimum 800)"`. Do not auto-expand.

2. **SEO meta required:** RankMath title, description, and focus keyword must all be set (from Notion `SEO Meta Title`, `SEO Meta Description`, `Keyword`). If any missing, generate fallbacks:
   - **Title fallback:** `{Post title} | Voyager Marketing` (truncate to under 60 chars)
   - **Description fallback:** First 150 characters of post content (plain text, strip tags), word-boundary-cut, append `...`
   - **Focus keyword fallback:** Use the Notion `Keyword` property (already a Step 1 gate, so this should always exist)

3. **Internal links minimum:** Post HTML must contain at least 2 internal links (`<a href="https://{site}/...">`). If fewer than 2, suggest relevant links based on topic. Report missing links as a warning, do not block.

4. **CTA paragraph:** Post must end with a call-to-action paragraph linking to `/contact/`. If missing, append:
   ```html
   <p><strong>Ready to get started? <a href="https://{site}/contact/">Contact us</a> today to discuss your project.</strong></p>
   ```

5. **Open Graph meta:** Ensure `og:title`, `og:description`, `og:type` are prepared for Step 4. Set via RankMath social fields:
   - `og:title` = RankMath title (or fallback from rule 2)
   - `og:description` = RankMath description (or fallback from rule 2)
   - `og:type` = `article`

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

1. **NEVER set post_status to "publish"** — always "future" (scheduled). WP cron handles go-live.
2. **NEVER run without ✅ Approved checked** — human gate, no exceptions.
3. **NEVER run without HTML** — the HTML property must be non-empty.
4. **NEVER run without Scheduled date** — required for future status.
5. **Always write back WP Post ID** — idempotency for next run.
6. **Status stays "Scheduled" in Notion** — don't move to Published. WP cron does that.
7. **On failure, write Publish Error** — don't retry blindly.
8. **Confirm with user before running** — unless `--force` flag.
9. **NEVER publish content under 800 words** — content quality gate, HARD BLOCK.
10. **NEVER publish without SEO meta** — title, description, focus keyword required (auto-generate fallbacks if missing from Notion).
11. **Always set Open Graph meta** — og:title, og:description, og:type=article via RankMath social fields.
12. **Always include CTA** — post must end with a contact CTA paragraph.
13. **NEVER publish content from another client** — verify Client relation page ID matches the site's `sync_filter_value`. HARD BLOCK, not a warning. Cross-client content publication is a data integrity violation.
