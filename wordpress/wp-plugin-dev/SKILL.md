---
name: wp-plugin-dev
description: "Use when developing Voyager Orbit — adding modules, REST endpoints, services, form integrations, or abilities. Covers the modular architecture, HMAC auth, REST patterns, security model, and release process."
compatibility: "WordPress 6.0+, PHP 8.1+, Composer with PSR-4 autoloading."
---

# Voyager Orbit Plugin Development

## When to Use

- Adding a new module, service, or REST endpoint
- Adding a form integration or ability
- Modifying authentication or security logic
- Fixing REST API issues (401/403, response format)
- Packaging a release
- Working with the Abilities API or ContentGeneration module

## Architecture

```
voyager-core.php              # Bootstrap — constants, autoloader, updater
src/
├── Auth/                     # HMAC-SHA256 authentication
│   ├── AuthMiddleware.php    # REST permission callbacks
│   ├── SignatureValidator.php # Signature creation/verification
│   ├── TokenManager.php      # Site secret management
│   ├── PortalClient.php      # HTTP client for Portal API
│   └── RegistrationService.php # Auto-registration on activation
├── Plugin.php                # Core bootstrap, module loading
├── Settings.php              # Settings helper
├── Abilities.php             # 10 data/reporting abilities
├── Modules/
│   └── {ModuleName}/         # Each module follows this structure:
│       ├── Module.php        # Registration, bootstrap, hook binding
│       ├── bootstrap.php     # Module initialization
│       ├── RestApi.php       # REST endpoint registration
│       ├── Services/         # Business logic classes
│       └── Database/         # Migrations, queries
└── Updater/
    └── GitHubUpdater.php     # Plugin Update Checker wrapper
```

## Authentication Model

Three-tier priority in `AuthMiddleware`:

### 1. WordPress Admin (highest priority)
```php
if (current_user_can('manage_options')) return true;
```

### 2. HMAC-SHA256 Signature
```http
X-Voyager-Site-Id: clientsite.com
X-Voyager-Signature: sha256={HMAC(payload, site_secret)}
X-Voyager-Timestamp: 1707500000
```
- Payload = request body (or empty string for GET)
- 300-second timestamp drift window (replay prevention)
- Constant-time comparison via `hash_equals()`

### 3. Bearer Token (legacy fallback)
```http
Authorization: Bearer {token}
# or legacy header:
X-Voyager-Token: {token}
```

### Permission Levels
- `canRead()` — authentication only (GET endpoints)
- `canWrite()` — auth + rate limiting (60 req/min per site)
- `canManage()` — auth + IP allowlist + rate limiting (management endpoints)

## REST API Conventions

**Namespace:** `voyager/v1`

**Response format:** Always `{ data: T[], total: N }` for list endpoints.

### Registering a New Endpoint

```php
// In module's RestApi.php
add_action('rest_api_init', [$this, 'registerRoutes']);

public function registerRoutes(): void {
    register_rest_route('voyager/v1', '/resource', [
        'methods'             => WP_REST_Server::READABLE,
        'callback'            => [$this, 'getItems'],
        'permission_callback' => [AuthMiddleware::class, 'canRead'],
        'args'                => [
            'per_page' => [
                'type'    => 'integer',
                'default' => 20,
                'minimum' => 1,
                'maximum' => 100,
            ],
        ],
    ]);
}

public function getItems(WP_REST_Request $request): WP_REST_Response {
    $perPage = $request->get_param('per_page');
    // ... query data ...
    return new WP_REST_Response([
        'data'  => $items,
        'total' => $total,
    ]);
}
```

**Rules:**
- Always provide `permission_callback` (never omit)
- Use `WP_REST_Request` methods, never `$_GET`/`$_POST` directly
- Return `WP_REST_Response` or `WP_Error` with explicit status code
- Validate/sanitize via `args` schema, not in callback body

## Adding a New Module

1. Create `src/Modules/{ModuleName}/Module.php`:
```php
namespace Voyager\Orbit\Modules\ModuleName;

class Module {
    public function __construct() {
        // Register hooks, load services
    }
    
    public function registerRestRoutes(): void {
        // REST endpoint registration
    }
}
```

2. Create `Services/` directory for business logic classes
3. Create `RestApi.php` if the module needs REST endpoints
4. Register module in `Plugin.php` bootstrap
5. Use constructor dependency injection

## Adding a Form Integration

1. Create `src/Modules/Leads/Integrations/{FormName}Integration.php`
2. Implement `extractLeadData()` method
3. Use `PhoneDetector` for phone number capture
4. Hook into the form plugin's submission action
5. Register in `Leads/Module.php`

## Security Requirements

- **SQL:** Always use `$wpdb->prepare()` with placeholders — never string concatenation
- **Input:** `sanitize_text_field()`, `sanitize_email()`, `esc_url_raw()`, `absint()`
- **Output:** `esc_html()`, `esc_attr()`, `esc_url()` for any rendered data
- **Auth:** `hash_equals()` for all token/signature comparisons (constant-time)
- **Nonces:** Use for admin forms; REST endpoints use HMAC auth instead
- **Capabilities:** Check `current_user_can()` before any privileged operation

## Distribution & Releases

**Model:** GitHub releases via Plugin Update Checker v5.3

**Release process:**
1. Conventional commits: `feat:`, `fix:`, `chore:`, `docs:`
2. Push to `master` branch
3. Release Please auto-creates version PR
4. Merge PR → GitHub Actions builds ZIP
5. ZIP attached to GitHub release as `voyager-orbit.zip`

**Version rule:** NEVER use major version increments. Patch only (e.g., 1.39.0 → 1.39.1).

**Update token priority:** `VOYAGER_ORBIT_GITHUB_TOKEN` constant > settings option > `.update-token` file.

## Verification

- [ ] `php -l` passes on all changed PHP files
- [ ] Plugin activates without fatals
- [ ] REST endpoint returns expected response format
- [ ] Permission callback rejects unauthenticated requests (401/403)
- [ ] `$wpdb->prepare()` used for all dynamic SQL
- [ ] Conventional commit message format
- [ ] No `var_dump`, `print_r`, or `error_log` left in code
