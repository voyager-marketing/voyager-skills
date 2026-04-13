---
name: link-builder
description: "Use this skill when the user asks to analyze internal links, find linking opportunities, build internal link strategy, or improve site link structure."
argument-hint: "[post_id] [--all] [--limit 10]"
allowed-tools: [Bash, Read, Grep, Glob, Agent, TodoWrite, mcp__wordpress__mcp-adapter-execute-ability]
user-invocable: true
---

# Link Builder — Internal Linking Analysis

Analyze and improve internal linking across the site. Find orphaned pages, suggest link opportunities, and build a cohesive internal link strategy.

## WP Root

The WP root path is defined in the project's CLAUDE.md. Use `WP_ROOT` from that file. All WP-CLI commands should be run with `wp --path=$WP_ROOT`.

## Modes

### Single Post Analysis (default)
Analyze a specific post and suggest internal links to add.

```bash
wp --path=$WP_ROOT eval "
wp_set_current_user(1);
\$a = wp_get_ability('voyager-content/suggest-internal-links');
\$result = \$a->execute(['post_id' => POST_ID, 'max_suggestions' => 10]);
echo json_encode(\$result, JSON_PRETTY_PRINT);
"
```

Show results as: Target Page | Suggested Anchor Text | Relevance | Reason

Also show how many internal links the post currently has.

### Site-Wide Analysis (`--all`)
Analyze the top N most recent posts for linking opportunities.

1. Get recent published posts:
```bash
wp --path=$WP_ROOT post list --post_type=post,page,service,service_area --post_status=publish --fields=ID,post_title --format=json --posts_per_page=20
```

2. For each post, count existing internal links and run the suggest ability
3. Pause 2 seconds between AI calls

Show a summary:
- Posts with fewest internal links (orphan risk)
- Top linking opportunities across all posts
- Overall internal link health score

### Orphan Page Detection
Find published pages with zero incoming internal links.

```bash
wp --path=$WP_ROOT eval "
\$posts = get_posts(['post_type' => ['post', 'page', 'service'], 'post_status' => 'publish', 'posts_per_page' => -1, 'fields' => 'ids']);
\$site_url = home_url();
\$orphans = [];
foreach (\$posts as \$id) {
    \$url = get_permalink(\$id);
    \$path = wp_parse_url(\$url, PHP_URL_PATH);
    \$found = false;
    foreach (\$posts as \$other_id) {
        if (\$other_id === \$id) continue;
        \$content = get_post_field('post_content', \$other_id);
        if (str_contains(\$content, \$path)) { \$found = true; break; }
    }
    if (!\$found) \$orphans[] = ['id' => \$id, 'title' => get_the_title(\$id), 'url' => \$url];
}
echo json_encode(['orphan_count' => count(\$orphans), 'orphans' => array_slice(\$orphans, 0, 20)], JSON_PRETTY_PRINT);
"
```

## Guardrails

1. **Don't auto-edit posts** — show suggestions, let the user decide what to add
2. **Rate limit AI calls** — 2 second pause between ability calls
3. **Cap batch sizes** — max 20 posts per analysis run
4. **Prioritize by impact** — show highest-relevance suggestions first

## Output

Present as actionable tables. For site-wide analysis, end with a "Quick Wins" section listing the 5 highest-impact link additions.
