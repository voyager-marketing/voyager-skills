---
name: voyager-orbit-dev
description: "Development workflow for Voyager Orbit WordPress plugin — module architecture, services, REST endpoints, database conventions, and deployment."
compatibility: "PHP 8.1+, WordPress 6.0+, Voyager Orbit 1.30+"
---

# Voyager Orbit Development

## When to use

- Adding a new module, service, or feature to Voyager Orbit
- Creating or modifying REST API endpoints
- Adding form integrations or database tables
- Debugging plugin architecture questions
- Working with the module singleton pattern

## Inputs required

- Which module or feature area you're working in
- Whether you need database tables, REST endpoints, admin pages, or services

## Procedure

### 1. Understand the module structure

Every module lives in `src/Modules/{ModuleName}/` and follows this pattern:

```
src/Modules/{ModuleName}/
├── Module.php                 # Singleton — register(), install(), uninstall()
├── Database/
│   ├── Schema.php             # Table creation via dbDelta()
│   └── Repository.php         # CRUD queries with $wpdb->prepare()
├── Services/
│   ├── RestApi.php            # REST endpoint handlers
│   └── {ServiceName}.php     # Business logic services
├── Integrations/              # External system hooks (forms, etc.)
├── Admin/                     # Admin pages (PHP templates + JS/CSS)
└── StatusSection/             # System status page sections
```

### 2. Create a new module

**Module.php** — always a singleton:
```php
<?php
declare(strict_types=1);
namespace Voyager\Orbit\Modules\{ModuleName};

final class Module
{
    private static ?self $instance = null;
    private bool $registered = false;

    private function __construct() {}

    public static function instance(): self
    {
        if (!self::$instance instanceof self) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function register(): void
    {
        if ($this->registered) return;
        $this->registered = true;
        // Add hooks, load admin pages, register REST routes
    }

    public function install(): void
    {
        // Create database tables, set options
    }
}
```

**Register in Plugin.php** — add to the module boot list:
```php
Modules\{ModuleName}\Module::instance()->register();
```

### 3. Database conventions

- **Table prefix**: Always `$wpdb->prefix . 'voyager_{table}'` (exception: `lead_events` not `voyager_leads`)
- **Schema**: Use `dbDelta()` in `Schema.php`
- **Queries**: ALWAYS use `$wpdb->prepare()` with placeholders (`%d`, `%s`)
- **Never** concatenate user input into SQL strings

Key tables:
| Table | Module |
|-------|--------|
| `lead_events` | Leads |
| `voyager_activities` | Activity |
| `voyager_api_keys` | Leads |
| `voyager_webhooks` | Webhooks |
| `voyager_insights_cache` | Insights |
| `voyager_stripe_customers` | Billing |
| `voyager_jobs` | Backups |
| `voyager_chat_messages` | Chat |

### 4. REST API conventions

- **Namespace**: `voyager/v1`
- **Response format**: Always `{ data: T[], total: N }`
- **Permission callbacks**: Use `AuthMiddleware::checkRead` or `AuthMiddleware::checkWrite`
- **Register routes** in `rest_api_init` action

```php
register_rest_route('voyager/v1', '/my-endpoint', [
    'methods'             => WP_REST_Server::READABLE,
    'callback'            => [$this, 'handleGet'],
    'permission_callback' => [AuthMiddleware::class, 'checkRead'],
]);
```

### 5. Authentication

Three tiers (first match wins):
1. **WordPress admin** — `current_user_can('manage_options')`
2. **Portal HMAC** — `X-Voyager-Site-Id` + `X-Voyager-Signature` + `X-Voyager-Timestamp`
3. **API Key** — `X-Voyager-API-Key: vk_{key}` (rate-limited)

Use `AuthMiddleware::checkRead` / `AuthMiddleware::checkWrite` for REST permission callbacks.

### 6. Version management

**CRITICAL**: Only patch increments. Never major/minor bumps.
```
1.30.2 → 1.30.3 ✅
1.30.2 → 1.31.0 ❌
```

Use conventional commits:
- `feat:` — new features
- `fix:` — bug fixes
- `chore:` — maintenance

### 7. Testing and deployment

- Push branch → create PR → CI runs (PHP lint + composer + unit tests)
- PR builds produce a downloadable ZIP artifact
- Download ZIP → upload to v3.voyagermark.com for testing
- Merge PR → Release Please → GitHub Release → v3 auto-updates via GitHubUpdater

## Verification

- Run `php -l` on all new PHP files
- Check that `Module::register()` is called in `src/Plugin.php`
- Verify REST endpoints return `{ data: ... }` format
- Confirm all SQL uses `$wpdb->prepare()`

## Failure modes

- **Table not created**: Check `dbDelta()` SQL syntax — must use 2 spaces after PRIMARY KEY
- **REST 403**: Verify `permission_callback` allows the auth method being used
- **Module not loading**: Ensure `Module::instance()->register()` is in `Plugin.php`
- **Wrong table name**: It's `lead_events`, NOT `voyager_leads`

## Escalation

- Architecture docs: `ARCHITECTURE.md`
- API spec: `docs/integration/VOYAGER-REPORT-SPEC.md`
- Auth guide: `docs/api/AUTHENTICATION.md`
