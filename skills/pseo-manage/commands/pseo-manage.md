---
description: Audit, enrich, and optimize existing pSEO service area pages
argument-hint: "[audit|enrich|stats|faq|suggest|bulk-update] [--state Colorado] [--region 'Front Range'] [--limit 20]"
---

# /pseo-manage

Manage existing pSEO service area pages. Arguments: $ARGUMENTS

Follow the SKILL.md pipeline:

- `audit`: Score all service area pages via `voyager-content/audit-pseo-quality`. Show City | Score | Word Count | Issues table. Highlight pages below 60.
- `enrich [post_id]`: Add demographics, landmarks, neighborhoods, and economy data via `voyager-content/enrich-local-data`.
- `stats [post_id]`: Generate business stats for the stats counter section via `voyager-content/generate-local-stats`.
- `faq [city] [state]`: Generate location-specific FAQ content via `voyager-content/generate-faq-local`.
- `suggest [state]`: Recommend high-value cities for expansion via `voyager-content/suggest-pseo-cities`. Show which cities already have pages.
- `bulk-update`: Iterate all service area pages, enrich those missing local data. Pause 2s between AI calls.
- Run all WP-CLI commands with `wp --path=$WP_ROOT` (path from CLAUDE.md).
- Output results in tables with clear summaries.
