---
name: pseo-manage
description: "Use when asked to manage pSEO pages — audit quality, enrich local data, generate stats or FAQ, suggest new cities, or bulk-manage existing service area pages."
argument-hint: "[audit|enrich|stats|faq|suggest|bulk-update] [--state Colorado] [--region 'Front Range'] [--limit 20]"
allowed-tools: [Bash, Read, Grep, Glob, Agent]
user-invocable: true
---

# pSEO Management — Audit, Enrich & Optimize

Manage existing pSEO service area pages. Audit quality, enrich with local data, generate stats/FAQ, suggest new cities, and bulk-update.

## WP Root

Resolved from CLAUDE.md. Use `WP_ROOT`. All WP-CLI: `wp --path=$WP_ROOT`.

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

Show: City | Score | Word Count | Issues. Highlight pages scoring below 60.

### `enrich [post_id]` — Add local data
Enrich a page with demographics, landmarks, neighborhoods, and economy data.

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

### `suggest [state]` — Recommend cities for pSEO expansion

```bash
wp --path=$WP_ROOT eval "
wp_set_current_user(1);
\$a = wp_get_ability('voyager-content/suggest-pseo-cities');
\$result = \$a->execute(['state' => 'Colorado', 'count' => 10]);
echo json_encode(\$result, JSON_PRETTY_PRINT);
"
```

### `bulk-update` — Enrich all pages missing local data
1. Get all service_area posts
2. Check if `sa_local_stats` is empty
3. Call `generate-local-stats` for empty pages
4. Pause 2 seconds between AI calls
5. Report results

## Output

Results in tables. Audits highlight issues. Suggestions flag which cities already have pages.
