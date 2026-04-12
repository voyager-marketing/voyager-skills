---
name: voyager-router
description: "Classifies a Voyager repo by type and recommends which skills to load. Run first in any new session to determine the project context."
compatibility: "Any Voyager WordPress project — theme, plugin, or block library."
---

# Voyager Router

Classifies the current repo and recommends applicable skills.

## When to Use

- Starting a new session in any Voyager repo
- Unsure which skills apply to the current project
- Setting up skills for a new repo

## Classification Rules

Check for these files from the repo root. First match wins:

### Block Theme (`theme`)
**Detect:** `theme.json` exists AND `templates/` directory exists
**Skills:**
- `wp-block-theming` — theme.json, templates, patterns, style variations
- `wp-performance` — caching, Cloudflare, Core Web Vitals
- `wp-voyager-conventions` — shared Voyager patterns

**Known repos:** `voyagermark`, `voyager-block-theme`, client child themes

### Block Plugin (`blocks`)
**Detect:** `src/blocks/` directory exists AND any `block.json` in subdirectories
**Skills:**
- `wp-block-dev` — block creation, edit/save, deprecations
- `wp-interactivity` — Interactivity API (if using `data-wp-interactive`)
- `wp-voyager-conventions` — shared Voyager patterns

**Known repos:** `voyager-blocks`

### WordPress Plugin (`plugin`)
**Detect:** Root PHP file contains `Plugin Name:` header comment
**Skills:**
- `wp-plugin-dev` — modules, REST, auth, releases
- `wp-phpstan` — static analysis
- `wp-voyager-conventions` — shared Voyager patterns

**Known repos:** `voyager-orbit`, `voyager-core`

### Skills Library (`skills`)
**Detect:** `skills/` directory at root with SKILL.md files inside
**Skills:** None auto-loaded — this IS the skill library

**Known repos:** `voyager-skills`

### Next.js App (`app`)
**Detect:** `next.config.js` or `next.config.mjs` exists
**Skills:** None WordPress-specific

**Known repos:** `voyager-report`

## Classification Script

```bash
#!/usr/bin/env bash
# Run from repo root
if [ -f "theme.json" ] && [ -d "templates" ]; then
  echo "theme"
elif [ -d "src/blocks" ]; then
  echo "blocks"
elif grep -rl "Plugin Name:" *.php 2>/dev/null | head -1 > /dev/null; then
  echo "plugin"
elif [ -d "skills" ] && find skills -name "SKILL.md" -print -quit 2>/dev/null | grep -q .; then
  echo "skills"
elif [ -f "next.config.js" ] || [ -f "next.config.mjs" ]; then
  echo "app"
else
  echo "unknown"
fi
```

## Usage

After classification, copy the recommended skills into the target repo:

```bash
# From voyager-skills repo root
./setup.sh <target-repo-path>
```

Or manually:
```bash
cp -r wordpress/wp-block-dev/ /path/to/repo/.claude/skills/wp-block-dev/
```
