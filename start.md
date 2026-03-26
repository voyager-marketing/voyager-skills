# Build: voyager-skills repo with wp-lab as first skill

## What this is

Build a complete repo called `voyager-skills` that houses reusable agentic skills for a WordPress agency. The first skill is `wp-lab` -- a WordPress environment automation tool for spinning up ephemeral and continuous dev environments instantly.

This repo will be open-sourced. Agency-specific presets go in the skill, generic examples go in `examples/`.

## Repo structure

Create this exact tree:

```
voyager-skills/
├── README.md
├── LICENSE                        # MIT
├── install.sh                     # Symlinks commands into ~/.claude/commands/
├── skills/
│   └── wp-lab/
│       ├── SKILL.md
│       ├── commands/
│       │   ├── wp-lab.md          # Main slash command (router)
│       │   ├── wp-ephemeral.md    # Quick ephemeral shortcut
│       │   ├── wp-dev.md          # Continuous dev shortcut
│       │   └── wp-clean.md        # Teardown command
│       ├── presets/
│       │   ├── voyager-base.json
│       │   ├── gutenberg-dev.json
│       │   └── clean.json
│       └── scripts/
│           └── wp-lab.sh          # Core automation engine
├── examples/
│   └── wp-lab/
│       ├── presets/
│       │   ├── starter-agency.json
│       │   └── clean.json
│       └── README.md
└── .claude/
    └── commands/
        └── new-skill.md           # Meta: scaffold a new skill in this repo
```

---

## File contents

### README.md

