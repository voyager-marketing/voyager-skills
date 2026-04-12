---
name: wp-phpstan
description: "Use when configuring, running, or fixing PHPStan static analysis in Voyager Orbit — phpstan.neon setup, baselines, WordPress-specific typing, and handling third-party plugin classes."
compatibility: "PHP 8.1+, Composer-based PHPStan, szepeviktor/phpstan-wordpress stubs."
---

# PHPStan for Voyager Orbit

## When to Use

- Setting up or updating `phpstan.neon` / `phpstan.neon.dist`
- Generating or updating the baseline (`phpstan-baseline.neon`)
- Fixing PHPStan errors in WordPress/Orbit code
- Adding type annotations for REST requests, hooks, or database queries
- Handling third-party plugin classes (Gravity Forms, WPForms, CF7, etc.)

## Configuration

### Minimal phpstan.neon

```neon
includes:
    - vendor/szepeviktor/phpstan-wordpress/extension.neon
    # - phpstan-baseline.neon  # uncomment when baseline exists

parameters:
    level: 6
    paths:
        - voyager-core.php
        - src/
    excludePaths:
        - vendor/
        - node_modules/
    bootstrapFiles:
        - vendor/autoload.php
    scanDirectories:
        - vendor/szepeviktor/phpstan-wordpress/
```

### Required Packages

```bash
composer require --dev szepeviktor/phpstan-wordpress phpstan/phpstan
```

`szepeviktor/phpstan-wordpress` provides stubs for all WordPress core functions, classes, and hooks. Without it, PHPStan will report thousands of "function not found" errors.

## Running PHPStan

```bash
# Full analysis
vendor/bin/phpstan analyse

# Or via Composer script (if configured)
composer run phpstan

# Specific file
vendor/bin/phpstan analyse src/Modules/Leads/RestApi.php

# Generate baseline for existing errors
vendor/bin/phpstan analyse --generate-baseline
```

## Common Orbit Patterns Needing Types

### REST Request Parameters

```php
/**
 * @param WP_REST_Request<array{per_page: int, page: int, search?: string}> $request
 */
public function getItems(WP_REST_Request $request): WP_REST_Response {
    /** @var int $perPage */
    $perPage = $request->get_param('per_page');
}
```

### Database Query Results

```php
/** @var list<object{id: int, event_type: string, created_at: string}> $results */
$results = $wpdb->get_results(
    $wpdb->prepare("SELECT id, event_type, created_at FROM {$table} WHERE site_id = %s", $siteId)
);
```

### Hook Callbacks

```php
/**
 * @param int    $postId Post ID.
 * @param WP_Post $post   Post object.
 */
add_action('save_post', function(int $postId, WP_Post $post): void {
    // ...
}, 10, 2);
```

### Array Shapes for Options

```php
/**
 * @return array{api_key: string, registered: bool, site_id: string}
 */
public function getSettings(): array {
    /** @var array{api_key: string, registered: bool, site_id: string} */
    return get_option('voyager_orbit_settings', [
        'api_key'    => '',
        'registered' => false,
        'site_id'    => '',
    ]);
}
```

## Handling Third-Party Plugins

Orbit integrates with plugins that may not be installed in the analysis environment:

### Strategy 1: Targeted Ignores (Preferred for Optional Integrations)

```neon
parameters:
    ignoreErrors:
        - '#Class GFAPI not found#'
        - '#Class GF_Field not found#'
        - '#Class WPForms not found#'
        - '#Class WPCF7_Submission not found#'
        - '#Class RankMath\\#'
```

### Strategy 2: Community Stubs (For Required Dependencies)

```bash
# If Orbit required WooCommerce:
composer require --dev php-stubs/woocommerce-stubs
```

### Strategy 3: Local Stub File

Create `stubs/third-party.php`:

```php
<?php
// Minimal stubs for optional integrations
class GFAPI {
    /** @return array<int, mixed>|WP_Error */
    public static function get_entries(int $formId, array $criteria = []): array|WP_Error {}
}
```

Reference in phpstan.neon:
```neon
parameters:
    scanFiles:
        - stubs/third-party.php
```

## Baseline Management

The baseline is a migration tool, not a permanent ignore list:

```bash
# Generate baseline from existing errors
vendor/bin/phpstan analyse --generate-baseline

# Include in config
includes:
    - phpstan-baseline.neon
```

**Rules:**
- Generate baseline once for legacy code
- Never baseline newly introduced errors
- Reduce baseline over time as you fix code
- Review baseline in PRs — it should shrink, not grow

## Fixing vs Ignoring

**Always prefer fixing** over ignoring. Common fixes:

| Error | Fix |
|-------|-----|
| Parameter type mismatch | Add `@param` PHPDoc with correct type |
| Return type mismatch | Add `@return` PHPDoc or fix return statement |
| Property never read | Remove unused property or add `@phpstan-ignore-next-line` with reason |
| Undefined method on mixed | Add `@var` type assertion before the call |
| Cannot access offset on mixed | Add array shape annotation |

**Only ignore** when:
- Third-party plugin class doesn't exist in analysis environment
- WordPress core behavior is too dynamic for static analysis
- The fix would require unreasonable refactoring of legacy code

Always add a comment explaining why:

```php
/** @phpstan-ignore-next-line WPForms may not be active */
$entries = wpforms()->entry->get_entries($args);
```

## Verification

- [ ] `vendor/bin/phpstan analyse` passes at configured level
- [ ] Baseline file didn't grow (if one exists)
- [ ] No new `@phpstan-ignore` without explanation comment
- [ ] Third-party ignores are scoped to specific class patterns
- [ ] All new code has proper type annotations
