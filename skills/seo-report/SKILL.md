---
name: seo-report
description: "Use when asked for an SEO health report, content cluster planning, schema markup generation, A/B headline variants, or overall SEO analysis for a client site."
argument-hint: "[cluster 'topic'] [schema post_id] [ab 'headline'] [report]"
user-invocable: true
---

# SEO Report — Analysis, Planning & Optimization

Generate SEO health reports, plan content clusters, create A/B variants, and generate schema markup via Voyager Orbit abilities.

## WP Root

Resolved from CLAUDE.md. Use `WP_ROOT`. All WP-CLI: `wp --path=$WP_ROOT`.

## Commands

### `report` (default) — SEO Health Report
Comprehensive health check combining freshness, image SEO, and content performance.

```bash
wp --path=$WP_ROOT eval "
wp_set_current_user(1);
\$fresh = wp_get_ability('voyager-content/audit-content-freshness')->execute(['months_threshold' => 6, 'limit' => 10]);
\$images = wp_get_ability('voyager-content/audit-image-seo')->execute(['limit' => 30]);
echo json_encode(['freshness' => \$fresh, 'images' => \$images], JSON_PRETTY_PRINT);
"
```

Compile into a structured report: scores, issues table, prioritized recommendations.

### `cluster [topic]` — Content Cluster Planning
Plan a hub-and-spoke content cluster around a pillar topic.

```bash
wp --path=$WP_ROOT eval "
wp_set_current_user(1);
\$a = wp_get_ability('voyager-content/plan-content-cluster');
\$result = \$a->execute(['pillar_topic' => 'TOPIC', 'spokes' => 8, 'business_context' => 'Digital marketing agency']);
echo json_encode(\$result, JSON_PRETTY_PRINT);
"
```

Present as:
- **Pillar page:** Title, keyword, target word count
- **Spoke articles:** Title | Keyword | Angle | Link Strategy | Word Count

### `schema [post_id]` — Generate Schema Markup
Generate JSON-LD structured data for a post.

```bash
wp --path=$WP_ROOT eval "
wp_set_current_user(1);
\$a = wp_get_ability('voyager-content/generate-schema-markup');
\$result = \$a->execute(['post_id' => POST_ID, 'schema_type' => 'auto']);
echo json_encode(\$result, JSON_PRETTY_PRINT);
"
```

Show detected schema type + formatted JSON-LD. Offer to save to post meta.

### `ab [text]` — A/B Variant Generation
Generate A/B test variants for headlines, CTAs, or descriptions.

```bash
wp --path=$WP_ROOT eval "
wp_set_current_user(1);
\$a = wp_get_ability('voyager-content/generate-ab-variants');
\$result = \$a->execute(['original' => 'TEXT', 'element_type' => 'headline', 'variants' => 3]);
echo json_encode(\$result, JSON_PRETTY_PRINT);
"
```

Show: Original | Variant | Approach | Target Audience

## Output

Structured reports with clear sections, tables, severity indicators, and actionable recommendations.
