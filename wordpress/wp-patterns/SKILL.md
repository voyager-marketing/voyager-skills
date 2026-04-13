---
name: wp-patterns
description: "Use this skill when the user asks to create a new pattern, add a block pattern, make a pattern, or generate a page section pattern for the Voyager Blocks plugin."
argument-hint: "<pattern-slug> [--category=voyager-hero]"
allowed-tools: [Read, Write, Edit, Glob, Grep]
user-invocable: true
---

# Create a New Voyager Block Pattern

Generate a block pattern PHP file following the format of the existing patterns. The plugin root is defined in the project's CLAUDE.md — use `PLUGIN_ROOT` from that file. Patterns live in `$PLUGIN_ROOT/patterns/`.

## Process

### 1. Gather Requirements

Ask the user for (if not provided):
- **Pattern slug** (kebab-case, e.g. `hero-gradient`)
- **Title** (human-readable)
- **Description** (one sentence)
- **Category** — one of the 13 registered categories:
  - `voyager-hero` — Hero sections
  - `voyager-cta` — Call to Action
  - `voyager-features` — Feature sections
  - `voyager-services` — Service-related
  - `voyager-content` — Generic content
  - `voyager-portfolio` — Portfolio showcase
  - `voyager-testimonials` — Testimonials
  - `voyager-stats` — Statistics
  - `voyager-team` — Team & About
  - `voyager-pricing` — Pricing tables
  - `voyager-faq` — FAQ sections
  - `voyager-contact` — Contact sections
  - `voyager-logos` — Logo Bar & Trust
- **Keywords** — search terms array
- **Design intent** — what the pattern should look like

### 2. Generate Pattern File

Create `$PLUGIN_ROOT/patterns/{slug}.php` with this exact format:

```php
<?php
/**
 * Pattern: {Title}
 *
 * @package VoyagerBlocks
 */

return array(
    'title'         => __( '{Title}', 'voyager-blocks' ),
    'description'   => __( '{Description}', 'voyager-blocks' ),
    'categories'    => array( '{category-slug}' ),
    'keywords'      => array( '{keyword1}', '{keyword2}' ),
    'viewportWidth' => 1440,
    'content'       => '
<!-- wp:group {"align":"full","style":{"spacing":{"padding":{"top":"var:preset|spacing|60","bottom":"var:preset|spacing|60","left":"var:preset|spacing|30","right":"var:preset|spacing|30"}}}} -->
<div class="wp-block-group alignfull" style="padding-top:var(--wp--preset--spacing--60);padding-bottom:var(--wp--preset--spacing--60);padding-left:var(--wp--preset--spacing--30);padding-right:var(--wp--preset--spacing--30)">

<!-- Pattern content blocks here -->

</div>
<!-- /wp:group -->
',
);
```

### 3. Content Guidelines

**Spacing:** Use `var:preset|spacing|{size}` tokens (10-80 scale) — never hardcoded px for section spacing.

**Colors:** Use theme palette colors where possible. When using hex, prefer neutrals:
- Text: `#111827`, `#374151`, `#4b5563`, `#6b7280`
- Backgrounds: `#ffffff`, `#f9fafb`, `#f3f4f6`
- Accents: Use `var:preset|color|{name}` when available

**Typography:** Use `clamp()` for fluid sizing or WordPress font size presets.

**Block vocabulary:** Use WordPress core blocks + Voyager custom blocks:
- Core: `group`, `columns`, `column`, `heading`, `paragraph`, `image`, `buttons`, `button`, `spacer`, `separator`, `details`, `cover`
- Voyager: `voyager/animated-section`, `voyager/stats-counter`, `voyager/testimonial-carousel`, `voyager/service-cards`, etc.

**Responsive:** Patterns should work at all viewport widths. Use `columns` block with `isStackedOnMobile` for layouts.

**Images:** Use WebP format only. No spacer blocks for decorative spacing — use CSS spacing tokens.

### 4. Auto-Registration

No manual registration needed. The `patterns.php` file automatically globs all `patterns/*.php` files and registers them as `voyager/{slug}`.

### 5. Verify

After creation, confirm:
- File exists at `$PLUGIN_ROOT/patterns/{slug}.php`
- PHP syntax is valid: `php -l $PLUGIN_ROOT/patterns/{slug}.php`
- Pattern returns a valid array with required keys (title, content)
- Block markup is valid (matching opening/closing comments)
- Category exists in the 13 registered categories

## Reference

Read existing patterns for inspiration:
- `patterns/hero-minimal.php` — Simple hero section
- `patterns/features-3col.php` — Feature grid layout
- `patterns/cta-centered.php` — Call to action
- `patterns/faq-accordion.php` — FAQ with details block
