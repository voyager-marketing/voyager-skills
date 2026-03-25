# /wp-lab

Smart WordPress environment launcher. Routes to ephemeral (wp-now) or continuous (wp-env) based on context.

## Your task

The user wants to spin up a WordPress development environment. Use $ARGUMENTS to determine:

1. **Target**: plugin slug, GitHub URL, local path, or preset name
2. **Mode**: ephemeral (quick, throwaway) or continuous (persistent, Docker)

### Mode detection logic

- If $ARGUMENTS contains `--preset` or a preset name: load the preset, use its mode
- If $ARGUMENTS contains `ephemeral`, `quick`, `test`, `poke`, `explore`: use ephemeral
- If $ARGUMENTS contains `dev`, `develop`, `continuous`, `project`, `ongoing`: use continuous
- If just a plugin slug with no other context: default to ephemeral
- If a `.wp-env.json` already exists in the current directory: use continuous

### Execution steps

1. Read the skill docs: `cat /path/to/voyager-skills/skills/wp-lab/SKILL.md`
2. Check prerequisites:
   - Run `node --version` (need 18+)
   - If continuous mode: run `docker info` to verify Docker is running
3. Resolve the target:
   - **Plugin slug:** `mkdir -p /tmp/wp-lab && curl -sL "https://api.wordpress.org/plugins/info/1.0/<slug>.json" | jq -r '.download_link'` then download and extract
   - **GitHub URL:** `git clone <url> /tmp/wp-lab/<repo-name>`
   - **Local path:** validate it exists, use directly
   - **Preset:** read the preset JSON from `skills/wp-lab/presets/<name>.json`
4. Launch:
   - **Ephemeral:** `cd <target-dir> && npx @wp-now/wp-now start`
   - **Continuous:** generate `.wp-env.json` from preset or target, then `npx @wordpress/env start`
5. Report:
   - Local URL and port
   - Admin credentials (admin/password for wp-env, auto-login for wp-now)
   - How to access WP-CLI (`npx wp-now wp <command>` or `npx wp-env run cli wp <command>`)
   - How to stop: Ctrl+C for ephemeral, `/wp-clean` for continuous

### Preset loading

When loading a preset, read the JSON and:
- Install each plugin from the `plugins` array (slug, URL, or path)
- Apply `config` constants to wp-config.php
- Set `env_vars` as environment variables before launch
- For plugins requiring license keys (ACF Pro, WP Rocket), check for env vars and warn if missing

### Error handling

- If Node.js < 18: tell the user to upgrade, suggest `nvm install 18`
- If Docker not running (continuous mode): offer to fall back to ephemeral
- If plugin slug not found on wordpress.org: suggest checking the slug and provide the URL format
- If port is in use: for wp-env, it auto-increments. For wp-now, suggest `--port=<alt>`
