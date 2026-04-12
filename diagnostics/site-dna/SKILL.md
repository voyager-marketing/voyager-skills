---
name: site-dna
description: "Structured analysis of a WordPress site's technical fingerprint — theme, plugins, builder, content shape, WP/PHP versions, and hosting signals. Use to understand a site before proposing changes."
compatibility: "Any WordPress site with WP-CLI or REST API access."
---

# Site DNA Analysis

## Trigger Phrases

- "What's this site running?"
- "Audit this site"
- "Site DNA" / "site fingerprint"
- "Before we make changes, what are we working with?"
- Before any migration, redesign, or performance work

## Analysis Steps

### 1. Core Environment

```bash
wp core version
wp cli info --format=json
php -v | head -1
wp db size --tables --format=table
```

Capture: WordPress version, PHP version, DB size, WP-CLI version.

### 2. Theme Stack

```bash
wp theme list --status=active --format=json
wp theme get $(wp theme list --status=active --field=name) --format=json
```

Check:
- Is it a block theme? (`theme.json` + `templates/` present)
- Is it a child theme? (check `Template:` header)
- Parent theme identity and version
- Custom templates count
- Pattern count

### 3. Plugin Inventory

```bash
wp plugin list --format=json
wp plugin list --status=active --format=table
```

Classify active plugins into:
- **Builders:** Elementor, Divi, Beaver Builder, Bricks, Oxygen
- **SEO:** Yoast, RankMath, AIOSEO, Site Kit
- **Forms:** Gravity Forms, WPForms, CF7, Formidable
- **Caching:** WP Rocket, W3TC, LiteSpeed, Redis
- **Security:** Wordfence, Sucuri, iThemes
- **Voyager:** Orbit, Core, Blocks

### 4. Content Shape

```bash
wp post list --post_type=page --post_status=publish --format=count
wp post list --post_type=post --post_status=publish --format=count
wp post-type list --_builtin=0 --format=table
wp taxonomy list --_builtin=0 --format=table
```

Count: pages, posts, custom post types, custom taxonomies, media items.

### 5. Builder Detection

Check for builder-specific meta or content patterns:

```bash
# Elementor
wp db query "SELECT COUNT(*) FROM wp_postmeta WHERE meta_key='_elementor_edit_mode'" --skip-column-names

# Divi
wp db query "SELECT COUNT(*) FROM wp_postmeta WHERE meta_key='_et_pb_use_builder' AND meta_value='on'" --skip-column-names

# Block editor (Gutenberg)
wp db query "SELECT COUNT(*) FROM wp_posts WHERE post_content LIKE '%<!-- wp:%' AND post_status='publish'" --skip-column-names
```

### 6. Hosting Signals

```bash
# Check for managed hosting indicators
wp eval "echo php_sapi_name();"
wp eval "echo isset(\$_SERVER['SPINUPWP']) ? 'SpinupWP' : 'unknown';"
wp eval "echo extension_loaded('redis') ? 'Redis available' : 'No Redis';"
wp eval "echo wp_using_ext_object_cache() ? 'Object cache active' : 'No object cache';"
```

Check HTTP headers for Cloudflare, Fastly, or other CDN indicators.

## Report Format

```markdown
## Site DNA Report: {site-url}

### Environment
- WordPress: {version}
- PHP: {version}
- Database: {size}
- Object Cache: {yes/no + type}
- CDN: {detected or none}

### Theme
- Active: {name} v{version}
- Type: {block theme / classic / hybrid}
- Parent: {name or "none"}
- Templates: {count}
- Patterns: {count}

### Plugins ({active_count} active / {total_count} total)
| Category | Plugins |
|----------|---------|
| Builder | {list or "None"} |
| SEO | {list} |
| Forms | {list} |
| Caching | {list} |
| Voyager | {list} |

### Content
| Type | Count |
|------|-------|
| Pages | {n} |
| Posts | {n} |
| CPTs | {list with counts} |
| Media | {n} |

### Builder Usage
- Primary editor: {Gutenberg / Elementor / Divi / Mixed}
- Block-edited pages: {n}
- Builder-edited pages: {n}

### Recommendations
- {Specific recommendations based on findings}
```

## Integration

This analysis feeds into:
- **technical-debt-audit** — uses site DNA as starting context
- **accessibility-audit** — uses content counts to scope the audit
- **Performance profiling** — uses hosting/cache info to target optimizations