```markdown
# Voyager Skills

Reusable agentic skills for WordPress agency operations. Built for [Claude Code](https://docs.anthropic.com/en/docs/claude-code) slash commands.

## What's a skill?

A skill is a packaged set of instructions, scripts, and presets that Claude Code can execute via slash commands. Think of them as reusable playbooks.

## Available Skills

| Skill | Description |
|-------|-------------|
| [wp-lab](skills/wp-lab/) | Spin up ephemeral or continuous WordPress dev environments instantly |

## Installation

Clone the repo and run the install script to symlink commands globally:

```bash
git clone https://github.com/voyager-marketing/voyager-skills.git
cd voyager-skills
chmod +x install.sh
./install.sh
```

This creates symlinks in `~/.claude/commands/` so slash commands are available in every project.

### Per-project installation

If you only want skills available in a specific project, symlink the commands directory:

```bash
ln -s /path/to/voyager-skills/skills/wp-lab/commands/*.md /your/project/.claude/commands/
```

## Creating a new skill

Use the meta command from within this repo:

```
/new-skill
```

## License

MIT
```

---

### LICENSE

Standard MIT license. Author: Voyager Marketing.

---

### install.sh

```bash
#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_DIR="$HOME/.claude/commands"

mkdir -p "$TARGET_DIR"

count=0
for skill_dir in "$SCRIPT_DIR"/skills/*/commands; do
  if [ -d "$skill_dir" ]; then
    for cmd_file in "$skill_dir"/*.md; do
      if [ -f "$cmd_file" ]; then
        filename=$(basename "$cmd_file")
        ln -sf "$cmd_file" "$TARGET_DIR/$filename"
        echo "  Linked: $filename"
        ((count++))
      fi
    done
  fi
done

echo ""
echo "Installed $count commands to $TARGET_DIR"
echo "Restart Claude Code to pick up new commands."
```

---

### skills/wp-lab/SKILL.md

```markdown
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
```

---

### skills/wp-lab/commands/wp-lab.md

```markdown
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
```

---

### skills/wp-lab/commands/wp-ephemeral.md

```markdown
# /wp-ephemeral

Quick ephemeral WordPress environment using wp-now. No Docker needed.

## Your task

Spin up a throwaway WordPress instance. $ARGUMENTS is a plugin slug, GitHub URL, or local path.

### Steps

1. Verify Node.js 18+ is installed
2. Resolve target from $ARGUMENTS:
   - Plugin slug: download from wordpress.org API
   - GitHub URL: shallow clone (`git clone --depth 1`)
   - Local path: validate and use directly
   - No arguments: start a clean WordPress instance in a temp directory
3. Create temp working directory: `mkdir -p /tmp/wp-lab/ephemeral-$(date +%s)`
4. If plugin/theme was downloaded, extract into the temp directory
5. Launch: `cd <dir> && npx @wp-now/wp-now start`
6. Tell the user:
   - The URL (usually http://localhost:8881)
   - wp-now auto-logs in as admin
   - WP-CLI: `npx wp-now wp plugin list`, `npx wp-now wp theme list`, etc.
   - Ctrl+C to kill it. The temp directory can be deleted or left to rot.

### If something goes wrong

- Port in use: `npx @wp-now/wp-now start --port=8882`
- PHP errors: try `--php=8.1` flag
- Plugin slug 404: verify at https://wordpress.org/plugins/
```

---

### skills/wp-lab/commands/wp-dev.md

```markdown
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
```

---

### skills/wp-lab/commands/wp-clean.md

```markdown
# /wp-clean

Tear down WordPress development environments.

## Your task

Clean up running wp-env and wp-now instances and their temp files.

### Steps

1. Stop and destroy wp-env if running:
   ```bash
   npx @wordpress/env stop 2>/dev/null
   npx @wordpress/env destroy --force 2>/dev/null
   ```
2. Kill any running wp-now processes:
   ```bash
   pkill -f "wp-now" 2>/dev/null || true
   ```
3. Clean temp directories:
   ```bash
   rm -rf /tmp/wp-lab/ephemeral-*
   ```
4. Report what was cleaned up
5. Do NOT delete:
   - Any `.wp-env.json` files (those are project config)
   - Anything outside `/tmp/wp-lab/`
   - Any named/persistent wp-env projects the user might want to keep

### If $ARGUMENTS contains a specific target

Only clean that specific environment, not everything. For example:
- `/wp-clean ephemeral` -- only clean ephemeral temp dirs and wp-now processes
- `/wp-clean continuous` -- only stop/destroy wp-env
```

---

### skills/wp-lab/presets/clean.json

```json
{
  "name": "clean",
  "description": "Vanilla WordPress with no plugins or customizations",
  "mode": "ephemeral",
  "wp_version": "latest",
  "php_version": "8.2",
  "plugins": [],
  "themes": [],
  "config": {
    "WP_DEBUG": true,
    "WP_DEBUG_LOG": true,
    "SCRIPT_DEBUG": true
  },
  "env_vars": {}
}
```

---

### skills/wp-lab/presets/voyager-base.json

```json
{
  "name": "voyager-base",
  "description": "Standard Voyager agency client stack",
  "mode": "continuous",
  "wp_version": "latest",
  "php_version": "8.2",
  "plugins": [
    {
      "source": "acf-pro",
      "type": "url",
      "url": "https://connect.advancedcustomfields.com/v2/plugins/download?p=pro&k=${ACF_PRO_KEY}",
      "requires_env": "ACF_PRO_KEY",
      "note": "ACF Pro requires a license key in ACF_PRO_KEY env var"
    },
    {
      "source": "wordpress-seo",
      "type": "slug",
      "note": "Rank Math alternative: use 'seo-by-rank-math' slug instead"
    },
    {
      "source": "seo-by-rank-math",
      "type": "slug"
    },
    {
      "source": "wp-rocket",
      "type": "local",
      "path": "",
      "requires_env": "WP_ROCKET_KEY",
      "note": "WP Rocket cannot be downloaded via API. Place the zip manually or skip."
    },
    {
      "source": "safe-svg",
      "type": "slug"
    },
    {
      "source": "redirection",
      "type": "slug"
    }
  ],
  "themes": [
    {
      "source": "voyager-starter",
      "type": "local",
      "path": "",
      "note": "Set path to your local voyager-starter theme directory"
    }
  ],
  "config": {
    "WP_DEBUG": true,
    "WP_DEBUG_LOG": true,
    "SCRIPT_DEBUG": true,
    "WP_ENVIRONMENT_TYPE": "development",
    "DISALLOW_FILE_EDIT": true
  },
  "env_vars": {
    "ACF_PRO_KEY": "${ACF_PRO_KEY}",
    "WP_ROCKET_KEY": "${WP_ROCKET_KEY}"
  }
}
```

---

### skills/wp-lab/presets/gutenberg-dev.json

```json
{
  "name": "gutenberg-dev",
  "description": "Gutenberg block development environment with Voyager Blocks",
  "mode": "continuous",
  "wp_version": "latest",
  "php_version": "8.2",
  "plugins": [
    {
      "source": "gutenberg",
      "type": "github",
      "url": "https://github.com/WordPress/gutenberg",
      "note": "Clones Gutenberg trunk. First start builds from source -- takes a few minutes."
    },
    {
      "source": "acf-pro",
      "type": "url",
      "url": "https://connect.advancedcustomfields.com/v2/plugins/download?p=pro&k=${ACF_PRO_KEY}",
      "requires_env": "ACF_PRO_KEY"
    },
    {
      "source": "voyager-blocks",
      "type": "local",
      "path": "",
      "note": "Set path to your local voyager-blocks plugin directory"
    }
  ],
  "themes": [
    {
      "source": "twentytwentyfive",
      "type": "slug"
    }
  ],
  "config": {
    "WP_DEBUG": true,
    "WP_DEBUG_LOG": true,
    "SCRIPT_DEBUG": true,
    "GUTENBERG_DEVELOPMENT_MODE": true,
    "WP_ENVIRONMENT_TYPE": "development"
  },
  "env_vars": {
    "ACF_PRO_KEY": "${ACF_PRO_KEY}"
  }
}
```

---

### skills/wp-lab/scripts/wp-lab.sh

```bash
#!/usr/bin/env bash
#
# wp-lab.sh - WordPress environment automation engine
#
# Usage:
#   wp-lab.sh --mode <ephemeral|continuous> --target <slug|url|path>
#   wp-lab.sh --mode <ephemeral|continuous> --preset <preset-name>
#   wp-lab.sh --clean [ephemeral|continuous]
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(dirname "$SCRIPT_DIR")"
PRESETS_DIR="$SKILL_DIR/presets"
TMP_DIR="/tmp/wp-lab"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info()  { echo -e "${BLUE}[wp-lab]${NC} $1"; }
log_ok()    { echo -e "${GREEN}[wp-lab]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[wp-lab]${NC} $1"; }
log_error() { echo -e "${RED}[wp-lab]${NC} $1"; }

# Defaults
MODE=""
TARGET=""
PRESET=""
CLEAN=false
PORT_EPHEMERAL=8881
PORT_CONTINUOUS=8888

usage() {
  cat <<EOF
wp-lab - WordPress environment automation

Usage:
  wp-lab.sh --mode ephemeral --target <plugin-slug>
  wp-lab.sh --mode ephemeral --target <github-url>
  wp-lab.sh --mode ephemeral --target <local-path>
  wp-lab.sh --mode continuous --preset <preset-name>
  wp-lab.sh --clean [ephemeral|continuous]

Options:
  --mode      ephemeral (wp-now) or continuous (wp-env)
  --target    Plugin slug, GitHub URL, or local path
  --preset    Load a preset config (clean, voyager-base, gutenberg-dev)
  --port      Override the default port
  --clean     Tear down environments

Presets available:
$(ls "$PRESETS_DIR"/*.json 2>/dev/null | xargs -I{} basename {} .json | sed 's/^/  - /')
EOF
}

check_node() {
  if ! command -v node &>/dev/null; then
    log_error "Node.js is required. Install via nvm: nvm install 18"
    exit 1
  fi
  local node_major
  node_major=$(node -v | sed 's/v//' | cut -d. -f1)
  if [ "$node_major" -lt 18 ]; then
    log_error "Node.js 18+ required. Current: $(node -v). Run: nvm install 18"
    exit 1
  fi
  log_ok "Node.js $(node -v) detected"
}

check_docker() {
  if ! docker info &>/dev/null 2>&1; then
    log_error "Docker is not running. Start Docker Desktop or run: sudo systemctl start docker"
    log_warn "Tip: fall back to ephemeral mode (wp-now) which doesn't need Docker"
    exit 1
  fi
  log_ok "Docker is running"
}

resolve_plugin_slug() {
  local slug="$1"
  local dest="$TMP_DIR/plugins/$slug"

  if [ -d "$dest" ]; then
    log_info "Plugin $slug already downloaded, reusing"
    echo "$dest"
    return
  fi

  log_info "Fetching plugin info for '$slug' from wordpress.org..."
  local info
  info=$(curl -sL "https://api.wordpress.org/plugins/info/1.0/$slug.json")

  local download_link
  download_link=$(echo "$info" | grep -o '"download_link":"[^"]*"' | head -1 | cut -d'"' -f4)

  if [ -z "$download_link" ] || [ "$download_link" = "null" ]; then
    log_error "Plugin '$slug' not found on wordpress.org"
    log_info "Verify at: https://wordpress.org/plugins/$slug/"
    exit 1
  fi

  mkdir -p "$TMP_DIR/plugins"
  log_info "Downloading $slug..."
  curl -sL "$download_link" -o "$TMP_DIR/plugins/$slug.zip"
  unzip -q "$TMP_DIR/plugins/$slug.zip" -d "$TMP_DIR/plugins/"
  rm "$TMP_DIR/plugins/$slug.zip"

  log_ok "Plugin $slug downloaded to $dest"
  echo "$dest"
}

resolve_github_url() {
  local url="$1"
  local repo_name
  repo_name=$(basename "$url" .git)
  local dest="$TMP_DIR/repos/$repo_name"

  if [ -d "$dest" ]; then
    log_info "Repo $repo_name already cloned, pulling latest..."
    cd "$dest" && git pull --quiet
    echo "$dest"
    return
  fi

  mkdir -p "$TMP_DIR/repos"
  log_info "Cloning $url (shallow)..."
  git clone --depth 1 "$url" "$dest"
  log_ok "Cloned to $dest"
  echo "$dest"
}

resolve_target() {
  local target="$1"

  # Local path
  if [ -d "$target" ]; then
    log_ok "Using local path: $target"
    echo "$(cd "$target" && pwd)"
    return
  fi

  # GitHub URL
  if [[ "$target" == https://github.com/* ]] || [[ "$target" == git@github.com:* ]]; then
    resolve_github_url "$target"
    return
  fi

  # WordPress.org plugin slug (alphanumeric + hyphens)
  if [[ "$target" =~ ^[a-z0-9-]+$ ]]; then
    resolve_plugin_slug "$target"
    return
  fi

  log_error "Cannot resolve target: $target"
  log_info "Expected: plugin slug, GitHub URL, or local directory path"
  exit 1
}

load_preset() {
  local preset_name="$1"
  local preset_file="$PRESETS_DIR/$preset_name.json"

  if [ ! -f "$preset_file" ]; then
    log_error "Preset '$preset_name' not found"
    log_info "Available presets:"
    ls "$PRESETS_DIR"/*.json 2>/dev/null | xargs -I{} basename {} .json | sed 's/^/  - /'
    exit 1
  fi

  log_ok "Loading preset: $preset_name"
  cat "$preset_file"
}

run_ephemeral() {
  local target_dir="$1"
  log_info "Starting ephemeral environment (wp-now)..."
  log_info "Directory: $target_dir"
  log_info ""
  log_ok "=================================="
  log_ok "  WordPress (ephemeral) launching"
  log_ok "  URL: http://localhost:$PORT_EPHEMERAL"
  log_ok "  Admin: auto-login (no creds needed)"
  log_ok "  WP-CLI: npx wp-now wp <command>"
  log_ok "  Stop: Ctrl+C"
  log_ok "=================================="
  log_info ""

  cd "$target_dir"
  npx @wp-now/wp-now start --port="$PORT_EPHEMERAL"
}

run_continuous() {
  local config_dir="$1"
  log_info "Starting continuous environment (wp-env)..."
  log_info "Config: $config_dir/.wp-env.json"
  log_info ""
  log_ok "=================================="
  log_ok "  WordPress (continuous) launching"
  log_ok "  URL: http://localhost:$PORT_CONTINUOUS"
  log_ok "  Admin: admin / password"
  log_ok "  WP-CLI: npx wp-env run cli wp <command>"
  log_ok "  Stop: npx wp-env stop"
  log_ok "  Destroy: /wp-clean continuous"
  log_ok "=================================="
  log_info ""

  cd "$config_dir"
  npx @wordpress/env start
}

do_clean() {
  local scope="${1:-all}"

  if [ "$scope" = "all" ] || [ "$scope" = "continuous" ]; then
    log_info "Stopping wp-env..."
    npx @wordpress/env stop 2>/dev/null || true
    npx @wordpress/env destroy --force 2>/dev/null || true
    log_ok "wp-env stopped and destroyed"
  fi

  if [ "$scope" = "all" ] || [ "$scope" = "ephemeral" ]; then
    log_info "Killing wp-now processes..."
    pkill -f "wp-now" 2>/dev/null || true
    log_info "Cleaning temp directories..."
    rm -rf "$TMP_DIR/ephemeral-"* 2>/dev/null || true
    log_ok "Ephemeral environments cleaned"
  fi

  log_ok "Cleanup complete"
}

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --mode)    MODE="$2"; shift 2 ;;
    --target)  TARGET="$2"; shift 2 ;;
    --preset)  PRESET="$2"; shift 2 ;;
    --port)    PORT_EPHEMERAL="$2"; PORT_CONTINUOUS="$2"; shift 2 ;;
    --clean)   CLEAN=true; shift; [ "${1:-}" ] && { TARGET="$1"; shift; } ;;
    -h|--help) usage; exit 0 ;;
    *)         log_error "Unknown option: $1"; usage; exit 1 ;;
  esac
done

# Route
if [ "$CLEAN" = true ]; then
  do_clean "${TARGET:-all}"
  exit 0
fi

if [ -z "$MODE" ] && [ -z "$PRESET" ]; then
  log_error "Specify --mode or --preset"
  usage
  exit 1
fi

# Check prerequisites
check_node

# If preset, load it and extract mode
if [ -n "$PRESET" ]; then
  preset_json=$(load_preset "$PRESET")
  if [ -z "$MODE" ]; then
    MODE=$(echo "$preset_json" | grep -o '"mode"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | cut -d'"' -f4)
  fi
fi

# Mode-specific prereq check
if [ "$MODE" = "continuous" ]; then
  check_docker
fi

# Resolve target
if [ -n "$TARGET" ]; then
  resolved_path=$(resolve_target "$TARGET")
elif [ -n "$PRESET" ]; then
  # For presets without explicit target, create a working directory
  resolved_path="$TMP_DIR/preset-$PRESET-$(date +%s)"
  mkdir -p "$resolved_path"
else
  # No target, no preset: use a temp dir
  resolved_path="$TMP_DIR/ephemeral-$(date +%s)"
  mkdir -p "$resolved_path"
fi

# Launch
case "$MODE" in
  ephemeral)
    run_ephemeral "$resolved_path"
    ;;
  continuous)
    run_continuous "$resolved_path"
    ;;
  *)
    log_error "Invalid mode: $MODE (expected: ephemeral or continuous)"
    exit 1
    ;;
esac
```

---

### examples/wp-lab/presets/starter-agency.json

```json
{
  "name": "starter-agency",
  "description": "Example agency starter stack. Customize with your own plugins and themes.",
  "mode": "continuous",
  "wp_version": "latest",
  "php_version": "8.2",
  "plugins": [
    { "source": "advanced-custom-fields", "type": "slug" },
    { "source": "wordpress-seo", "type": "slug" },
    { "source": "safe-svg", "type": "slug" },
    { "source": "redirection", "type": "slug" }
  ],
  "themes": [
    { "source": "twentytwentyfive", "type": "slug" }
  ],
  "config": {
    "WP_DEBUG": true,
    "WP_DEBUG_LOG": true,
    "SCRIPT_DEBUG": true,
    "WP_ENVIRONMENT_TYPE": "development"
  },
  "env_vars": {}
}
```

---

### examples/wp-lab/presets/clean.json

Same as `skills/wp-lab/presets/clean.json` (copy it).

---

### examples/wp-lab/README.md

```markdown
# wp-lab Examples

Example presets for the wp-lab skill. Copy these to `skills/wp-lab/presets/` and customize.

## Presets

- `clean.json` - Vanilla WordPress, no plugins
- `starter-agency.json` - Basic agency stack with ACF, Yoast, and utility plugins

## Creating your own preset

Copy any preset and modify:

```json
{
  "name": "my-preset",
  "description": "What this preset is for",
  "mode": "ephemeral or continuous",
  "wp_version": "latest",
  "php_version": "8.2",
  "plugins": [
    { "source": "plugin-slug", "type": "slug" },
    { "source": "https://github.com/user/plugin", "type": "github" },
    { "source": "./local-plugin", "type": "local", "path": "/absolute/path" }
  ],
  "themes": [],
  "config": {},
  "env_vars": {}
}
```

### Plugin source types

| Type | Source value | Notes |
|------|-------------|-------|
| `slug` | wordpress.org slug | Auto-downloaded |
| `github` | Full GitHub URL | Shallow cloned |
| `local` | Directory path | Mounted directly |
| `url` | Download URL | For premium plugins with license key URLs |
```

---

### .claude/commands/new-skill.md

```markdown
# /new-skill

Scaffold a new skill in the voyager-skills repo.

## Your task

Create a new skill based on $ARGUMENTS (the skill name and description).

### Steps

1. Parse the skill name from $ARGUMENTS. Kebab-case it (e.g., "SEO Audit" becomes "seo-audit").
2. Create the directory structure:
   ```
   skills/<skill-name>/
   ├── SKILL.md
   ├── commands/
   │   └── <skill-name>.md
   ├── presets/     (if applicable)
   └── scripts/     (if applicable)
   ```
3. Generate SKILL.md with proper YAML frontmatter:
   - `name`: the kebab-case skill name
   - `description`: write a comprehensive trigger description based on what the user described. Make it "pushy" so it triggers reliably. Include specific phrases and contexts.
4. Generate the main slash command in `commands/<skill-name>.md`
5. Run `./install.sh` to symlink the new command
6. Report what was created and suggest next steps (test cases, iteration)

### SKILL.md template

Use this structure:

```markdown
---
name: <skill-name>
description: >
  <Comprehensive description of when to trigger. Include specific phrases,
  contexts, and use cases. Be pushy -- err on the side of triggering.>
---

# <Skill Name>

<What this skill does and why it exists.>

## Prerequisites

<What needs to be installed or configured.>

## Usage

<How to use the slash commands.>

## Workflow

<Step-by-step what happens when invoked.>
```
```

---

## Post-build checklist

After Claude Code creates all files:

1. `chmod +x install.sh scripts/wp-lab.sh`
2. `git init && git add -A && git commit -m "feat: initial repo with wp-lab skill"`
3. Create repo on GitHub: `gh repo create voyager-marketing/voyager-skills --public --source=.`
4. Run `./install.sh` to symlink commands
5. Test: open a new Claude Code session and try `/wp-ephemeral developer-tools`

## Notes for Claude Code

- Do NOT use em dashes anywhere in any file
- Use straightforward, direct language
- Keep comments practical, not decorative
- The scripts should work on Linux (DigitalOcean), macOS, and Windows WSL2
- The preset JSON structure is designed to be readable by both humans and the slash commands
- All temp work goes in /tmp/wp-lab/ to keep things clean
- License keys should never be hardcoded, always env vars