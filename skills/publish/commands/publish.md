---
description: Schedule approved Notion content to WordPress (status=future)
argument-hint: "[--dry-run] [--status] [content-item-url]"
---

# /publish

Schedule approved content from Notion to WordPress. Arguments: $ARGUMENTS

Follow the SKILL.md pipeline:

- `--status`: Query Notion Content DB for items with Status=Scheduled + Approved=checked. Show as table.
- `--dry-run`: Run full pipeline logic but make no WP calls or Notion writebacks. Show what would happen.
- Default: Execute pipeline for all qualifying items (or the specific item if a URL was provided).
- Validate all gates (Approved, HTML, Scheduled date, Client relation) before acting on any item.
- Create/update posts in WordPress with `post_status = "future"` — NEVER "publish".
- Set SEO meta (RankMath focus_keyword, title, description) via WP-CLI.
- Write WP Post ID and permalink back to Notion on success; write Publish Error on failure.
- Confirm with user before running unless --force was passed.
- Output a results table: Title | Client | Result | WP Post ID | Scheduled For | Link.
