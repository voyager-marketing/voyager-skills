#!/usr/bin/env bash
#
# voyager-dist-sync.sh
#
# Maintains a local cache of pre-built Voyager plugin/theme release zips at
# ~/.voyager-dist/. Powers the wp-lab voyager-stack preset's "use stable
# release artifacts instead of working trees" behavior, so child-theme dev
# isn't disrupted by WIP commits in the plugin repos.
#
# Design doc: https://www.notion.so/35947c03778b81beaf2cc088ffabd1e3
# Layout:     ~/.voyager-dist/<component>/<version>/  + 'latest' symlink
# Source:     GitHub Releases (pre-built zips, no local build step needed)
#
set -euo pipefail

DIST_ROOT="${VOYAGER_DIST_ROOT:-$HOME/.voyager-dist}"
COMPONENTS=(voyager-block-theme voyager-core voyager-orbit voyager-blocks)

log()  { echo "[voyager-dist] $*"; }
ok()   { echo "[voyager-dist] OK $*"; }
warn() { echo "[voyager-dist] WARN $*"; }
err()  { echo "[voyager-dist] ERR  $*" >&2; }

# Cross-platform symlink helper. POSIX symlink first, Windows junction fallback.
# Always force-replaces the destination — only used for known-safe paths
# (~/.voyager-dist/<comp>/latest) we fully own.
make_link() {
  local src="$1" dest="$2"
  # Force-remove any existing symlink, junction, or empty dir at $dest.
  # (Windows junctions don't satisfy [ -L ] on Git Bash, so check both.)
  rm -rf "$dest" 2>/dev/null || true
  if ln -s "$src" "$dest" 2>/dev/null; then return 0; fi
  if command -v cmd.exe >/dev/null 2>&1; then
    local ws wd
    if command -v cygpath >/dev/null 2>&1; then
      ws=$(cygpath -w "$src"); wd=$(cygpath -w "$dest")
    else
      ws=$(echo "$src"  | sed -E 's|^/([a-zA-Z])/|\1:/|; s|/|\\|g')
      wd=$(echo "$dest" | sed -E 's|^/([a-zA-Z])/|\1:/|; s|/|\\|g')
    fi
    cmd.exe //c mklink //J "$wd" "$ws" >/dev/null 2>&1 && return 0
  fi
  return 1
}

# Read the Version: header out of an extracted plugin/theme directory.
# Tries (in order): style.css, <component>.php, then any root .php file with a Plugin Name: header
# (covers cases like voyager-orbit where the main plugin file is voyager-core.php).
read_version() {
  local dir="$1" component="$2" v=""

  # Theme: style.css
  if [ -f "$dir/style.css" ]; then
    v=$(grep -i "^[[:space:]]*Version:" "$dir/style.css" | head -1 | sed -E 's/.*Version:[[:space:]]*([^[:space:]]+).*/\1/' | tr -d '\r')
  fi

  # Plugin: expected file
  if [ -z "$v" ] && [ -f "$dir/$component.php" ]; then
    v=$(grep -i "Version:" "$dir/$component.php" | head -1 | sed -E 's/.*Version:[[:space:]]*([^[:space:]]+).*/\1/' | tr -d '\r')
  fi

  # Plugin: scan all root .php files for one with Plugin Name: header
  if [ -z "$v" ]; then
    for php_file in "$dir"/*.php; do
      [ -f "$php_file" ] || continue
      if grep -qi "^[[:space:]]*\*[[:space:]]*Plugin Name:" "$php_file" || grep -qi "^Plugin Name:" "$php_file"; then
        v=$(grep -i "Version:" "$php_file" | head -1 | sed -E 's/.*Version:[[:space:]]*([^[:space:]]+).*/\1/' | tr -d '\r')
        [ -n "$v" ] && break
      fi
    done
  fi

  [ -z "$v" ] && v="snapshot-$(date +%Y%m%d-%H%M%S)"
  echo "$v"
}

