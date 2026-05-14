---
name: wp-block-audit
description: "Use this skill when the user asks to audit blocks, check block quality, review all blocks, run quality checks, or validate block completeness for a Voyager Blocks plugin."
owner: Ben
last_reviewed: 2026-05-14
distribution: internal
origin: voyager
mcp_requirement: none
logic_type: workflow
surface: claude-code
argument-hint: "[block-slug] [--all]"
allowed-tools: [Read, Glob, Grep, Bash]
user-invocable: true
---

# Audit Voyager Blocks

Run quality, completeness, and best-practice checks on blocks in the voyager-blocks plugin. The plugin root is defined in the project's CLAUDE.md — use `PLUGIN_ROOT` from that file.

## Audit Scope

If a specific block slug is provided, audit only that block. Otherwise audit all blocks in `$PLUGIN_ROOT/src/blocks/`.

## Checks Per Block

### 1. File Completeness

Every block in `src/blocks/{slug}/` should have:
- [ ] `block.json` — block metadata
- [ ] `index.js` — block registration
- [ ] `edit.js` — editor component
- [ ] `save.js` — save component (or `render.php` for dynamic blocks)
- [ ] `editor.scss` — editor styles
- [ ] `style.scss` — frontend styles

Optional:
- [ ] `frontend.js` — frontend interactivity (if GSAP/JS needed)
- [ ] `README.md` — block documentation

### 2. block.json Quality

- [ ] `apiVersion` is 3
- [ ] `name` follows `voyager/{slug}` convention
- [ ] `category` is `"voyager"`
- [ ] `title` is present and descriptive
- [ ] `description` is present
- [ ] `keywords` array has 3+ terms
- [ ] `textdomain` is `"voyager"`
- [ ] `supports` includes html:false, align, color, spacing, typography
- [ ] `example` is present (for block preview)
- [ ] File references are correct (editorScript, editorStyle, style, viewScript)

### 3. GSAP Integration (if frontend.js exists)

- [ ] Uses `waitForGSAP()` polling pattern
- [ ] Has `data-initialized` guard to prevent re-init
- [ ] Checks `prefers-reduced-motion` and provides fallback
- [ ] Uses `window.gsap` (not imported gsap)
- [ ] Has proper DOMContentLoaded / readyState handling
- [ ] ScrollTrigger cleanup on unmount (if applicable)

### 4. Accessibility

- [ ] `aria-label` on interactive elements in save.js
- [ ] `prefers-reduced-motion` media query in style.scss
- [ ] `prefers-contrast: more` media query in style.scss
- [ ] Semantic HTML in save.js (not just divs)
- [ ] Keyboard navigable (if interactive)

### 5. Registration Sync

- [ ] Block has a compiled output in `build/blocks/{slug}/`
- [ ] If `frontend.js` exists → webpack.config.js has a `{slug}-frontend` entry
- [ ] If `frontend.js` exists → voyager-blocks.php `$block_scripts` has matching entry
- [ ] GSAP dependencies are correctly specified in $block_scripts

### 6. CSS Quality

- [ ] Uses CSS custom properties (not hardcoded brand colors)
- [ ] Uses `clamp()` for fluid sizing where appropriate
- [ ] Has responsive considerations
- [ ] Editor styles have dashed border preview pattern
- [ ] No `!important` overrides (except for specificity edge cases)

## Output Format

### Per-Block Scorecard

```
## voyager/{slug} — Score: X/10

| Check              | Status | Details |
|--------------------|--------|---------|
| File completeness  | PASS   | 7/7 files |
| block.json quality | WARN   | Missing keywords |
| GSAP integration   | PASS   | All patterns correct |
| Accessibility      | FAIL   | No prefers-contrast |
| Registration sync  | PASS   | webpack + PHP aligned |
| CSS quality        | WARN   | Hardcoded color on line 12 |
```

### Overall Summary

After all blocks are audited, provide:
- Total blocks audited
- Average score
- Top 3 most common issues
- Specific action items ranked by impact
