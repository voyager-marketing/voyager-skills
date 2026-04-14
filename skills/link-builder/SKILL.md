---
name: link-builder
description: "Use when asked to analyze internal links, find orphaned pages, suggest linking opportunities, or build an internal link strategy for a client site."
argument-hint: "[post_id] [--all] [--limit 10]"
user-invocable: true
---

# Link Builder — Internal Linking Analysis

Analyze and improve internal linking. Find orphaned pages, suggest link opportunities, build a cohesive link strategy.

## WP Root

Resolved from CLAUDE.md. Use `WP_ROOT`. All WP-CLI: `wp --path=$WP_ROOT`.

## Modes

### Single Post Analysis (default)
Analyze a post and suggest internal links to add.

```bash
wp --path=$WP_ROOT eval "
wp_set_current_user(1);
\$a = wp_get_ability('voyager-content/suggest-internal-links');
\$result = \$a->execute(['post_id' => POST_ID, 'max_suggestions' => 10]);
echo json_encode(\$result, JSON_PRETTY_PRINT);
"
```
Show: Target Page | Suggested Anchor Text | Relevance | Reason
Also show how many internal links the post currently has.

### Site-Wide Analysis (`--all`)
Analyze the top N recent posts for linking opportunities.

1. Get published posts:
```bash
wp --path=$WP_ROOT post list --post_type=post,page,service,service_area --post_status=publish --fields=ID,post_title --format=json --posts_per_page=20
```
2. For each post, count existing internal links + run suggest ability
3. Pause 2 seconds between AI calls

Summary: posts with fewest links (orphan risk), top linking opportunities, overall internal link health score.

### Orphan Page Detection
Find published pages with zero incoming internal links.

```bash
wp --path=$WP_ROOT eval "
\$posts = get_posts(['post_type' => ['post', 'page', 'service'], 'post_status' => 'publish', 'posts_per_page' => -1, 'fields' => 'ids']);
\$orphans = [];
foreach (\$posts as \$id) {
    \$url = get_permalink(\$id);
    \$path = wp_parse_url(\$url, PHP_URL_PATH);
    \$found = false;
    foreach (\$posts as \$other_id) {
        if (\$other_id === \$id) continue;
        if (str_contains(get_post_field('post_content', \$other_id), \$path)) { \$found = true; break; }
    }
    if (!\$found) \$orphans[] = ['id' => \$id, 'title' => get_the_title(\$id), 'url' => \$url];
}
echo json_encode(['orphan_count' => count(\$orphans), 'orphans' => array_slice(\$orphans, 0, 20)], JSON_PRETTY_PRINT);
"
```

## Guardrails
- Don't auto-edit posts — show suggestions only, let the user decide
- Rate limit AI calls — 2 second pause between ability calls
- Cap batch sizes — max 20 posts per run
- Prioritize by impact — highest-relevance suggestions first

## Output

Actionable tables. For site-wide, end with "Quick Wins": the 5 highest-impact link additions.