sync_component() {
  local component="$1"
  local repo="voyager-marketing/$component"
  local tmp; tmp=$(mktemp -d)
  local zip_path=""

  log "Fetching latest release of $component..."

  # Prefer gh CLI (handles private repos + auth)
  if command -v gh >/dev/null 2>&1; then
    # First try: a release asset zip (release publishes a built artifact)
    if gh release download --repo "$repo" --pattern "*.zip" --dir "$tmp" --clobber 2>/dev/null; then
      zip_path=$(ls "$tmp"/*.zip 2>/dev/null | head -1)
    fi

    # Second try: source archive (release is just a tag with no assets — typical for themes)
    if [ -z "$zip_path" ]; then
      if gh release download --repo "$repo" --archive=zip --dir "$tmp" --clobber 2>/dev/null; then
        zip_path=$(ls "$tmp"/*.zip 2>/dev/null | head -1)
        log "  (used source archive — no built asset on this release)"
      fi
    fi
  fi

  # Fallback: curl (public repos only)
  if [ -z "$zip_path" ]; then
    local url="https://github.com/$repo/releases/latest/download/$component.zip"
    if curl -fsSL "$url" -o "$tmp/$component.zip" 2>/dev/null; then
      zip_path="$tmp/$component.zip"
    fi
  fi

  if [ -z "$zip_path" ] || [ ! -f "$zip_path" ]; then
    err "Could not download $component"
    err "  Tried: gh release download --repo $repo"
    err "  Tried: https://github.com/$repo/releases/latest/download/$component.zip"
    err "  If repo is private, run: gh auth login"
    rm -rf "$tmp"
    return 1
  fi

  # Extract into staging, detect version, then move into versioned slot
  local stage="$tmp/extracted"
  mkdir -p "$stage"
  unzip -q -o "$zip_path" -d "$stage"

  # GH zips usually nest under a single top-level dir matching the component
  local extracted_root="$stage/$component"
  if [ ! -d "$extracted_root" ]; then
    # Try first directory in stage
    extracted_root=$(find "$stage" -mindepth 1 -maxdepth 1 -type d | head -1)
  fi
  if [ -z "$extracted_root" ] || [ ! -d "$extracted_root" ]; then
    err "$component zip extracted to unexpected layout, skipping"
    rm -rf "$tmp"
    return 1
  fi

  local version
  version=$(read_version "$extracted_root" "$component")

  local dest="$DIST_ROOT/$component/$version"
  mkdir -p "$DIST_ROOT/$component"
  rm -rf "$dest"
  mv "$extracted_root" "$dest"

  make_link "$dest" "$DIST_ROOT/$component/latest" || warn "Could not update 'latest' symlink for $component"

  rm -rf "$tmp"
  ok "$component @ $version"
}

cmd_sync() {
  local targets=("$@")
  [ ${#targets[@]} -eq 0 ] && targets=("${COMPONENTS[@]}")
  mkdir -p "$DIST_ROOT"
  log "Dist root: $DIST_ROOT"
  local fails=0
  for c in "${targets[@]}"; do
    sync_component "$c" || fails=$((fails + 1))
  done
  if [ "$fails" -gt 0 ]; then
    err "$fails component(s) failed"
    return 1
  fi
  log "All components synced."
}

cmd_list() {
  if [ ! -d "$DIST_ROOT" ]; then
    log "No dist installed at $DIST_ROOT — run: voyager-dist sync"
    return 0
  fi
  log "Installed at $DIST_ROOT:"
  for c in "${COMPONENTS[@]}"; do
    if [ -d "$DIST_ROOT/$c" ]; then
      local latest_target=""
      if [ -L "$DIST_ROOT/$c/latest" ]; then
        latest_target=$(basename "$(readlink "$DIST_ROOT/$c/latest")" 2>/dev/null)
      fi
      local versions
      versions=$(ls -1 "$DIST_ROOT/$c" 2>/dev/null | grep -v "^latest$" | tr '\n' ' ')
      printf "  %-22s latest=%-12s versions: %s\n" "$c" "${latest_target:-(none)}" "$versions"
    else
      printf "  %-22s (not installed)\n" "$c"
    fi
  done
}

cmd_help() {
  cat <<EOF
voyager-dist — manage local cache of Voyager plugin/theme release zips

Usage:
  voyager-dist sync                     Pull latest release of all 4 components
  voyager-dist sync <component> ...     Pull latest of specific components
  voyager-dist list                     Show what's installed
  voyager-dist help                     This message

Components:
  ${COMPONENTS[*]}

Dist root: \$VOYAGER_DIST_ROOT (default: ~/.voyager-dist)

Auth:
  Uses 'gh' CLI if available (handles private repos via gh auth login).
  Falls back to curl for public-repo download.
EOF
}

cmd="${1:-help}"
shift || true

case "$cmd" in
  sync)        cmd_sync "$@" ;;
  list|ls)     cmd_list ;;
  help|-h|--help) cmd_help ;;
  *)
    err "Unknown command: $cmd"
    cmd_help
    exit 2
    ;;
esac
