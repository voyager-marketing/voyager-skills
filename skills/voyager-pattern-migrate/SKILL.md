---
name: voyager-pattern-migrate
description: "Migrate Claude Design pattern library bundles into the Voyager WordPress block theme and voyager-blocks plugin. Use whenever a Claude Design run (service template Runs 01-03, marketing site M01-M06, or future runs) is locked and ready to land as registered block patterns plus custom Gutenberg blocks. Produces PRs against voyager-block-theme (registered patterns + page templates) and voyager-blocks (custom blocks). Triggers on phrases like 'migrate the patterns', 'land run NN in the theme', 'ship the marketing site to WordPress', 'translate the Claude Design library', 'fire Mission 1', 'fire Mission 2'."
argument-hint: "[bundle URL or mission label]"
allowed-tools: [Bash, Read, Grep, Glob, Edit, Write, Agent, TodoWrite]
user-invocable: true
owner: Ben
last_reviewed: 2026-04-28
---

# voyager-pattern-migrate

Takes one or more Claude Design bundles (the .tar.gz archives produced by a run export) and lands them as production WordPress code across two repos.

## Inputs

1. **One or more bundle URLs.** Either share links from Claude Design exports or local .tar.gz paths.
2. **Mission label.** e.g. "Mission 1 (service template)", "Mission 2 (marketing site)", "smoke test (logo-bar)". Used in commit messages, branch names, and CHANGELOG entries.
3. **Mode.** Either `smoke-test` (single pattern, no PR, local wp-lab only) or `full-migration` (all patterns from the listed bundles, two PRs, full wp-lab validation).

## Modes

### Smoke test mode

Validates the skill against one stateless pattern before committing to a full mission. Use when the skill has not been fired against real bundles yet, or when the bundle source files have a structure the skill has not seen before. Smoke test:

- Migrates exactly one pattern, named explicitly by the caller
- Does not open PRs
- Runs through Phase 1 (inventory) and Phase 4 (registered patterns) only, plus a local wp-lab render
- Reports back with the generated PHP, the rendered output, and any friction surfaced

### Full migration mode

Walks all phases against all patterns in all listed bundles. Opens two PRs (one per repo). Reports PR URLs back.

## Target repos

- `voyager-marketing/voyager-block-theme` for registered patterns and page templates
- `voyager-marketing/voyager-blocks` for custom Gutenberg blocks

Both consume `@voyager-marketing/design-system` via npm. Tokens are not copied between repos. Sync tokens by bumping the dependency.

## Decision rule: registered pattern vs custom block

For each pattern in a bundle, decide:

- **Registered pattern** (lives in `voyager-block-theme/patterns/`): stateless layout that can be composed from core Gutenberg blocks (`core/group`, `core/columns`, `core/heading`, `core/paragraph`, `core/buttons`, `core/cover`, `core/separator`, `core/details`). Most patterns end up here.
- **Custom block** (lives in `voyager-blocks/src/blocks/`): requires JS state, dynamic data, conditional rendering based on attributes, custom inspector UI, or third-party integration. The test is "could a competent editor build this in the block inserter from core blocks alone?". If no, it is a custom block.

The categorization is decided in Phase 1 and confirmed before Phase 2 starts.

## Pre-migration cleanup

Before generating any PHP, the skill walks the bundle source files and applies three normalization passes. This is required because the runs were generated incrementally as the design system evolved.

### 1. v1 to v2 token rename pass

Bundles from Runs 01, 02, and M01 used v1 token names. Bundles from Run 03, M02, M03, M04, M05, M06 use v2 (or hybrid v1+v2). The full rename map lives at https://www.notion.so/34f47c03778b8131ab96c5d249fcaf44 and is reproduced in the Reference section below.

Apply the rename mechanically across all `*.jsx`, `*.css`, and `*.html` files in the bundle. Verify no v1 names remain before proceeding.

### 2. Off-spec hex swap

