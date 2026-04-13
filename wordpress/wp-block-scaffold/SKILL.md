---
name: wp-block-scaffold
description: "Use this skill when the user asks to scaffold a block, create a new block, add a block, or generate block boilerplate for the Voyager Blocks plugin."
argument-hint: "<block-slug> [--no-gsap] [--dynamic]"
allowed-tools: [Read, Write, Edit, Glob, Grep, Bash]
user-invocable: true
---

# Scaffold a New Voyager Block

Create a complete block in the voyager-blocks plugin following the canonical patterns established by the existing blocks. The plugin root is defined in the project's CLAUDE.md — use `PLUGIN_ROOT` from that file.

## Process

### 1. Gather Requirements

Ask the user for (if not provided):
- **Block slug** (kebab-case, e.g. `progress-bar`)
- **Block title** (human-readable, e.g. "Progress Bar")
- **Description** (one sentence)
- **Uses GSAP?** (default: yes) — determines if frontend.js is needed
- **Static or Dynamic?** — static uses save.js, dynamic uses render.php
- **Custom attributes** — what data the block stores

### 2. Create Block Files

Create all files in `$PLUGIN_ROOT/src/blocks/{slug}/`:

#### block.json
```json
{
  "$schema": "https://schemas.wp.org/trunk/block.json",
  "apiVersion": 3,
  "name": "voyager/{slug}",
  "version": "1.0.0",
  "title": "{Title}",
  "category": "voyager",
  "icon": "{appropriate-dashicon}",
  "description": "{description}",
  "keywords": ["{keyword1}", "{keyword2}"],
  "textdomain": "voyager",
  "attributes": { /* user-defined */ },
  "supports": {
    "html": false,
    "align": true,
    "color": { "background": true, "text": true, "gradients": true },
    "spacing": { "padding": true, "margin": true },
    "typography": { "fontSize": true, "lineHeight": true }
  },
  "example": { "attributes": { /* sample values */ } },
  "editorScript": "file:./index.js",
  "editorStyle": "file:./index.css",
  "style": "file:./style-index.css",
  "viewScript": "file:./frontend.js"
}
```

#### index.js
```js
import { registerBlockType } from '@wordpress/blocks';
import './style.scss';
import Edit from './edit';
import save from './save';
import metadata from './block.json';

registerBlockType( metadata.name, { edit: Edit, save } );
```

#### edit.js
- Import `{ __ } from '@wordpress/i18n'`
- Import `{ useBlockProps, InspectorControls } from '@wordpress/block-editor'`
- Import `{ PanelBody, TextControl, RangeControl, ToggleControl } from '@wordpress/components'`
- Import `'./editor.scss'`
- Use textdomain `'voyager'` for all `__()` calls
- Include an `.editor-notice` div with preview guidance

#### save.js (static blocks)
- Import `{ useBlockProps } from '@wordpress/block-editor'`
- Use `useBlockProps.save({ className: 'wp-block-voyager-{slug}' })`
- Output semantic HTML with `data-*` attributes for frontend JS
- Include `aria-label` on interactive elements

#### frontend.js (if GSAP)
Follow the **exact** canonical pattern:
```js
function waitForGSAP( callback, attempts = 0 ) {
  if ( typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined' ) {
    window.gsap.registerPlugin( window.ScrollTrigger );
    callback();
  } else if ( attempts < 50 ) {
    setTimeout( () => waitForGSAP( callback, attempts + 1 ), 100 );
  }
}

function init{PascalName}() {
  const elements = document.querySelectorAll('.wp-block-voyager-{slug}');
  elements.forEach( ( el ) => {
    if ( el.hasAttribute( 'data-initialized' ) ) return;
    el.setAttribute( 'data-initialized', 'true' );

    if ( window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches ) {
      // Show final state immediately
      return;
    }

    // GSAP animation here
  });
}

if ( document.readyState === 'loading' ) {
  document.addEventListener( 'DOMContentLoaded', () => waitForGSAP( init{PascalName} ) );
} else {
  waitForGSAP( init{PascalName} );
}
```

#### editor.scss
```scss
.wp-block-voyager-{slug} {
  border: 2px dashed #e0e0e0;
  padding: 24px;
  border-radius: 4px;

  &:hover { border-color: #007cba; }

  .editor-notice {
    margin-top: 12px;
    padding: 8px 12px;
    background: #f0f0f0;
    border-radius: 3px;
    text-align: center;
    color: #757575;
  }
}
```

#### style.scss
```scss
.wp-block-voyager-{slug} {
  /* Use CSS custom properties for theme compatibility */
  /* Use clamp() for fluid sizing */
  /* Include responsive breakpoints */

  @media (prefers-reduced-motion: reduce) {
    /* Disable animations */
  }

  @media (prefers-contrast: more) {
    /* High contrast adjustments */
  }
}
```

### 3. Register Frontend Script

If the block uses frontend.js, remind the user to add TWO registrations:

**webpack.config.js** — add entry:
```js
'{slug}-frontend': path.resolve(process.cwd(), 'src', 'blocks', '{slug}', 'frontend.js'),
```

**voyager-blocks.php** — add to `$block_scripts` array (~line 162):
```php
array( 'voyager/{slug}', '{slug}-frontend', 'voyager-{slug}-frontend', array( 'gsap', 'gsap-scrolltrigger' ) ),
```

### 4. Build and Verify

Run `npm run build` from the plugin root and check for errors. Verify the block appears in `build/blocks/{slug}/`.

## Important Conventions

- **Namespace:** Always `voyager/{slug}`
- **CSS class:** Always `wp-block-voyager-{slug}`
- **Textdomain:** Always `'voyager'`
- **GSAP:** Use `window.gsap` (externalized, not imported)
- **Accessibility:** aria-label, prefers-reduced-motion, prefers-contrast
- **Category:** Always `'voyager'`
