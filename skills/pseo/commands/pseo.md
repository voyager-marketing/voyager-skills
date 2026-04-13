---
description: Batch-create AI-powered pSEO service area pages
argument-hint: "[cities...] [--layout bold|showcase|landing|random] [--service 'Web Design'] [--region 'Southwest'] [--dry-run] [--status]"
---

# /pseo

Create programmatic SEO service area pages in batch. Arguments: $ARGUMENTS

Follow the SKILL.md pipeline:

- `--status`: List all existing service_area posts with city, state, layout, post status.
- `--dry-run`: Show what would be created (city, state, slug, layout, duplicate check) without making changes.
- Default (batch create): For each city in the input, check for duplicate slug, then call `voyager-content/create-service-area` ability via WP-CLI.
- Accept cities as comma-separated, space-separated, or multi-line. Expand state abbreviations to full names.
- Always create as `draft` status unless user explicitly says to publish.
- Confirm with user before running batches larger than 10 cities.
- Pause 2 seconds between AI ability calls.
- Output a summary table: City | State | Layout | Post ID | Status | AI Generated.
- End with totals: "Created X pages, skipped Y duplicates, Z failures."
