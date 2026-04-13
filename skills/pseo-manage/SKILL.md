---
name: pseo-manage
description: "Use this skill when the user asks to manage pSEO pages — audit quality, enrich local data, generate stats/FAQ, suggest cities, or bulk-manage existing service area pages."
argument-hint: "[audit|enrich|stats|faq|suggest|bulk-update] [--state Colorado] [--region 'Front Range'] [--limit 20]"
allowed-tools: [Bash, Read, Grep, Glob, Agent, TodoWrite, mcp__wordpress__mcp-adapter-execute-ability]
user-invocable: true
---

# pSEO Management — Audit, Enrich & Optimize

Manage existing pSEO service area pages. Audit quality, enrich with local data, generate stats/FAQ, suggest new cities, and bulk-update.

## WP Root

The WP root path is defined in the project's CLAUDE.md. Use `WP_ROOT` from that file. All WP-CLI commands should be run with `wp --path=$WP_ROOT`.

## Commands

### `audit` — Quality audit
Score all service area pages for content quality, meta completeness, and local data coverage.

```bash
wp --path=$WP_ROOT eval "
wp_set_current_user(1);
\$a = wp_get_ability('voyager-content/audit-pseo-quality');
\$result = \$a->execute(['limit' => 20, 'region' => '']);
echo json_encode(\$result, JSON_PRETTY_PRINT);
"
```

Show results as a table: City | Score | Word Count | Issues. Highlight pages scoring below 60.

### `enrich [post_id]` — Add local data
Enrich a service area page with demographics, landmarks, neighborhoods, and economy data.

```bash
wp --path=$WP_ROOT eval "
wp_set_current_user(1);
\$a = wp_get_ability('voyager-content/enrich-local-data');
\$result = \$a->execute(['post_id' => POST_ID, 'data_types' => ['demographics', 'landmarks', 'neighborhoods', 'economy']]);
echo json_encode(\$result, JSON_PRETTY_PRINT);
"
```

### `stats [post_id]` — Generate local stats
Generate business statistics for the stats counter section.

```bash
wp --path=$WP_ROOT eval "
wp_set_current_user(1);
\$a = wp_get_ability('voyager-content/generate-local-stats');
\$result = \$a->execute(['post_id' => POST_ID, 'stat_count' => 3]);
echo json_encode(\$result, JSON_PRETTY_PRINT);
"
```

### `faq [city] [state]` — Generate local FAQ
Generate location-specific FAQ content.

```bash
wp --path=$WP_ROOT eval "
wp_set_current_user(1);
\$a = wp_get_ability('voyager-content/generate-faq-local');
\$result = \$a->execute(['city' => 'Denver', 'state' => 'Colorado', 'count' => 5]);
echo json_encode(\$result, JSON_PRETTY_PRINT);
"
```

### `suggest [state]` — Suggest high-value cities
Recommend cities for pSEO expansion, considering existing coverage.

```bash
wp --path=$WP_ROOT eval "
wp_set_current_user(1);
\$a = wp_get_ability('voyager-content/suggest-pseo-cities');
\$result = \$a->execute(['state' => 'Colorado', 'count' => 10]);
echo json_encode(\$result, JSON_PRETTY_PRINT);
"
```

### `bulk-update` — Enrich all pages
Iterate through all service area pages and enrich those missing local data.

1. Get all service area posts
2. For each, check if `sa_local_stats` is empty
3. If empty, call `generate-local-stats`
4. Pause 2 seconds between AI calls
5. Report results

## Output

Show results in tables. For audits, highlight issues in the summary. For suggestions, indicate which cities already have pages.