M02 and M03 introduced the inline values `#2EE6A4` (signal-ok green) and `#FF5A6E` (signal-down red) before the corresponding tokens existed. These literals appear in `outcome-metric-strip`, `cs-result-strip`, `service-process-strip` current-stage marker, and the M02 hero status indicator.

Swap to `var(--signal-ok)` and `var(--signal-down)` (and `-soft` variants where applicable). The tokens were added in design system v2.1.0; consuming repos should be on that version or later.

### 3. Container-wide retrofit

M01 and M02 used the older `--grid-max` (1280px) for content containers. The marketing site standard set in v2.1.0 is `--container-wide` (1440px). Swap references in M01 and M02 source files; M03 onward already uses `--container-wide`.

For each section in the bundle: wrap content in a `.container-wide` div (or whatever the block theme's wide-alignment convention is) and remove any hardcoded `max-width` literals that are not deliberate sub-container widths (e.g. measure-bound prose at ~75ch is intentional).

## Migration phases

Each phase has a checkpoint where the user confirms before the next phase starts.

### Phase 1: Inventory and plan

1. Download each bundle, unpack to `/tmp/voyager-migrate/{mission-label}/{bundle-name}/`.
2. For each bundle, walk the source files and produce a pattern manifest:
   - Pattern name
   - Source files (.jsx, .css, .html)
   - Data contract (extract from the file or from the run report)
   - Decision: registered or custom block, and rationale
   - Versioning impact: v1.0 (production), v0.1 gated (experimental)
   - Backend integration if applicable (WPForms shortcode, Google Calendar link, Bento connection)
3. Surface conflicts:
   - Pattern name collisions across runs (e.g. service template's `service-hero` vs marketing site's `service-detail-hero`)
   - Pattern supersessions (e.g. M04's `faq-block` supersedes service template Run 03's `service-faq`)
   - Backend integration choices not previously documented
4. Output the full manifest as a markdown table. Wait for user confirmation before Phase 2.

### Phase 2: Pre-migration cleanup

Run the three normalization passes described above (token rename, hex swap, container retrofit) against the unpacked source files. Verify by grep:

- No `--ink-`, `--bone-`, raw `--magenta-` (without the `--color-` prefix) names remain
- No `#2EE6A4` or `#FF5A6E` literals remain
- No bare `max-width: 1280px` or hardcoded equivalent remain

Output a summary of what was changed. Show the diff of one representative file (e.g. M01's `site.css`) so the user can verify the pass was correct.

### Phase 3: Custom blocks

For each custom block identified in Phase 1:

1. Create `voyager-blocks/src/blocks/{block-name}/block.json` with attributes mapped from the data contract.
2. For dynamic blocks: write `render.php` translating the bundle's pattern markup to PHP-templated output using `wp_get_attachment_image`, `esc_html`, `wp_kses_post`, etc.
3. For static blocks: write `edit.js` and `save.js`. The bundle's JSX is the starting point for `save.js`, lightly translated for `wp.element` and inner-blocks rules.
4. Wire CSS by importing design system tokens via `@import "@voyager-marketing/design-system/tokens.css"` and consuming via `var(--token)` directly.
5. For gated blocks (see Gating section below): set `"experimental": true` in `block.json` and add `"keywords": ["experimental", "voyager"]`.
6. For backend-integrated blocks (contact-form, newsletter signup): the block is typically a thin wrapper around a WPForms shortcode. Implementation pattern in the Backend Integration section.
7. Run `npm run build` and confirm compilation.
8. Register the block in `voyager-blocks.php`'s `register_block_type()` list.

### Phase 4: Registered patterns

For each registered pattern identified in Phase 1:

1. Create `voyager-block-theme/patterns/{pattern-name}.php`. The header block declares `Title`, `Slug`, `Categories`, `Keywords`, `Block Types`. File body is serialized Gutenberg block markup.
2. Translate the bundle's JSX to serialized block markup. Use the bundle's `data` constants as default content; structure block markup so editors can override per-instance.
3. For patterns that compose custom blocks: include `<!-- wp:voyager/{block-name} {...attributes} /-->` with attributes pulled from the data contract.
4. For patterns with multiple modes (e.g. service template's cadence_mode = campaign | ongoing | consultation): produce one pattern file per mode with the mode in the slug. Example: `service-process-campaign.php`, `service-process-ongoing.php`, `service-process-consultation.php`.
5. For gated patterns: add `Keywords: experimental, hidden` to the header. Gating is enforced at the inserter level by a filter in the theme's `functions.php` (see Gating section).
6. Wrap content in the wide-alignment container per the v2.1.0 standard.

### Phase 5: Composition templates

For each page type in the bundles, produce a `templates/page-{type}.html` file in voyager-block-theme. The template is a starter; editors can rearrange in Gutenberg.

Marketing site templates expected:
- `templates/page-home.html` (M02 composition order)
- `templates/page-services.html` (M05)
- `templates/page-service-detail.html` (M04 composition; used by all 5 service detail URLs)
- `templates/page-work.html` (M03 index)
- `templates/page-case-study.html` (M03 detail)
- `templates/page-about.html` (M06)
- `templates/page-contact.html` (M06)

Service template:
- `templates/page-service.html` (Run 03 AI Operations composition order; used as a fallback if a service does not have a marketing-site detail page yet)

### Phase 6: wp-lab staging

Use the `wp-lab` skill to spin up an ephemeral WordPress with both repos installed (voyager-block-theme as active theme, voyager-blocks as active plugin, design system as a theme dependency).

1. Confirm patterns appear in the inserter under "Voyager / Marketing" and "Voyager / Service".
2. Confirm gated patterns are hidden from the default inserter.
3. Insert each non-gated pattern into a test page; confirm it renders.
4. Confirm custom blocks render in the editor and on the front end.
5. Render every page template at desktop (1440px), tablet (768px), and mobile (375px). Visual eyeball against the Claude Design composition page.
6. If issues, iterate. If clean, proceed to Phase 7.

### Phase 7: Document and close

1. Open the PR against `voyager-block-theme`. Title format: `feat(theme): land {mission-label} patterns and templates`.
2. Open the PR against `voyager-blocks`. Title format: `feat(blocks): land {mission-label} custom blocks`.
3. Append to the design system repo's `CHANGELOG.md`: `## Migrations \n\n- **{mission-label}** migrated to voyager-block-theme #{PR} and voyager-blocks #{PR} on {DATE}.`
4. Update Notion run notes (https://www.notion.so/34f47c03778b8185a99ecbee188ce0ab) Migration column for each run included in the mission.
5. Report PR URLs back to the user. Do not auto-merge.

## Gating

Three patterns currently ship gated (as of M06):
- `service-stages` (Run 03 draft, AI Operations only consumer)
- `service-engagement-models` (Run 03 draft, AI Operations only consumer)
- `live-ops-panel` (M02, homepage hero only consumer)

When a future run consumes a gated pattern (second use), the skill removes the gating during that run's migration and promotes to v1.0.

### Implementation for registered patterns

In the pattern file's header:

```php
<?php
/**
 * Title: Service Stages
 * Slug: voyager/service-stages
 * Categories: voyager-experimental
 * Keywords: voyager, service, experimental, hidden
 * Block Types: core/post-content
 */
?>
```

In the theme's `functions.php`, register the experimental category and filter the inserter:

```php
add_action( 'init', function () {
    register_block_pattern_category( 'voyager-experimental', [
        'label' => __( 'Voyager (experimental)', 'voyager' ),
    ] );
} );

add_filter( 'should_load_block_pattern', function ( $should_load, $pattern ) {
    if ( in_array( 'voyager-experimental', $pattern['categories'] ?? [], true ) ) {
        // Hide from inserter unless query param or capability allows.
        if ( isset( $_GET['show_experimental'] ) ) {
            return $should_load;
        }
        if ( current_user_can( 'manage_options' ) && get_user_meta( get_current_user_id(), 'voyager_show_experimental', true ) ) {
            return $should_load;
        }
        return false;
    }
    return $should_load;
}, 10, 2 );
```

### Implementation for custom blocks

In `block.json`:

```json
{
  "$schema": "https://schemas.wp.org/trunk/block.json",
  "apiVersion": 3,
  "name": "voyager/live-ops-panel",
  "title": "Live Ops Panel",
  "category": "voyager-experimental",
  "experimental": true,
  "keywords": ["experimental", "voyager"],
  ...
}
```

The category and `experimental: true` flag together hide the block from the default inserter.

### Documentation

Maintain an `EXPERIMENTAL.md` file in the theme root listing every gated pattern, its source run, and the conditions under which it should be promoted.

## Backend integration

Three integrations are decided as of session end:

### Forms (contact-form, newsletter)

- **Plugin**: WPForms Pro
- **Pattern**: registered pattern wrapping a WPForms shortcode (not a custom block)
- **Implementation**: the pattern file inserts `<!-- wp:shortcode -->[wpforms id="123"]<!-- /wp:shortcode -->` with the form ID matched per surface
- **Newsletter to Bento**: connection lives in WPForms Pro's Bento addon settings, not in the pattern markup

This simplifies the migration. The `contact-form` and any newsletter form move from custom blocks (originally planned) to registered patterns. The block plugin does not implement form submission.

### Calendar booking

- **Service**: Google Calendar appointment scheduling URL (per-account, set up in Google Calendar)
- **Pattern**: registered pattern (`booking-cta`) with `url` and `label` data fields, or inlined as part of `contact-methods-list`
- **No iframe embed**: the calendar slot links out to the appointment scheduling URL rather than embedding

### Newsletter signup

- **Service**: Bento, connected via WPForms Pro's Bento integration
- **Pattern**: WPForms shortcode wrapped in a registered pattern, same as contact-form
- **No standalone newsletter-form block**: drop this from the pattern manifest

Document any new backend integrations the user adds in `voyager-block-theme/INTEGRATIONS.md`.

## Drafts and v1.0 promotion at migration

Default rule: if a pattern is at v0.1 in its source run report and a downstream run did not promote it, **WordPress production deployment is the second use that earns v1.0 promotion**, unless the pattern has only one design surface and a clear possibility of evolving (the gated patterns above).

Practical effect: most v0.1 patterns ship as v1.0 at migration. Only the three gated patterns above stay v0.1.

When the skill promotes a v0.1 pattern to v1.0 at migration, note this in the run notes: "Pattern X promoted v0.1 to v1.0 at migration (production deployment is second use)."

## Acceptance criteria template

Use this template for the PR description on each repo:

```
## Acceptance criteria

- [ ] All patterns from {mission-label} bundles render correctly in wp-lab at desktop, tablet, mobile
- [ ] All gated patterns are hidden from the default inserter (verified by inserting from a non-admin user account)
- [ ] All page templates ({list templates}) render with chrome wrapping content
- [ ] Design system v{NN} consumed via npm; no inline tokens or off-spec hex literals
- [ ] CHANGELOG entry appended to voyager-design-system
- [ ] Notion run notes Migration column updated for runs: {list runs}
- [ ] Visual eyeball against Claude Design composition pages: matches at the section level

## Patterns shipped (v1.0)

{list}

## Patterns shipped (gated, v0.1 experimental)

{list with rationale}

## Patterns superseded

{list of older patterns superseded by newer ones, e.g. service-faq superseded by faq-block}
```

## Failure modes

- **Bundle fetch fails or returns unexpected structure.** Stop and surface the bundle URL and the error. Do not improvise. The bundle structure may have changed (the run formats have shifted across runs); fixing this at the skill level is preferable to working around it.
- **Pattern source uses React state or hooks that do not translate cleanly to serialized blocks.** This is a custom-block signal. Reclassify and proceed with Phase 3 logic for that pattern.
- **A pattern references a token the design system does not have yet.** Should be rare given the v2.1.0 backfill. If it happens: do not block migration. Land the pattern using the closest available token. Open a separate issue against the design system repo. The next minor release closes the gap.
- **Two consecutive runs propose conflicting attribute extensions to the same pattern.** Land both in the same PR if processing both runs together; otherwise the later migration handles the merge.
- **wp-lab staging fails to render a pattern.** Capture the error, surface it, do not work around it. Common causes: missing custom block (Phase 3 not run yet for this pattern), missing token in design system version installed (bump the npm dependency), or template scope issue (pattern marked for `core/post-content` but rendered outside that context).
- **Backend integration is unclear.** If the user has not specified WPForms form IDs, calendar URL, or Bento configuration, surface the gap in Phase 1 inventory; do not guess.

## Reference: v1 to v2 token rename map

### Semantic names (the table that matters most)

| v1 name | v2 name | What it is |
|---|---|---|
| `--ink-000` | `--bg-canvas` | Canvas base / deepest surface |
| `--ink-050` | `--bg-panel` | Panel base |
| `--ink-100` | `--bg-raised` | Raised panel |
| `--ink-200` | `--bg-inset` | Inset / divider background |
| `--ink-300` | `--border-hair` | Hairline divider on dark |
| `--ink-400` | `--border-1` | Strong divider on dark |
| `--bone-000` | `--fg-1` | High-emphasis text |
| `--bone-100` | `--fg-2` | Default body text |
| `--bone-200` | `--fg-3` | Secondary text |
| `--bone-300` | `--fg-4` | Muted / metadata |
| `--bone-400` | `--fg-5` | Disabled / tertiary |
| `--magenta-500` | `--accent` | Primary brand accent |
| `--magenta-600` | `--accent-strong` | Hover / pressed |
| `--magenta-400` | `--accent-bright` | Bright variant for data pips, icons on dark |

### Primitive names (if any code reaches for the raw scale)

v2 prefixed all primitives with `--color-` and renamed `ink → indigo` with the standard 50-950 scale (950 = darkest, opposite of v1's 000 = darkest).

| v1 name | v2 name |
|---|---|
| `--ink-000` | `--color-indigo-950` |
| `--ink-050` | `--color-indigo-900` |
| `--ink-100` | `--color-indigo-800` |
| `--ink-200` | `--color-indigo-700` |
| `--ink-300` | `--color-indigo-600` |
| `--ink-400` | `--color-indigo-500` |
| `--bone-000` | `--color-bone-50` |
| `--bone-100` | `--color-bone-100` |
| `--bone-200` | `--color-bone-200` |
| `--bone-300` | `--color-bone-300` |
| `--bone-400` | `--color-bone-400` |
| `--magenta-{step}` | `--color-magenta-{step}` (just `--color-` prefixed) |
| `--violet-*`, `--cyan-*`, `--amber-*`, `--green-*`, `--red-*` | Same convention: prefix with `--color-` |

### Off-spec hex swap

| v1 inline literal | v2 token |
|---|---|
| `#2EE6A4` | `var(--signal-ok)` |
| `rgba(46, 230, 164, 0.18)` | `var(--signal-ok-soft)` |
| `#FF5A6E` | `var(--signal-down)` |
| `rgba(255, 90, 110, 0.16)` | `var(--signal-down-soft)` |

## Important non-goals

- **Do not** rebuild design system tokens in either repo. Sync via npm dependency bump.
- **Do not** invent content not in the bundle. The bundle's data contract is the source of truth for default content.
- **Do not** auto-merge PRs. Human review on every migration.
- **Do not** migrate a Claude Design library that is unstable or mid-iteration. Confirm with the user that the run is locked before starting.
- **Do not** modify the design system repo as part of a migration except for the CHANGELOG migration entry. Token gaps are addressed in a separate design system release, not inline during migration.
