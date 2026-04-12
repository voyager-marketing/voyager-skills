---
name: wp-interactivity
description: "Use when building or debugging WordPress Interactivity API features — data-wp-* directives, @wordpress/interactivity stores, viewScriptModule, server-side rendering, and hydration in Voyager blocks."
compatibility: "WordPress 6.5+ (Interactivity API stable), @wordpress/scripts 27+."
---

# WordPress Interactivity API

## When to Use

- Adding client-side interactivity to a block without vanilla JS/GSAP
- Using `data-wp-interactive`, `data-wp-on--*`, `data-wp-bind--*`, `data-wp-context`
- Setting up `viewScriptModule` (ES module frontend scripts)
- Debugging "directives don't fire" or hydration mismatches
- Converting a `frontend.js` (vanilla) block to Interactivity API

## Context: Voyager Blocks Today

Most Voyager blocks use `viewScript` + vanilla `frontend.js` with GSAP. The Interactivity API is appropriate for:
- Blocks with state-driven UI (toggles, tabs, accordions, filters)
- Blocks that benefit from server-side directive processing
- New blocks where GSAP is not needed

For GSAP-animated blocks, continue using `viewScript` + `frontend.js`.

## Core Concepts

### Store (State + Actions)

```js
// view.js (module)
import { store, getContext } from '@wordpress/interactivity';

store('voyager/block-slug', {
  state: {
    isOpen: false,
    get toggleLabel() {
      return this.isOpen ? 'Close' : 'Open';
    },
  },
  actions: {
    toggle() {
      const ctx = getContext();
      ctx.isOpen = !ctx.isOpen;
    },
  },
});
```

### Directives in Markup

Applied in save output (static blocks) or `render.php` (dynamic blocks):

```html
<div
  data-wp-interactive="voyager/block-slug"
  data-wp-context='{"isOpen": false}'
>
  <button data-wp-on--click="actions.toggle">
    <span data-wp-text="state.toggleLabel">Open</span>
  </button>
  <div data-wp-bind--hidden="!context.isOpen">
    Content here
  </div>
</div>
```

### Common Directives

| Directive | Purpose |
|-----------|---------|
| `data-wp-interactive` | Declares interactive region + store namespace |
| `data-wp-context` | Server-rendered local state (JSON) |
| `data-wp-on--{event}` | Event handler (e.g., `click`, `input`) |
| `data-wp-on-async--{event}` | Async event handler (preferred for most actions) |
| `data-wp-bind--{attr}` | Bind DOM attribute to state |
| `data-wp-class--{name}` | Toggle CSS class based on state |
| `data-wp-text` | Set text content from state |
| `data-wp-bind--hidden` | Show/hide based on state |

## block.json Setup

```json
{
  "supports": {
    "interactivity": true
  },
  "viewScriptModule": "file:./view.js"
}
```

- Use `viewScriptModule` (not `viewScript`) for Interactivity API blocks
- The module file is typically named `view.js` by convention
- `supports.interactivity: true` enables server directive processing

## Server-Side Rendering

### Initialize State in PHP

For dynamic blocks with `render.php`:

```php
wp_interactivity_state('voyager/block-slug', [
  'items' => ['Apple', 'Banana'],
  'hasItems' => true,
]);
```

### Local Context in PHP

```php
$context = ['isOpen' => false];
?>
<div <?php echo wp_interactivity_data_wp_context($context); ?>>
```

### Derived State in PHP

When derived state affects initial render:

```php
wp_interactivity_state('voyager/block-slug', [
  'items' => ['Apple', 'Banana'],
  'hasItems' => function() {
    $state = wp_interactivity_state();
    return count($state['items']) > 0;
  },
]);
```

## Converting a Voyager Block

To convert an existing `frontend.js` block to Interactivity API:

1. Add `"supports": { "interactivity": true }` to block.json
2. Replace `"viewScript"` with `"viewScriptModule": "file:./view.js"`
3. Create `view.js` with store definition
4. Update `save.js` to output `data-wp-*` directives
5. Add deprecation for old save markup
6. Remove `frontend.js` (or keep for GSAP portions)
7. Build and test hydration

## Unique Directive IDs (WordPress 6.9+)

Multiple handlers of the same type on one element:

```html
<button
  data-wp-on--click---handler-a="actions.handleA"
  data-wp-on--click---handler-b="actions.handleB"
>
```

## Debugging

| Symptom | Cause | Fix |
|---------|-------|-----|
| Directives inert | `viewScriptModule` not loading | Check block.json path, run build |
| Directives inert | Missing `data-wp-interactive` on ancestor | Add to wrapper element |
| Namespace mismatch | Store name != directive namespace | Align `store('ns')` with `data-wp-interactive="ns"` |
| Hydration flicker | Server HTML differs from client expectation | Initialize state in PHP with `wp_interactivity_state()` |
| Hidden attr wrong on load | Derived state not defined server-side | Add PHP closure for derived state |
| `data-wp-ignore` errors | Deprecated in WP 6.9 | Remove usage entirely |

## Verification

- [ ] `data-wp-interactive` present on wrapper in rendered HTML
- [ ] Store namespace matches directive namespace exactly
- [ ] `viewScriptModule` loads in browser network tab
- [ ] Interactions work without JS errors in console
- [ ] Server-rendered HTML matches expected initial state
- [ ] No layout shift on hydration
- [ ] `npm run build` passes
