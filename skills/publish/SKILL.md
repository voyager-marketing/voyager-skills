---
name: publish
description: "Use this skill when the user asks to publish content, push content to WordPress, run the publishing pipeline, check publish queue, or schedule content from Notion to WordPress."
argument-hint: "[--dry-run] [--status] [content-item-url]"
allowed-tools: [Bash, Read, Grep, Glob, Agent, mcp__claude_ai_Notion__notion-search, mcp__claude_ai_Notion__notion-fetch, mcp__claude_ai_Notion__notion-query-database-view, mcp__claude_ai_Notion__notion-update-page, mcp__wordpress__mcp-adapter-execute-ability, mcp__wordpress__mcp-adapter-discover-abilities]
user-invocable: true
---

# Notion → WordPress Publisher

Schedule content from the Notion Content database to WordPress client sites. Uses MCP tools for Notion and WP-CLI for WordPress.

**CRITICAL POLICY: This tool SCHEDULES content (status=future). It NEVER publishes directly. WordPress cron handles the actual go-live.**

## Spec
Full spec: https://www.notion.so/6682cc9a3f2a4a2bad6431916bc428b6

## Notion IDs

| Database | ID |
|----------|----|
| Content | `cba94900-3a60-4292-ba6b-f8aeea62e439` |
| Content data source | `collection://cfda5145-1b35-4980-934d-d2f26ead562c` |
| Websites | `c6685c2d-de74-48ef-8225-ffdbc63ee1a8` |
| Client Profiles | `collection://1e9bfa0d-34b6-4864-a693-9118c8f71033` |

## WP Root

The WP root path is defined in the project's CLAUDE.md. Use `WP_ROOT` from that file, or resolve it via:
```bash
wp --info --format=json | jq -r '.wp_root'
```

All `wp --path=` arguments should use the resolved WP root. Example: `wp --path=$WP_ROOT --user=1 eval '...'`

## Modes

### `--status` (check queue)
Query Content DB for items with Status = "Scheduled" + Approved = checked + Type = Blog or Page. Show table.

### `--dry-run` (preview)
Full pipeline without WP calls or Notion writeback. Show what WOULD happen.

### default (schedule)
Execute pipeline for all qualifying items (or specific item if URL provided).

## Pipeline Steps

### Step 1: Validate Gates
ALL of these must be true:
- Status = "Scheduled"
- ✅ Approved = checked (human gate)
- Type = "Blog" or "Page"
- HTML property is not empty
- Keyword property is not empty
- Scheduled date is set
- Client relation is set

If any gate fails → skip item, report why.

### Step 2: Extract Content Data
| Notion Property | Maps To |
|----------------|---------|
| `Name` | WordPress post title |
| `HTML` | WordPress post content |
| `Slug` | WordPress post slug |
| `Keyword` | RankMath focus_keyword |
| `SEO Meta Title` | RankMath meta title (fallback: Name) |
| `SEO Meta Description` | RankMath meta description |
| `Type` | Blog → `post`, Page → `page` |
| `WP Post ID` | Existing post ID (update) or empty (create) |
| `Scheduled` | publish_datetime (ISO-8601) |
| `Featured Image URL` | URL to download as featured image (optional) |
| Notion page ID | `_voyager_notion_id` meta for idempotency |

### Step 3: Resolve Target Site
1. Content → Client relation → fetch Client page
2. Client → find associated Website (Stage = Prod or Dev)
3. Get Website URL

**v1**: Always local site via WP-CLI (path from CLAUDE.md).
**v2**: Remote sites via Portal Bridge HMAC.

### Step 4: Create/Update Post in WordPress (status = future)
```bash
wp --path=$WP_ROOT --user=1 eval '
$post_data = [
    "post_title"   => "...",
    "post_content" => "...",
    "post_type"    => "post",
    "post_status"  => "future",
    "post_name"    => "...",
    "post_date"    => "2026-04-15 09:00:00",
    "post_date_gmt" => "2026-04-15 13:00:00",
];
// If WP Post ID exists: update. Otherwise: create.
if ($existing_id) {
    $post_data["ID"] = $existing_id;
    $result = wp_update_post($post_data, true);
} else {
    $result = wp_insert_post($post_data, true);
}
// Store notion_id for idempotency
update_post_meta($result, "_voyager_notion_id", "notion-page-id");
'
```

**NEVER set post_status to "publish". Always "future".**

### Step 4.5: Set Featured Image (if provided)
If `Featured Image URL` property is set:
```bash
wp --path=$WP_ROOT --user=1 eval '
// Download and set featured image
if (!function_exists("download_url")) {
    require_once ABSPATH . "wp-admin/includes/file.php";
}
if (!function_exists("media_handle_sideload")) {
    require_once ABSPATH . "wp-admin/includes/media.php";
    require_once ABSPATH . "wp-admin/includes/image.php";
}
$tmp = download_url("IMAGE_URL");
if (!is_wp_error($tmp)) {
    $file = ["name" => "featured-image.jpg", "tmp_name" => $tmp];
    $att_id = media_handle_sideload($file, {post_id});
    if (!is_wp_error($att_id)) {
        set_post_thumbnail({post_id}, $att_id);
        update_post_meta($att_id, "_wp_attachment_image_alt", "KEYWORD - ALT TEXT");
        echo "Featured image set: att_id=$att_id\n";
    }
}
'
```

Or use the ability directly (once media abilities are registered):
```bash
wp eval '$result = wp_get_ability("voyager-orbit/set-featured-image")->execute(["post_id" => {post_id}, "url" => "IMAGE_URL", "alt_text" => "KEYWORD"]);'
```

### Step 5: Set SEO Meta
```bash
wp --path=$WP_ROOT --user=1 eval '
update_post_meta($post_id, "rank_math_focus_keyword", "...");
update_post_meta($post_id, "rank_math_title", "...");
update_post_meta($post_id, "rank_math_description", "...");
'
```

### Step 6: Write Back to Notion
On SUCCESS:
```
notion-update-page:
  page_id: {notion_page_id}
  command: update_properties
  properties:
    "WP Post ID": "{post_id}"
    "Published Link": "{permalink}"
    "Publish Error": null
```

**Do NOT change Status** — leave it as "Scheduled". Status only moves to "Published" after WP cron actually publishes.

On ERROR:
```
  properties:
    "Publish Error": "Short, actionable error message"
```
Do NOT change WP Post ID, Published Link, or Status.

## Guardrails (CRITICAL)

1. **NEVER set post_status to "publish"** — always "future" (scheduled)
2. **NEVER run without ✅ Approved checked** — human gate required
3. **NEVER run without HTML** — the HTML property must be non-empty
4. **NEVER run without Scheduled date** — required for future status
5. **Always write back WP Post ID** — idempotency for next run
6. **Status stays "Scheduled" in Notion** — don't move to Published
7. **On failure, write Publish Error** — don't retry blindly
8. **Confirm with user before running** — unless --force flag

## Output Format

```
## Scheduling Results

| # | Title | Client | Result | WP Post ID | Scheduled For | Link |
|---|-------|--------|--------|-----------|---------------|------|
| 1 | Blog Title | BRH | ✅ Scheduled | 92 | 2026-04-15 09:00 | https://... |
| 2 | Page Title | BRH | ❌ Error: HTML empty | — | — | — |

Scheduled: 1 | Skipped: 0 | Errors: 1
```
