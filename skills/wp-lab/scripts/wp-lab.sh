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
PHP_VERSION="8.3"   # wp-now caps at 8.3 as of 2026-05-07; SpinupWP supports 8.4 (accept the skew)
USE_DEV=false      # voyager-stack: force working trees, never use ~/.voyager-dist

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
  --preset    Load a preset config (clean, voyager-base, gutenberg-dev, voyager-stack)
  --port      Override the default port
  --php       PHP version (default: 8.4)
  --use-dev   voyager-stack only: symlink working trees instead of ~/.voyager-dist
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

# Cross-platform symlink helper. Tries POSIX symlink first, falls back to
# Windows directory junction via cmd.exe (works without admin / dev mode).
voyager_link() {
  local src="$1" dest="$2"

  if [ ! -d "$src" ]; then
    log_warn "Source not found, skipping link: $src"
    return 1
  fi

  # Replace existing symlink; refuse to clobber a real directory
  if [ -L "$dest" ]; then
    rm -f "$dest"
  elif [ -e "$dest" ]; then
    log_warn "Destination exists and is not a symlink, leaving alone: $dest"
    return 0
  fi

  if ln -s "$src" "$dest" 2>/dev/null; then
    log_ok "Linked $(basename "$dest") -> $src"
    return 0
  fi

  # Windows fallback: directory junction
  if command -v cmd.exe >/dev/null 2>&1; then
    local win_src win_dest
    if command -v cygpath >/dev/null 2>&1; then
      win_src=$(cygpath -w "$src")
      win_dest=$(cygpath -w "$dest")
    else
      win_src=$(echo "$src"  | sed -E 's|^/([a-zA-Z])/|\1:/|; s|/|\\|g')
      win_dest=$(echo "$dest" | sed -E 's|^/([a-zA-Z])/|\1:/|; s|/|\\|g')
    fi
    if cmd.exe //c mklink //J "$win_dest" "$win_src" >/dev/null 2>&1; then
      log_ok "Junction $(basename "$dest") -> $src"
      return 0
    fi
  fi

  log_error "Could not link $src -> $dest"
  log_info "On Windows: enable Developer Mode (Settings > For developers) or run as Admin"
  return 1
}

# Resolve a Voyager component to a local source path.
#
# Order of precedence:
#   1. If --use-dev flag set → working tree at $VOYAGER_DEV_ROOT/$component
#   2. Else if ~/.voyager-dist/$component/latest exists → that (stable release artifact)
#   3. Else fall back to working tree at $VOYAGER_DEV_ROOT/$component
#
# Echoes the resolved absolute path. Returns 1 if neither dist nor working tree exist.
resolve_voyager_source() {
  local component="$1"
  local dist_path="${VOYAGER_DIST_ROOT:-$HOME/.voyager-dist}/$component/latest"
  local dev_path="$VOYAGER_DEV_ROOT/$component"

  if [ "$USE_DEV" = true ]; then
    [ -d "$dev_path" ] && { echo "$dev_path"; return 0; }
    return 1
  fi

  if [ -d "$dist_path" ]; then
    echo "$dist_path"
    return 0
  fi

  if [ -d "$dev_path" ]; then
    echo "$dev_path"
    return 0
  fi

  return 1
}

