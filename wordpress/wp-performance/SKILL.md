---
name: wp-performance
description: "Use when investigating or improving WordPress performance on Voyager sites: profiling, database optimization, object caching (SpinupWP Redis), Cloudflare rules, GSAP conditional loading, and Core Web Vitals."
compatibility: "WordPress 7.0+, PHP 8.1+, SpinupWP hosting with Redis, Cloudflare CDN."
---

# WordPress Performance — Voyager Stack

## When to Use

- Site or page is slow (high TTFB, poor LCP/CLS/INP)
- Profiling backend or frontend performance
- Configuring Redis object cache on SpinupWP
- Setting Cloudflare cache/WAF rules
- Optimizing database queries or autoloaded options
- Ensuring GSAP/JS loads conditionally (not on every page)

## Voyager Hosting Stack

| Layer | Service |
|-------|---------|
| CDN / WAF | Cloudflare (Full SSL, caching, security rules) |
| Hosting | SpinupWP (managed WordPress on DigitalOcean/AWS) |
| Object Cache | Redis (via SpinupWP toggle) |
| PHP | 8.1+ with OPcache |
| Database | MySQL 8 / MariaDB |

## Measure First

Before changing anything, capture a baseline:

```bash
# TTFB measurement
curl -o /dev/null -s -w "TTFB: %{time_starttransfer}s\nTotal: %{time_total}s\n" https://site.com

# WP-CLI profiling (if available)
wp profile stage --url=https://site.com
wp profile hook --url=https://site.com --spotlight

# WP Doctor diagnostics
wp doctor check --all
```

## SpinupWP Redis Configuration

SpinupWP provides one-click Redis. Verify it's active:

```bash
# Check object cache drop-in exists
wp eval "echo wp_using_ext_object_cache() ? 'Redis active' : 'No object cache';"

# Flush object cache (safe, rebuilds on next request)
wp cache flush

# Check Redis connection
wp redis status  # if redis-cli available
```

**Common issues:**
- Object cache drop-in missing after plugin update — re-enable in SpinupWP panel
- Redis memory full — check `maxmemory` setting, ensure eviction policy is `allkeys-lru`
- Stale cache after deploy — flush via SpinupWP panel or `wp cache flush`

**What to cache:**
- Expensive database queries (use `wp_cache_get/set` with groups)
- External API responses (transients backed by Redis)
- Computed values that don't change per-request

## Cloudflare Rules

### Page Rules (Caching)

| Rule | Setting |
|------|---------|
| `*.com/wp-admin/*` | Cache Level: Bypass |
| `*.com/wp-login.php` | Cache Level: Bypass |
| `*.com/wp-json/*` | Cache Level: Bypass |
| `*.com/*` | Cache Level: Cache Everything, Edge TTL: 4h |

### WAF / Security Rules

- Block `xmlrpc.php` (unless needed for Jetpack)
- Rate limit `/wp-login.php` to 5 requests/10s per IP
- Challenge requests to `wp-admin/` from non-allowlisted countries
- Block user agent strings containing common bot patterns

### Cloudflare APO (if enabled)

WordPress-specific edge caching. Bypasses origin for logged-out users entirely.

**Gotchas:**
- APO caches full HTML — cookie-based personalization breaks
- Purge via Cloudflare plugin or API after deploys
- Test logged-out vs logged-in separately

## Database Optimization

### Autoloaded Options

Large autoloaded options slow every request:

```bash
# Find biggest autoloaded options
wp db query "SELECT option_name, LENGTH(option_value) as size FROM wp_options WHERE autoload='yes' ORDER BY size DESC LIMIT 20;"
```

Fix: Set `autoload = 'no'` for large, infrequently-used options.

### Query Optimization

- Use `$wpdb->prepare()` for all dynamic queries
- Add indexes for frequently queried meta keys
- Avoid `meta_query` with `LIKE` comparisons
- Use `'fields' => 'ids'` in WP_Query when you only need IDs
- Avoid `'posts_per_page' => -1` — always set a limit

### Transient Cleanup

```bash
# Count expired transients
wp db query "SELECT COUNT(*) FROM wp_options WHERE option_name LIKE '_transient_timeout_%' AND option_value < UNIX_TIMESTAMP();"

# Clean expired transients
wp transient delete --expired
```

## GSAP Conditional Loading (Voyager Blocks)

Voyager Blocks uses `inc/conditional-loading-cache.php` to only load GSAP on pages that use Voyager blocks. This is tracked via `_voyager_blocks_used` post meta.

**If GSAP loads on pages without Voyager blocks:**
1. Check `_voyager_blocks_used` meta is being set on `save_post`
2. Check conditional loading cache isn't bypassed by `voyager_blocks_global_gsap` setting
3. Verify no other plugin enqueues GSAP globally

## WordPress 6.9+ Performance Features

- **On-demand CSS loading** — only loads styles for blocks on the page (30-65% CSS reduction)
- **Block themes with zero render-blocking CSS** — styles inlined from theme.json
- **Increased inline CSS limit** — fewer render-blocking stylesheets

## Core Web Vitals Checklist

| Metric | Target | Common Fixes |
|--------|--------|-------------|
| **LCP** | < 2.5s | Optimize hero images, preload critical fonts, reduce TTFB |
| **CLS** | < 0.1 | Set explicit image dimensions, avoid layout shifts from lazy-loaded content |
| **INP** | < 200ms | Defer non-critical JS, reduce main thread blocking, use `requestIdleCallback` |

**Voyager-specific:**
- Preload Inter font if used (add `<link rel="preload">` in functions.php)
- Ensure hero pattern images have explicit width/height
- GSAP animations should not cause layout shifts (use `transform`, not `top`/`left`)

## Profiling Workflow

1. **Measure** — capture baseline (curl TTFB, Lighthouse, WebPageTest)
2. **Profile** — `wp profile stage` to find bottleneck layer
3. **Diagnose** — `wp profile hook --spotlight` for slow hooks
4. **Fix** — target the single largest bottleneck
5. **Verify** — re-measure same URL, same conditions
6. **Monitor** — set up Cloudflare analytics or SpinupWP monitoring

## Verification

- [ ] TTFB under 400ms for logged-out homepage
- [ ] Object cache hit rate > 80%
- [ ] No autoloaded options > 100KB
- [ ] GSAP only loads on pages with Voyager blocks
- [ ] Cloudflare cache HIT for static assets
- [ ] Core Web Vitals pass (LCP < 2.5s, CLS < 0.1, INP < 200ms)
