---
description: Audit site content quality — freshness, images, gaps, and performance
argument-hint: "[--type post|page|service_area] [--months 6] [--keyword 'web design'] [--images] [--limit 20]"
---

# /content-audit

Audit content quality across the site. Arguments: $ARGUMENTS

Follow the SKILL.md pipeline:

- Default (freshness audit): Scan for stale content via `voyager-content/audit-content-freshness`. Show Title | Last Modified | Age | Word Count | Recommendation.
- `--images`: Run image SEO audit via `voyager-content/audit-image-seo`. Show Filename | Issues | Size (KB).
- `--keyword 'topic'`: Run content gap analysis via `voyager-content/analyze-content-gaps`. Show Topic | Priority | Content Type | Description.
- `--post [id]`: Score a specific post via `voyager-content/predict-content-performance`. Show score, breakdown, and recommendations.
- "full audit" / "complete audit": Run all audit types (freshness, images, top 10 post scores) and compile a prioritized action list.
- Run all WP-CLI commands with `wp --path=$WP_ROOT` (path from CLAUDE.md).
- Present in markdown tables. End with prioritized action list grouped by severity: critical, moderate, low.