# Boot the standard Voyager stack: parent block theme + core/blocks/orbit plugin
# suite + cwd as active child theme. Builds a wrapper dir at
# ~/.wp-now/voyager-stack/<child-slug>/ with symlinks into wp-content/, then
# launches wp-now from there in wp-content mode (state persists across runs).
#
# Source resolution per component (see resolve_voyager_source):
#   default   prefer ~/.voyager-dist/<comp>/latest, fall back to working tree
#   --use-dev always working tree (for plugin-developer mode)
run_voyager_stack() {
  local child_dir="$(pwd)"
  local child_slug="$(basename "$child_dir")"

  # All four components now consolidated under one root (voyager-blocks moved
  # from F:/dev/voyager/voyager-blocks into F:/dev/voyager/wordpress/ on
  # 2026-05-07). Single env var: VOYAGER_DEV_ROOT.
  : "${VOYAGER_DEV_ROOT:=/f/dev/voyager/wordpress}"

  log_info "VOYAGER_DEV_ROOT=$VOYAGER_DEV_ROOT"
  log_info "VOYAGER_DIST_ROOT=${VOYAGER_DIST_ROOT:-$HOME/.voyager-dist}"
  if [ "$USE_DEV" = true ]; then
    log_warn "--use-dev: forcing working trees (skipping ~/.voyager-dist resolution)"
  fi

  # If cwd is not a theme dir, scaffold from voyager-blank-child
  if [ ! -f "$child_dir/style.css" ]; then
    log_warn "cwd has no style.css — scaffolding from voyager-blank-child"
    local scaffold_dir="$child_dir/voyager-child-scratch"
    if [ ! -d "$scaffold_dir" ]; then
      git clone --depth 1 https://github.com/voyager-marketing/voyager-blank-child "$scaffold_dir" \
        || { log_error "Failed to clone voyager-blank-child"; exit 1; }
    fi
    child_dir="$scaffold_dir"
    child_slug="voyager-child-scratch"
  fi

  # Resolve each component's source (dist or dev tree) and capture for symlinking
  local -A SOURCES=()
  local missing=()
  for component in voyager-block-theme voyager-core voyager-orbit voyager-blocks; do
    local resolved
    if resolved=$(resolve_voyager_source "$component"); then
      SOURCES[$component]="$resolved"
      log_info "  $component → $resolved"
    else
      missing+=("$component")
    fi
  done

  if [ ${#missing[@]} -gt 0 ]; then
    log_error "Could not resolve source for:"
    for m in "${missing[@]}"; do log_error "  - $m"; done
    log_info ""
    log_info "Either pull release artifacts:"
    log_info "  $SCRIPT_DIR/voyager-dist-sync.sh sync"
    log_info "Or clone the working trees to \$VOYAGER_DEV_ROOT:"
    log_info "  git clone https://github.com/voyager-marketing/voyager-block-theme \$VOYAGER_DEV_ROOT/voyager-block-theme"
    log_info "  git clone https://github.com/voyager-marketing/voyager-core         \$VOYAGER_DEV_ROOT/voyager-core"
    log_info "  git clone https://github.com/voyager-marketing/voyager-orbit        \$VOYAGER_DEV_ROOT/voyager-orbit"
    log_info "  git clone https://github.com/voyager-marketing/voyager-blocks       \$VOYAGER_DEV_ROOT/voyager-blocks"
    exit 1
  fi

  # Wrapper dir lives outside the client repo so we don't pollute it
  local wrapper="$HOME/.wp-now/voyager-stack/$child_slug"
  local content="$wrapper/wp-content"
  mkdir -p "$content/plugins" "$content/themes"
  log_info "Wrapper: $wrapper"

  # Plugin symlinks
  voyager_link "${SOURCES[voyager-core]}"   "$content/plugins/voyager-core"
  voyager_link "${SOURCES[voyager-orbit]}"  "$content/plugins/voyager-orbit"
  voyager_link "${SOURCES[voyager-blocks]}" "$content/plugins/voyager-blocks"

  # Theme symlinks (parent slug must be 'voyager')
  voyager_link "${SOURCES[voyager-block-theme]}" "$content/themes/voyager"
  voyager_link "$child_dir"                      "$content/themes/$child_slug"

  log_info ""
  log_ok "================================================"
  log_ok "  Voyager Stack launching (wp-now, project mode)"
  log_ok "  URL:           http://localhost:$PORT_EPHEMERAL"
  log_ok "  Active theme:  $child_slug (child of voyager)"
  log_ok "  Plugins:       voyager-core, voyager-blocks, voyager-orbit"
  log_ok "  PHP:           $PHP_VERSION"
  log_ok "  Source mode:   $([ "$USE_DEV" = true ] && echo 'working tree (--use-dev)' || echo 'dist with dev fallback')"
  log_ok "  Wrapper:       $wrapper"
  log_ok "================================================"
  log_info ""
  log_info "After WordPress boots, activate the stack from a separate terminal."
  log_info "wp-now resolves its project from cwd, so you MUST cd to the wrapper:"
  log_info ""
  log_info "  cd $wrapper"
  log_info "  npx wp-now wp theme activate $child_slug"
  log_info "  npx wp-now wp plugin activate voyager-core voyager-blocks voyager-orbit"
  log_info ""
  log_info "(Running from $child_dir will fail with 'Cannot find module package.json'.)"
  log_info ""

  cd "$wrapper"
  npx @wp-now/wp-now start --port="$PORT_EPHEMERAL" --php="$PHP_VERSION"
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
  npx @wp-now/wp-now start --port="$PORT_EPHEMERAL" --php="$PHP_VERSION"
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
    --php)     PHP_VERSION="$2"; shift 2 ;;
    --use-dev) USE_DEV=true; shift ;;
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

  # voyager-stack has bespoke wiring: wrapper dir + plugin/theme symlinks +
  # cwd-as-active-child-theme. Route directly to it and bypass the generic flow.
  if [ "$PRESET" = "voyager-stack" ]; then
    run_voyager_stack
    exit 0
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
