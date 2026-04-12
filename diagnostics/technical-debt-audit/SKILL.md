---
name: technical-debt-audit
description: "Structured audit of technical debt in a WordPress project — code quality, dependency health, database bloat, security posture, and upgrade readiness. Produces a prioritized remediation plan."
compatibility: "Any WordPress site with filesystem and WP-CLI access."
---

# Technical Debt Audit

## Trigger Phrases

- "How much tech debt do we have?"
- "Audit this site/plugin/theme"
- "What needs cleaning up?"
- "Is this ready for upgrade?"
- "Pre-migration audit"
- Before any major refactor or WordPress version upgrade

## Analysis Steps

### 1. Dependency Health

```bash
# WordPress core — how far behind?
wp core check-update

# Plugin updates available
wp plugin list --update=available --format=table

# Theme updates
wp theme list --update=available --format=table

# PHP version vs WordPress requirements
php -v | head -1
```

**Score:**
- All up to date = Green
- 1-2 minor versions behind = Yellow
- Major version behind or EOL PHP = Red

### 2. Code Quality Scan

For plugins/themes with source access:

```bash
# PHP syntax errors
find . -name '*.php' -not -path './vendor/*' -not -path './node_modules/*' | xargs -P4 php -l 2>&1 | grep -v "No syntax errors"

# Deprecated WordPress functions
grep -rn "mysql_query\|ereg\|eregi\|split(" --include="*.php" --exclude-dir=vendor --exclude-dir=node_modules

# Direct database queries without prepare
grep -rn '\$wpdb->query\s*(' --include="*.php" --exclude-dir=vendor | grep -v 'prepare'

# Unsafe output (missing escaping)
grep -rn 'echo \$_\|print \$_' --include="*.php" --exclude-dir=vendor
```

### 3. Database Health

```bash
# Table sizes
wp db size --tables --format=table --order=size --order=desc

# Autoloaded options (bloat indicator)
wp db query "SELECT option_name, LENGTH(option_value) as bytes FROM wp_options WHERE autoload='yes' ORDER BY bytes DESC LIMIT 20;"

# Expired transients
wp db query "SELECT COUNT(*) as expired FROM wp_options WHERE option_name LIKE '_transient_timeout_%' AND option_value < UNIX_TIMESTAMP();" --skip-column-names

# Post revisions (bloat)
wp db query "SELECT COUNT(*) FROM wp_posts WHERE post_type='revision';" --skip-column-names

# Orphaned postmeta
wp db query "SELECT COUNT(*) FROM wp_postmeta WHERE post_id NOT IN (SELECT ID FROM wp_posts);" --skip-column-names
```

### 4. Security Posture

```bash
# File permissions
wp eval "echo (defined('DISALLOW_FILE_EDIT') && DISALLOW_FILE_EDIT) ? 'File editing disabled' : 'WARNING: File editing enabled';"
wp eval "echo (defined('DISALLOW_UNFILTERED_HTML') && DISALLOW_UNFILTERED_HTML) ? 'Unfiltered HTML disabled' : 'WARNING: Unfiltered HTML allowed';"

# Debug mode in production
wp eval "echo WP_DEBUG ? 'WARNING: WP_DEBUG enabled' : 'WP_DEBUG disabled';"
wp eval "echo (defined('WP_DEBUG_LOG') && WP_DEBUG_LOG) ? 'WARNING: Debug log enabled' : 'OK';"

# SSL
wp eval "echo is_ssl() ? 'SSL active' : 'WARNING: No SSL';"
```

### 5. Performance Indicators

```bash
# Active plugin count (>20 is yellow, >30 is red)
wp plugin list --status=active --format=count

# Object cache
wp eval "echo wp_using_ext_object_cache() ? 'Object cache active' : 'No object cache';"

# Page cache test
curl -sI https://site.com | grep -i "x-cache\|cf-cache\|x-proxy-cache"
```

### 6. Upgrade Readiness

```bash
# Check PHP compatibility (if tool available)
wp eval "echo phpversion();"

# Check for deprecated hooks/functions in active theme
grep -rn "create_function\|mysql_\|each(" wp-content/themes/active-theme/ --include="*.php" 2>/dev/null
```

## Report Format

```markdown
## Technical Debt Report: {project-name}

**Audit Date:** {date}
**Overall Score:** {Green/Yellow/Red}

### Summary
| Category | Score | Issues |
|----------|-------|--------|
| Dependencies | {G/Y/R} | {count} |
| Code Quality | {G/Y/R} | {count} |
| Database | {G/Y/R} | {count} |
| Security | {G/Y/R} | {count} |
| Performance | {G/Y/R} | {count} |

### Critical Issues (Fix Now)
1. {issue — specific file/table/setting + fix}

### High Priority (Fix This Sprint)
1. {issue + fix}

### Low Priority (Backlog)
1. {issue + fix}

### Remediation Plan
| Priority | Task | Effort | Impact |
|----------|------|--------|--------|
| P0 | {task} | {hours} | {high/med/low} |
| P1 | {task} | {hours} | {high/med/low} |

### Metrics to Track
- Plugin update lag: {days behind}
- Autoloaded options size: {KB}
- Expired transients: {count}
- Post revisions: {count}
- Active plugins: {count}
```
