---
name: voyager-php-preflight
description: "Use when asked to lint PHP, run preflight checks, validate PHP code, or check for WordPress security anti-patterns (unsanitized input, unescaped output, raw SQL) before committing. Runs against the current working directory by default — usable in any Voyager plugin or theme repo."
argument-hint: "[path] [--security] [--all]"
allowed-tools: [Bash, Grep, Glob, Read]
user-invocable: true
owner: Ben
last_reviewed: 2026-04-29
---

# PHP Preflight Checks

Run PHP quality and security checks on a Voyager plugin or theme before committing. Defaults to the current working directory; pass an explicit path as the first argument to scan a different repo.

## Process

### 1. PHP Syntax Check

Run `php -l` on all PHP files in the target directory (excluding node_modules, build, vendor):

```bash
TARGET="${1:-.}"
find "$TARGET" \
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

### 4. Report

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
git diff --name-only HEAD~5 -- '*.php' | xargs -I{} php -l {}
```
