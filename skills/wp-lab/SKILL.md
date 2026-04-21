---
name: wp-lab
description: >
  Spin up ephemeral or continuous WordPress development environments instantly.
  Use this skill whenever the user wants to test a WordPress plugin, theme, or
  codebase without touching production. Triggers on: "spin up WordPress",
  "test this plugin", "wp-env", "wp-now", "ephemeral WordPress", "dev environment",
  "poke around this plugin's code", "WordPress playground", or any request to
  quickly run WordPress locally for development or exploration. Also triggers
  when the user wants to tear down or clean up WordPress dev environments.
owner: Ben
last_reviewed: 2026-04-21
---

# wp-lab

WordPress environment automation for instant local development.

## Two modes

### Ephemeral (wp-now)
- Starts in ~5 seconds, no Docker required
- Uses `@wp-now/wp-now` (PHP via native binary)
- Mount a single plugin or theme directory and go
- Ctrl+C and it's gone. Zero cleanup.
- **Use for:** quick code exploration, plugin testing, "what does this do?"

### Continuous (wp-env)
- Docker-backed, persistent volumes
- Config lives in `.wp-env.json` in the project directory
- Survives restarts, retains DB state, supports multi-plugin setups
- **Use for:** ongoing development, complex stacks, client site mirroring

## Prerequisites

Check before launching:
- **Ephemeral:** Node.js 18+ (no Docker needed)
- **Continuous:** Node.js 18+ AND Docker running

## Presets

Presets live in `presets/` as JSON files. Load with `--preset <name>`.

Each preset defines:
- `mode`: "ephemeral" or "continuous"
- `wp_version`: WordPress version (default: "latest")
- `php_version`: PHP version (default: "8.2")
- `plugins`: array of plugin sources (slug, URL, or local path)
- `themes`: array of theme sources
- `config`: wp-config.php constants to set
- `env_vars`: environment variables (for license keys, etc.)

### Available presets

| Preset | Mode | What's in it |
|--------|------|-------------|
| `clean` | ephemeral | Vanilla WordPress, zero plugins |
| `voyager-base` | continuous | ACF Pro, Rank Math, WP Rocket, Voyager starter theme |
| `gutenberg-dev` | continuous | Gutenberg trunk, test utils, Voyager Blocks |

## Slash commands

| Command | What it does |
|---------|-------------|
| `/wp-lab <target>` | Smart router. Detects mode from context or preset. |
| `/wp-ephemeral <target>` | Force ephemeral mode with wp-now |
| `/wp-dev <target or --preset>` | Force continuous mode with wp-env |
| `/wp-clean` | Tear down all running wp-env environments |

### Target formats

- **Plugin slug:** `developer-tools` (downloads from wordpress.org)
- **GitHub URL:** `https://github.com/user/repo` (clones the repo)
- **Local path:** `./my-plugin` or `/absolute/path` (mounts directly)
- **Preset:** `--preset voyager-base` (loads preset config)

## Scripts

The automation engine lives in `scripts/wp-lab.sh`. The slash commands invoke
this script with appropriate flags. You can also run it directly:

```bash
./scripts/wp-lab.sh --mode ephemeral --target developer-tools
./scripts/wp-lab.sh --mode continuous --preset voyager-base
./scripts/wp-lab.sh --clean
```

## Workflow

1. User invokes a slash command or describes what they want
2. Determine mode (ephemeral vs continuous) from command, preset, or context
3. Resolve target (download plugin, clone repo, or validate local path)
4. Generate config (.wp-env.json for continuous, directory mount for ephemeral)
5. Launch environment
6. Report the local URL and admin credentials
7. On teardown, clean up temp directories and stop containers

## Default credentials

- **URL:** http://localhost:8888 (wp-env) or http://localhost:8881 (wp-now)
- **Admin:** admin / password
- **wp-now note:** wp-now auto-logs you in as admin, no credentials needed

## Troubleshooting

- **Port conflict:** If 8888 is taken, wp-env uses the next available port. Check output.
- **Docker not running:** wp-env fails silently sometimes. Run `docker info` to verify.
- **wp-now crashes on Windows:** Known WSL2 issue with some versions. Use `--php=8.1` as workaround.
- **Plugin not found:** The wordpress.org API slug must match exactly. Check https://wordpress.org/plugins/<slug>/
