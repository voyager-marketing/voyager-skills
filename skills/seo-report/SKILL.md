---
name: seo-report
description: "Use this skill when the user asks for an SEO health report, content cluster planning, A/B variant generation, schema markup generation, or overall SEO analysis."
argument-hint: "[cluster 'topic'] [schema post_id] [ab 'headline text'] [report]"
allowed-tools: [Bash, Read, Grep, Glob, Agent, TodoWrite, mcp__wordpress__mcp-adapter-execute-ability]
user-invocable: true
---

# SEO Report — Analysis, Planning & Optimization

Generate SEO health reports, plan content clusters, create A/B variants, and generate schema markup.

## WP Root

The WP root path is defined in the project's CLAUDE.md. Use `WP_ROOT` from that file. All WP-CLI commands should be run with `wp --path=$WP_ROOT`.

## Commands

### `report` (default) — SEO Health Report
Comprehensive SEO health check combining multiple signals.

Run these audits in sequence:
1. **Content freshness** — flag stale posts
2. **Image SEO** — find missing alt text
3. **Content performance** — score recent posts

```bash
wp --path=$WP_ROOT eval "
wp_set_current_user(1);
\$fresh = wp_get_ability('voyager-content/audit-content-freshness')->execute(['months_threshold' => 6, 'limit' => 10]);
\$images = wp_get_ability('voyager-content/audit-image-seo')->execute(['limit' => 30]);
echo json_encode(['freshness' => \$fresh, 'images' => \$images], JSON_PRETTY_PRINT);
"
```

Compile into a structured report with scores, issues, and prioritized recommendations.

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
- **Spoke articles:** Table with Title | Keyword | Angle | Link Strategy | Word Count

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

Show the detected schema type and formatted JSON-LD. Offer to save it to post meta.

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

Show as: Original | Variant | Approach | Target Audience

## Output

Format all reports with clear sections, tables, and actionable recommendations. Use severity indicators for issues.
