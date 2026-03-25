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
