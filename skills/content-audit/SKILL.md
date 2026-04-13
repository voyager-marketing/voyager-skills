---
name: content-audit
description: "Use this skill when the user asks to audit content quality, check for stale content, find thin pages, run a content freshness scan, or assess overall site content health."
argument-hint: "[--type post|page|service_area] [--months 6] [--keyword 'web design'] [--images] [--limit 20]"
allowed-tools: [Bash, Read, Grep, Glob, Agent, TodoWrite, mcp__wordpress__mcp-adapter-execute-ability]
user-invocable: true
---

# Content Audit — Full-Site Quality Assessment

Run comprehensive content quality audits across the site. Identifies stale content, thin pages, image SEO issues, content gaps, and optimization opportunities.

## WP Root

The WP root path is defined in the project's CLAUDE.md. Use `WP_ROOT` from that file. All WP-CLI commands should be run with `wp --path=$WP_ROOT`.

## Audit Types

### Freshness Audit (default)
Scan for stale content that needs updating.

```bash
wp --path=$WP_ROOT eval "
wp_set_current_user(1);
\$a = wp_get_ability('voyager-content/audit-content-freshness');
\$result = \$a->execute(['months_threshold' => 6, 'post_type' => 'post', 'limit' => 20]);
echo json_encode(\$result, JSON_PRETTY_PRINT);
"
```

Show results as: Title | Last Modified | Age (months) | Word Count | Recommendation

### Image SEO Audit (`--images`)
Find images with missing alt text, oversized files, and default titles.

```bash
wp --path=$WP_ROOT eval "
wp_set_current_user(1);
\$a = wp_get_ability('voyager-content/audit-image-seo');
\$result = \$a->execute(['post_id' => 0, 'limit' => 50]);
echo json_encode(\$result, JSON_PRETTY_PRINT);
"
```

Show: Filename | Issues | Size (KB). Summarize totals at the end.

### Content Gap Analysis (`--keyword`)
Analyze a keyword to find missing content opportunities.

```bash
wp --path=$WP_ROOT eval "
wp_set_current_user(1);
\$a = wp_get_ability('voyager-content/analyze-content-gaps');
\$result = \$a->execute(['keyword' => 'web design', 'post_type' => 'any']);
echo json_encode(\$result, JSON_PRETTY_PRINT);
"
```

Show gaps as: Topic | Priority | Content Type | Description. Also show thin content if found.

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

Show the overall score, breakdown, and recommendations.

## Full Audit Mode

When user says "full audit" or "complete audit", run ALL audit types:

1. **Freshness** — posts older than 6 months
2. **Images** — site-wide image SEO
3. **Performance** — score top 10 most recent posts
4. Compile a summary report with action items prioritized by impact

## Output

Present findings in markdown tables. End with a prioritized action list: what to fix first based on impact and effort. Group by severity (critical, moderate, low).
