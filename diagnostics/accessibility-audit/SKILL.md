---
name: accessibility-audit
description: "WCAG 2.1 AA accessibility audit for WordPress sites — heading structure, alt text, link quality, color contrast, form labels, keyboard navigation, and ARIA usage. Produces a structured report with remediation steps."
compatibility: "Any WordPress site. Best with WP-CLI + browser access for visual checks."
---

# Accessibility Audit (WCAG 2.1 AA)

## Trigger Phrases

- "Check accessibility"
- "Is this accessible?"
- "WCAG audit"
- "A11y check"
- "Run an accessibility audit on {page/post/site}"

## Analysis Steps

### 1. Heading Structure

Check every published page/post for:
- Exactly one `<h1>` per page
- No skipped heading levels (h1 → h3 without h2)
- Headings used for structure, not styling

```bash
# Extract heading structure from a URL
curl -s https://site.com/page | grep -oP '<h[1-6][^>]*>.*?</h[1-6]>' | sed 's/<[^>]*>//g'
```

**For block content:**
```bash
wp post get {ID} --field=post_content | grep -oP '<!-- wp:heading \{[^}]*\} -->' | grep -oP '"level":\d'
```

### 2. Image Alt Text

```bash
# Find images without alt text in published content
wp db query "
  SELECT ID, post_title
  FROM wp_posts
  WHERE post_status='publish'
  AND post_type IN ('page','post')
  AND post_content LIKE '%<img%'
  AND post_content REGEXP '<img[^>]+alt=\"\"'
  OR post_content REGEXP '<img(?![^>]*alt=)[^>]*>'
;" --skip-column-names
```

Check:
- All `<img>` tags have `alt` attribute
- Decorative images use `alt=""`
- Alt text is descriptive (not "image1.jpg" or "IMG_1234")
- Featured images have alt text set in media library

### 3. Link Text Quality

Check for non-descriptive link text:

```bash
# Find "click here", "read more", "learn more" links
wp db query "
  SELECT ID, post_title
  FROM wp_posts
  WHERE post_status='publish'
  AND (
    post_content LIKE '%>click here<%'
    OR post_content LIKE '%>read more<%'
    OR post_content LIKE '%>here<%'
    OR post_content LIKE '%>link<%'
  )
;" --skip-column-names
```

Links should make sense out of context. Screen readers often list all links on a page.

### 4. Color Contrast

For theme colors defined in theme.json:

```bash
# Extract palette colors
wp eval "
  \$theme = wp_get_global_settings();
  foreach (\$theme['color']['palette']['theme'] ?? [] as \$c) {
    echo \$c['slug'] . ': ' . \$c['color'] . PHP_EOL;
  }
"
```

Check contrast ratios (WCAG AA minimums):
- **Normal text:** 4.5:1
- **Large text (18px+ or 14px bold):** 3:1
- **UI components:** 3:1

Common failures:
- Light gray text on white backgrounds
- Colored text on colored backgrounds
- Placeholder text in form fields

### 5. Form Accessibility

```bash
# Check for forms without labels
curl -s https://site.com/contact | grep -c '<input\|<select\|<textarea' && \
curl -s https://site.com/contact | grep -c '<label'
```

Every form field needs:
- Associated `<label>` element (via `for` attribute or wrapping)
- Error messages linked with `aria-describedby`
- Required fields indicated (not just by color)
- Tab order follows visual order

### 6. Keyboard Navigation

Manual checks (or via headless browser):
- All interactive elements reachable via Tab key
- Focus indicator visible on every focusable element
- No keyboard traps (can always Tab away)
- Skip-to-content link present
- Modal dialogs trap focus correctly

### 7. ARIA & Semantic HTML

```bash
# Check for ARIA misuse in theme templates
grep -rn 'role=\|aria-' wp-content/themes/active-theme/ --include="*.html" --include="*.php" | head -20
```

Check:
- `role` attributes match element semantics (don't put `role="button"` on a `<div>` — use `<button>`)
- `aria-label` used only when visible text isn't sufficient
- `aria-hidden="true"` on decorative elements
- Landmark regions: `<nav>`, `<main>`, `<header>`, `<footer>`

## Report Format

```markdown
## Accessibility Audit: {site-url}

**Audit Date:** {date}
**Standard:** WCAG 2.1 Level AA
**Pages Audited:** {count}

### Summary
| Category | Pass | Fail | Score |
|----------|------|------|-------|
| Headings | {n} | {n} | {%} |
| Alt Text | {n} | {n} | {%} |
| Link Text | {n} | {n} | {%} |
| Contrast | {n} | {n} | {%} |
| Forms | {n} | {n} | {%} |
| Keyboard | {n} | {n} | {%} |
| ARIA/Semantics | {n} | {n} | {%} |

**Overall Score:** {percentage}%

### Critical Issues (Blocks Access)
| Issue | Page | WCAG Criterion | Fix |
|-------|------|---------------|-----|
| {description} | {url} | {e.g., 1.1.1} | {specific fix} |

### Warnings (Degrades Experience)
| Issue | Page | Fix |
|-------|------|-----|
| {description} | {url} | {fix} |

### Passed Checks
- {list of things that passed}

### Remediation Priority
1. {Fix critical issues first — these block users entirely}
2. {Fix contrast issues — affects readability for many users}
3. {Fix form labels — affects form completion}
4. {Fix link text — affects navigation with screen readers}
5. {Fix heading structure — affects page comprehension}
```

## WCAG Quick Reference

| Criterion | Requirement |
|-----------|-------------|
| 1.1.1 | All images have alt text |
| 1.3.1 | Headings, lists, and tables use semantic HTML |
| 1.4.3 | Text contrast ratio ≥ 4.5:1 (AA) |
| 2.1.1 | All functionality via keyboard |
| 2.4.1 | Skip navigation link present |
| 2.4.4 | Link purpose clear from text |
| 2.4.6 | Headings and labels descriptive |
| 3.3.2 | Form inputs have labels |
| 4.1.2 | ARIA roles and states correct |
