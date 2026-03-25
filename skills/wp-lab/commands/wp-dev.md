# /wp-dev

Continuous WordPress development environment using wp-env. Docker required.

## Your task

Start or resume a persistent WordPress dev environment. $ARGUMENTS is a preset name, plugin/theme path, or project directory.

### Steps

1. Verify prerequisites: Node.js 18+ and Docker running
2. Determine config source:
   - If `--preset <name>` in $ARGUMENTS: load from `skills/wp-lab/presets/<name>.json`
   - If `.wp-env.json` exists in current directory: use it
   - If a path is given: create a `.wp-env.json` that maps it as a plugin or theme
   - No arguments: create a minimal `.wp-env.json` with just WordPress
3. If using a preset:
   - Read the preset JSON
   - Generate `.wp-env.json` with the correct structure:
     ```json
     {
       "core": "WordPress/WordPress#<wp_version>",
       "phpVersion": "<php_version>",
       "plugins": ["<slug-or-path>", ...],
       "themes": ["<slug-or-path>", ...],
       "config": { ... },
       "lifecycleScripts": {
         "afterStart": "wp plugin activate --all"
       }
     }
     ```
   - Check for required env vars (license keys) and warn if missing
4. Launch: `npx @wordpress/env start`
5. Report:
   - URL: http://localhost:8888 (or whatever port wp-env chose)
   - Admin: admin / password
   - WP-CLI: `npx wp-env run cli wp <command>`
   - Stop: `npx wp-env stop` (preserves state) or `/wp-clean` (destroys)
   - Restart: `npx wp-env start` (instant, reuses existing containers)

### Preset-specific notes

**voyager-base:** Requires `ACF_PRO_KEY` and `WP_ROCKET_KEY` env vars for premium plugin downloads. If missing, skip those plugins and warn.

**gutenberg-dev:** Clones Gutenberg from GitHub trunk. First start takes longer due to build step.
