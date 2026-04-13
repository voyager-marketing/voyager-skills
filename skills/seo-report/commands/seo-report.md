---
description: Generate SEO health analysis, content cluster plans, schema markup, or A/B variants
argument-hint: "[cluster 'topic'] [schema post_id] [ab 'headline text'] [report]"
---

# /seo-report

Run SEO analysis and planning. Arguments: $ARGUMENTS

Follow the SKILL.md pipeline:

- `report` (default): Run freshness audit + image SEO audit + content performance scores. Compile into a structured summary with scores and prioritized recommendations.
- `cluster [topic]`: Plan a hub-and-spoke content cluster via `voyager-content/plan-content-cluster`. Output pillar page details + spoke articles table (Title | Keyword | Angle | Link Strategy | Word Count).
- `schema [post_id]`: Generate JSON-LD structured data via `voyager-content/generate-schema-markup`. Show schema type and formatted JSON-LD. Offer to save to post meta.
- `ab [text]`: Generate A/B variants for headlines, CTAs, or descriptions via `voyager-content/generate-ab-variants`. Show Original | Variant | Approach | Target Audience.
- Run all WP-CLI commands with `wp --path=$WP_ROOT` (path from CLAUDE.md).
- Format output with clear sections, tables, and severity indicators.
