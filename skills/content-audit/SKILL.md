---
name: content-audit
description: "Use when asked to audit content quality, check for stale content, find thin pages, run a content freshness scan, or assess overall site content health for a client."
argument-hint: "[--type post|page|service_area] [--months 6] [--keyword 'topic'] [--images] [--limit 20]"
user-invocable: true
---

# Content Audit — Full-Site Quality Assessment

Identify stale content, thin pages, image SEO issues, content gaps, and optimization opportunities across a client site.

## WP Root

Resolved from CLAUDE.md. Use `WP_ROOT`. All WP-CLI: `wp --path=$WP_ROOT`.

## Audit Types

### Freshness Audit (default)
Scan for stale content needing updates.

```bash
wp --path=$WP_ROOT eval "
wp_set_current_user(1);
\$a = wp_get_ability('voyager-content/audit-content-freshness');
\$result = \$a->execute(['months_threshold' => 6, 'post_type' => 'post', 'limit' => 20]);
echo json_encode(\$result, JSON_PRETTY_PRINT);
"
```
Show: Title | Last Modified | Age (months) | Word Count | Recommendation

### Image SEO Audit (`--images`)
Find images with missing alt text, oversized files, default titles.

```bash
wp --path=$WP_ROOT eval "
wp_set_current_user(1);
\$a = wp_get_ability('voyager-content/audit-image-seo');
\$result = \$a->execute(['post_id' => 0, 'limit' => 50]);
echo json_encode(\$result, JSON_PRETTY_PRINT);
"
```
Show: Filename | Issues | Size (KB). Summarize totals.

### Content Gap Analysis (`--keyword`)
Find missing content opportunities for a keyword.

```bash
wp --path=$WP_ROOT eval "
wp_set_current_user(1);
\$a = wp_get_ability('voyager-content/analyze-content-gaps');
\$result = \$a->execute(['keyword' => 'KEYWORD', 'post_type' => 'any']);
echo json_encode(\$result, JSON_PRETTY_PRINT);
"
```
Show: Topic | Priority | Content Type | Description

### Performance Prediction (`--post [id]`)
Score a specific post for content quality.

```bash
wp --path=$WP_ROOT eval "
wp_set_current_user(1);
\$a = wp_get_ability('voyager-content/predict-content-performance');
\$result = \$a->execute(['post_id' => POST_ID]);
echo json_encode(\$result, JSON_PRETTY_PRINT);
"
```

## Full Audit Mode

When user says "full audit" or "complete audit", run ALL types:
1. Freshness — posts older than 6 months
2. Images — site-wide image SEO
3. Performance — score top 10 most recent posts
4. Compile prioritized action list by impact

## Output

Markdown tables for findings. End with prioritized action list grouped by severity: critical, moderate, low.
