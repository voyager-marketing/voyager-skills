---
name: wp-block-theming
description: "Use when editing theme.json, templates, template parts, patterns, style variations, or functions.php in the voyagermark block child theme. Covers FSE architecture, design tokens, pattern registration, and the parent/child theme relationship."
compatibility: "WordPress 7.0+, PHP 8.1+, theme.json version 3, parent theme: voyager-block-theme."
---

# Voyagermark Block Theming

## When to Use

- Editing theme.json (colors, typography, spacing, per-block styles)
- Creating or modifying templates (templates/*.html) or parts (parts/*.html)
- Creating or modifying block patterns (patterns/*.php)
- Adding style variations (styles/*.json)
- Debugging "styles not applying" or editor/frontend mismatches
- Adding CSS animations or custom styles

## Architecture

Voyagermark is a **child theme** of `voyager-block-theme` (parent provides 88 patterns, GSAP animations, design system).

```
voyagermark/
├── theme.json           # Design tokens + styles (version 3, wp/7.0 schema)
├── style.css            # Theme metadata only (no custom CSS inline)
├── functions.php        # Enqueues, pattern categories, brand guidelines
├── templates/           # Block templates (HTML with block comments)
│   ├── front-page.html  # Homepage — references patterns by slug
│   ├── page.html        # Standard page
│   ├── single.html      # Single post
│   ├── archive.html     # Archive listing
│   ├── search.html      # Search results
│   ├── 404.html         # Not found
│   └── index.html       # Fallback
├── parts/               # Template parts (flat, no subdirs)
│   ├── header.html      # Sticky nav (flex: site-title + navigation)
│   └── footer.html      # Footer component
├── patterns/            # Block patterns (PHP, auto-loaded via glob)
├── assets/
│   ├── css/custom.css   # Custom CSS beyond theme.json
│   └── js/custom.js     # Custom JavaScript
```

## Design Tokens (from theme.json)

| Token | Value |
|-------|-------|
| Primary | `#462CFF` |
| Secondary | `#F22AAA` |
| Accent | `#00D4AA` |
| Dark | `#0A0A1A` |
| Light | `#F8F8FC` |
| Surface | `#FFFFFF` |
| Muted | `#646970` |
| Font | Inter, system fallback |
| Content width | 780px |
| Wide width | 1200px |
| Border radius | 8px (buttons), 12px (cards) |

Spacing presets: 10 (0.25rem) through 80 (8rem). Reference as `var:preset|spacing|{size}`.

## theme.json Editing

```json
{
  "$schema": "https://schemas.wp.org/wp/7.0/theme.json",
  "version": 3,
  "settings": { /* presets: what editor exposes */ },
  "styles": { /* defaults: how it looks */ }
}
```

**Style hierarchy** (lowest to highest priority):
1. Core defaults
2. Parent theme.json
3. Child theme.json (this file)
4. User customizations (stored in DB)

User customizations override theme.json. If your changes seem "ignored," check Site Editor > Styles for user overrides.

**Per-block styles:** Add under `styles.blocks["core/block-name"]`.

## Templates

Templates use WordPress block markup (HTML comments with JSON attributes):

```html
<!-- wp:template-part {"slug":"header","tagName":"header"} /-->

<!-- wp:group {"tagName":"main","layout":{"type":"constrained"}} -->
<main class="wp-block-group">
  <!-- wp:pattern {"slug":"voyagermark/hero-home"} /-->
</main>
<!-- /wp:group -->

<!-- wp:template-part {"slug":"footer","tagName":"footer"} /-->
```

**Rules:**
- Reference patterns by slug: `<!-- wp:pattern {"slug":"voyagermark/pattern-name"} /-->`
- Wrap main content in `wp:group` with `tagName: "main"`
- Homepage sections must be `align: "full"` with `layout: "constrained"` inside
- No decorative HTML comments — only `<!-- wp:block-name -->` comments allowed
- Use spacing presets, not raw values

## Template Parts

- Live in `parts/` (flat directory, no nesting)
- Referenced via `<!-- wp:template-part {"slug":"part-name","tagName":"header"} /-->`
- Header: sticky, flex row (site-title + navigation), spacing via presets
- Footer: matching or complementing header style

## Patterns

PHP files with header comments, auto-loaded from `patterns/` via glob in functions.php:

```php
<?php
/**
 * Title: Pattern Display Name
 * Slug: voyagermark/pattern-slug
 * Categories: voyagermark-category
 * Keywords: keyword1, keyword2, keyword3
 * Block Types: core/group
 */
?>
<!-- wp:group {"align":"full","backgroundColor":"dark","textColor":"light","layout":{"type":"constrained"}} -->
<div class="wp-block-group alignfull has-dark-background-color has-light-color has-text-color has-background">
  <!-- content blocks -->
</div>
<!-- /wp:group -->
```

**Pattern conventions:**
- Slug format: `voyagermark/kebab-case-name`
- Categories: `voyagermark`, `voyagermark-hero`, `voyagermark-services`, `voyagermark-cta`
- Sections: full-width wrapper with constrained inner layout
- Colors: use palette slugs (primary, secondary, accent, dark, light, surface)
- Spacing: use preset references (`var:preset|spacing|50`)
- Cards: 12px border-radius, `var:preset|spacing|50` padding

## Section Pattern (Full-Bleed Wrapper)

Every homepage section uses this structure:

```html
<!-- wp:group {"align":"full","backgroundColor":"surface","style":{"spacing":{"margin":{"top":"0"},"padding":{"top":"var:preset|spacing|80","bottom":"var:preset|spacing|80"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group alignfull ...">
  <!-- section content at content width -->
</div>
<!-- /wp:group -->
```

Always set `margin.top: 0` on section groups. Alternate backgrounds between adjacent sections.

## Animation

- Parent theme provides GSAP animations via Voyager Core
- For CSS-only animations, add classes via `className` attribute in block markup
- Add animation CSS to `assets/css/custom.css`
- Always include `prefers-reduced-motion: reduce` media query
- Scroll reveals: use `animate-on-scroll` class + IntersectionObserver in functions.php

## Verification

- [ ] `php -l` passes on all PHP files
- [ ] theme.json is valid JSON
- [ ] Pattern files have required headers (Title, Slug, Categories)
- [ ] Theme activates without errors
- [ ] Templates render correctly in Site Editor
- [ ] Styles apply in both editor and frontend
- [ ] Full-width sections are actually full-bleed (not narrow)
