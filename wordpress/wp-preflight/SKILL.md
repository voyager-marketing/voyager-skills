---
name: wp-preflight
description: "Use this skill when the user asks to check PHP, lint PHP, run preflight checks, validate PHP code, or check for security issues before committing on a Voyager project."
argument-hint: "[--security] [--all]"
allowed-tools: [Bash, Grep, Glob, Read]
user-invocable: true
---

# PHP Preflight Checks

Run PHP quality and security checks on a Voyager plugin before committing. The plugin root is defined in the project's CLAUDE.md — use `PLUGIN_ROOT` from that file.

## Process

### 1. PHP Syntax Check

Run `php -l` on all PHP files in the plugin (excluding node_modules, build, vendor):

```bash
find $PLUGIN_ROOT \
  -name '*.php' \
  -not -path '*/node_modules/*' \
  -not -path '*/build/*' \
  -not -path '*/vendor/*' \
  -exec php -l {} \; 2>&1 | grep -v "No syntax errors"
```

If all clear, report "All PHP files pass syntax check."

### 2. Security Scan

Search for common WordPress security anti-patterns:

**Unsanitized input** — raw superglobals without sanitization:
```
grep -rn '\$_GET\[' --include='*.php' | grep -v 'sanitize_\|absint\|intval\|wp_unslash'
grep -rn '\$_POST\[' --include='*.php' | grep -v 'sanitize_\|absint\|intval\|wp_unslash'
grep -rn '\$_REQUEST\[' --include='*.php' | grep -v 'sanitize_\|absint\|intval\|wp_unslash'
```

**Unescaped output** — echo/print without escaping:
```
grep -rn 'echo \$' --include='*.php' | grep -v 'esc_html\|esc_attr\|esc_url\|wp_kses\|absint\|intval'
```

**Raw SQL** — queries without prepare():
```
grep -rn '\$wpdb->query\|->get_results\|->get_var\|->get_row' --include='*.php' | grep -v 'prepare'
```

### 3. ABSPATH Guard Check

Every PHP file (except the main plugin file) should have:
```php
if ( ! defined( 'ABSPATH' ) ) { exit; }
```

Check all PHP files for this guard.

### 4. Summary Table

Output a summary table:

| Check | Status | Issues |
|-------|--------|--------|
| Syntax (php -l) | PASS/FAIL | count |
| Input Sanitization | PASS/WARN | count |
| Output Escaping | PASS/WARN | count |
| SQL Preparation | PASS/WARN | count |
| ABSPATH Guards | PASS/WARN | count |

For any issues found, list: file, line number, issue description, and suggested fix.

### 5. Quick Mode

If the user just wants to check recently changed files:
```bash
cd $PLUGIN_ROOT
git diff --name-only HEAD~5 -- '*.php' | xargs -I{} php -l {}
```
