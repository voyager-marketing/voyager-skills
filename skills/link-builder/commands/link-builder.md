---
description: Analyze internal links and surface linking opportunities across the site
argument-hint: "[post_id] [--all] [--limit 10]"
---

# /link-builder

Analyze internal linking and surface opportunities. Arguments: $ARGUMENTS

Follow the SKILL.md pipeline:

- Default (single post): Analyze a specific post via `voyager-content/suggest-internal-links`. Show Target Page | Suggested Anchor Text | Relevance | Reason.
- `--all`: Analyze the top 20 most recent published posts. Show posts with fewest internal links (orphan risk), top opportunities, and overall link health score.
- Orphan detection: Find published pages with zero incoming internal links using direct post content scan.
- Run all WP-CLI commands with `wp --path=$WP_ROOT` (path from CLAUDE.md).
- Pause 2 seconds between AI ability calls. Cap batch at 20 posts.
- Do NOT auto-edit any posts — show suggestions only, let the user decide.
- End with a "Quick Wins" section: the 5 highest-impact link additions across all analyzed posts.
