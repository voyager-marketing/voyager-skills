---
name: wp-voyager-conventions
description: "Shared conventions across all Voyager WordPress repos — naming, auth, API patterns, commit format, release process, and dependency relationships."
compatibility: "All Voyager WordPress projects."
---

# Voyager WordPress Conventions

## When to Use

- Starting work on any Voyager WordPress repo
- Creating new modules, blocks, endpoints, or patterns
- Reviewing code for convention compliance
- Onboarding to the Voyager codebase

## Plugin Ecosystem

| Repo | Type | Purpose |
|------|------|---------|
| `voyager-orbit` | Plugin | Lead tracking, analytics, AI abilities, REST API, MCP |
| `voyager-core` | Plugin | CPTs, meta fields, GSAP registration, entrance animations |
| `voyager-blocks` | Plugin | 28 Gutenberg blocks, 114 patterns, 13 extensions |
| `voyager-block-theme` | Theme | Parent block theme (88 patterns, design system) |
| `voyagermark` | Theme | Agency site child theme |
| Client child themes | Theme | Per-client child themes extending voyager-block-theme |

### Dependency Chain

```
voyager-block-theme (parent)
  └── voyagermark / client themes (children)

voyager-core (required by)
  ├── voyager-blocks (soft dep — GSAP, entrance animations)
  └── voyager-orbit (independent, but co-installed)
```

## Naming Conventions

### Blocks (voyager-blocks)
- **Block name:** `voyager/{block-slug}` — kebab-case
- **Directory:** `src/blocks/{block-slug}/`
- **CSS class:** `wp-block-voyager-{block-slug}`
- **Category:** `voyager`
- **Text domain:** `voyager-blocks`

### Patterns
- **Slug:** `{theme-slug}/{pattern-name}` (e.g., `voyagermark/hero-home`)
- **Registration:** Auto-loaded via `glob()` from `patterns/` directory
- **Format:** PHP file with header comments (Title, Slug, Categories, Keywords)

### REST Endpoints (voyager-orbit)
- **Namespace:** `voyager/v1`
- **Response format:** `{ data: T[], total: N }` for lists
- **Auth:** HMAC-SHA256 via `AuthMiddleware` (see below)

### PHP (voyager-orbit)
- **Namespace:** `Voyager\Orbit\{Module}\{Class}`
- **Autoloading:** PSR-4 via Composer (`src/` → `Voyager\Orbit\`)
- **PHP version:** 8.1+ with `declare(strict_types=1)`

## Authentication Pattern

All Voyager REST endpoints use the same three-tier auth:

1. **WordPress admin:** `current_user_can('manage_options')` — bypasses API auth
2. **HMAC-SHA256:** Three headers required:
   - `X-Voyager-Site-Id` — site domain
   - `X-Voyager-Signature` — `sha256=` + HMAC of payload
   - `X-Voyager-Timestamp` — Unix timestamp (300s drift max)
3. **Bearer token:** `Authorization: Bearer {token}` (legacy fallback)

Constant-time comparison via `hash_equals()` everywhere.

## Security Baseline

Every Voyager repo follows these rules:

- `$wpdb->prepare()` for all dynamic SQL — never string concatenation
- `sanitize_text_field()`, `sanitize_email()`, `esc_url_raw()` for input
- `esc_html()`, `esc_attr()`, `esc_url()` for output
- `hash_equals()` for all secret comparisons
- No `eval()`, `shell_exec()`, `exec()`, `system()`
- `prefers-reduced-motion: reduce` respected in all animations

## Commit Convention

All repos use Conventional Commits:

```
feat: new feature (minor version bump)
fix: bug fix (patch version bump)
chore: maintenance (no version bump)
docs: documentation only
refactor: code restructuring
test: adding/fixing tests
```

**Scopes** vary by repo:
- voyager-blocks: `blocks`, `patterns`, `extensions`, `settings`
- voyagermark: `theme`, `pattern`, `template`, `style`, `function`
- voyager-orbit: `leads`, `activity`, `auth`, `api`, `seo`, `billing`

## Release Process

All repos use Release Please + GitHub Actions:

1. Push conventional commits to main/master
2. Release Please auto-creates version PR
3. Merge PR triggers build + ZIP artifact
4. GitHub release with ZIP attached
5. Plugin Update Checker (PUC) pulls from GitHub releases

**Version rule (Orbit):** Never use major bumps. Patch only (1.39.0 → 1.39.1).

## Hosting Stack

| Layer | Service |
|-------|---------|
| CDN/WAF | Cloudflare |
| Hosting | SpinupWP (DigitalOcean) |
| Cache | Redis (SpinupWP toggle) |
| PHP | 8.1+ with OPcache |
| DB | MySQL 8 / MariaDB |

## GSAP Convention

- GSAP 3.13 registered globally by Voyager Core (priority 5)
- Blocks never import GSAP — it's a global dependency
- Use `gsap.from()` for scroll-triggered entrance animations
- Conditional loading: only enqueue on pages with Voyager blocks
- Always respect `prefers-reduced-motion: reduce`
