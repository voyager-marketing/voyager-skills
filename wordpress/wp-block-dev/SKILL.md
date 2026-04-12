---
name: wp-block-dev
description: "Use when creating, modifying, or debugging Voyager Gutenberg blocks. Covers block.json metadata, edit/save components, GSAP frontend scripts, deprecations, and the @wordpress/scripts build pipeline."
compatibility: "WordPress 6.0+, PHP 7.4+, @wordpress/scripts 27+, GSAP 3.13 (provided by Voyager Core)."
---

# Voyager Block Development

## When to Use

- Creating a new `voyager/*` block
- Modifying block.json (attributes, supports, scripts)
- Fixing "Invalid block" / attributes not persisting
- Adding or updating frontend GSAP animations
- Adding block deprecations after save markup changes
- Build issues with `@wordpress/scripts`

## Inputs Required

- Block slug (kebab-case, e.g., `animated-counter`)
- Whether the block needs frontend JS (GSAP animations)
- Whether it's a parent or child block
- Target supports (color, spacing, typography, align, anchor)

## Creating a New Block

1. Create directory: `src/blocks/{block-slug}/`
2. Create required files:
   - `block.json` — metadata (see template below)
   - `index.js` — registers block, imports edit/save
   - `edit.js` — editor component with `useBlockProps()` + `InspectorControls`
   - `save.js` — static save with `useBlockProps.save()` + data attributes
   - `editor.scss` — editor-only styles
   - `style.scss` — shared styles (editor + frontend)
3. If block needs frontend interactivity: add `frontend.js`
4. Run `npm run build` to compile
5. Block auto-registers — no PHP changes needed

### block.json Template

```json
{
  "$schema": "https://schemas.wp.org/trunk/block.json",
  "apiVersion": 3,
  "name": "voyager/{block-slug}",
  "version": "1.0.0",
  "title": "Block Title",
  "category": "voyager",
  "icon": "dashicon-name",
  "description": "One-line description.",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "supports": {
    "html": false,
    "anchor": true,
    "align": ["wide", "full"],
    "spacing": { "margin": true, "padding": true },
    "color": { "background": true, "text": true, "gradients": true }
  },
  "attributes": {},
  "textdomain": "voyager-blocks",
  "editorScript": "file:./index.js",
  "editorStyle": "file:./editor.css",
  "style": "file:./style-index.css",
  "viewScript": "file:./frontend.js"
}
```

### index.js Template

```js
import { registerBlockType } from '@wordpress/blocks';
import './style.scss';
import Edit from './edit';
import save from './save';
import deprecated from './deprecated';
import metadata from './block.json';

registerBlockType(metadata.name, { edit: Edit, save, deprecated });
```

## Edit Component Pattern

```js
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, TextControl, RangeControl, ToggleControl, SelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default function Edit({ attributes, setAttributes }) {
  const blockProps = useBlockProps({ className: 'voyager-{block-slug}' });
  return (
    <>
      <InspectorControls>
        <PanelBody title={__('Settings', 'voyager-blocks')} initialOpen={true}>
          {/* Controls here */}
        </PanelBody>
      </InspectorControls>
      <div {...blockProps}>{/* Editor preview */}</div>
    </>
  );
}
```

## Save Component Pattern

- Use `useBlockProps.save()` — never manual wrapper attributes
- Pass config to frontend via `data-*` attributes on the wrapper
- Keep save output minimal and stable — changes require deprecations

```js
import { useBlockProps } from '@wordpress/block-editor';

export default function save({ attributes }) {
  const blockProps = useBlockProps.save({
    className: 'wp-block-voyager-{block-slug}',
    'data-duration': attributes.duration,
  });
  return <div {...blockProps}>{/* Static markup */}</div>;
}
```

## Frontend Script Pattern

- GSAP is global (registered by Voyager Core) — never `import gsap`
- Query blocks by CSS class, read config from `data-*` attributes
- Always respect `prefers-reduced-motion: reduce`
- Use `gsap.from()` for scroll-triggered entrance animations

```js
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.wp-block-voyager-{block-slug}').forEach((el) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // Set final state without animation
      return;
    }
    // GSAP animation using el.dataset values
  });
});
```

## Child Blocks

- Add `"parent": ["voyager/parent-block"]` in block.json
- Add `"reusable": false` to supports
- Parent uses `<InnerBlocks>` in edit, `<InnerBlocks.Content />` in save
- Use `providesContext`/`usesContext` for parent→child data

## Deprecations

When save markup changes, add entry to `deprecated.js`:

```js
export default [
  {
    attributes: { /* old attribute schema */ },
    save({ attributes }) {
      // Old save output exactly as it was
    },
    migrate(attributes) {
      return { ...attributes, /* transform old → new */ };
    },
  },
];
```

Order: newest deprecation first.

## Build & Verify

```bash
npm run build          # Compile all blocks
npm run start          # Watch mode for development
```

### Checklist

- [ ] `npm run build` passes
- [ ] Block appears in inserter under "Voyager Blocks"
- [ ] Insert → save → reload: no "Invalid block"
- [ ] If save changed: deprecation added
- [ ] Frontend animations fire correctly
- [ ] `prefers-reduced-motion` respected
- [ ] Data attributes match between save.js and frontend.js

## Common Failures

| Symptom | Cause | Fix |
|---------|-------|-----|
| "Invalid block" on reload | Save markup changed without deprecation | Add `deprecated.js` entry |
| Attribute not saving | Missing from block.json `attributes` | Add attribute definition |
| Block not in inserter | Build failed or block.json invalid | Run `npm run build`, check JSON |
| GSAP not working | `frontend.js` not listed in `viewScript` | Add `"viewScript": "file:./frontend.js"` |
| Styles missing in editor | Wrong style file reference | Check if output is `style-index.css` or `style.css` |
