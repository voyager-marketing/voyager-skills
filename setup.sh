#!/usr/bin/env bash
# ============================================================
# voyager-skills/setup.sh
#
# Copies skills into a target repo or scaffolds a new client site.
#
# Usage (dev repos):
#   ./setup.sh <target-repo-path> [--type theme|blocks|plugin]
#
# Usage (client site — scaffolds CLAUDE.md + .mcp.json too):
#   ./setup.sh <target-path> --type client-site \
#     --domain client.com \
#     --name "Client Name" \
#     --wp-root /sites/client.com/files/ \
#     [--db-prefix tgn_] \
#     [--portal-site-id abc123]
# ============================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

usage() {
  echo "Usage:"
  echo "  $0 <target-path> [--type theme|blocks|plugin|client-site]"
  echo ""
  echo "Client site options:"
  echo "  --domain <domain>          Client domain (required for client-site)"
  echo "  --name <name>              Client name (required for client-site)"
  echo "  --wp-root <path>           WordPress root path (required for client-site)"
  echo "  --db-prefix <prefix>       DB table prefix (default: tgn_)"
  echo "  --portal-site-id <id>      Voyager Portal site ID"
  echo "  --wp-version <ver>         WordPress version (default: auto-detect)"
  echo "  --php-version <ver>        PHP version (default: auto-detect)"
  exit 1
}

detect_type() {
  local dir="$1"
  if [ -f "$dir/theme.json" ] && [ -d "$dir/templates" ]; then
    echo "theme"
  elif [ -d "$dir/src/blocks" ]; then
    echo "blocks"
  elif grep -rl "Plugin Name:" "$dir"/*.php 2>/dev/null | head -1 > /dev/null 2>&1; then
    echo "plugin"
  else
    echo "unknown"
  fi
}

copy_skill() {
  local src="$1"
  local dest="$2"
  if [ ! -f "$src/SKILL.md" ]; then
    echo "  SKIP (no SKILL.md): $(basename $src)"
    return
  fi
  local name
  name=$(basename "$src")
  mkdir -p "$dest/$name"
  cp "$src/SKILL.md" "$dest/$name/SKILL.md"
  # Copy any extra files (e.g. checklist.md)
  for extra in "$src"/*.md; do
    fname=$(basename "$extra")
    if [ "$fname" != "SKILL.md" ] && [ -f "$extra" ]; then
      cp "$extra" "$dest/$name/$fname"
    fi
  done
  echo "  Copied: $name"
}

substitute() {
  local content="$1"
  content="${content//\{\{CLIENT_NAME\}\}/$CLIENT_NAME}"
  content="${content//\{\{CLIENT_DOMAIN\}\}/$DOMAIN}"
  content="${content//\{\{WP_ROOT\}\}/$WP_ROOT}"
  content="${content//\{\{DB_PREFIX\}\}/$DB_PREFIX}"
  content="${content//\{\{PORTAL_SITE_ID\}\}/$PORTAL_SITE_ID}"
  content="${content//\{\{WP_VERSION\}\}/$WP_VERSION}"
  content="${content//\{\{PHP_VERSION\}\}/$PHP_VERSION}"
  echo "$content"
}

# --- Parse args ---
TARGET="${1:-}"
if [ -z "$TARGET" ]; then usage; fi
shift

TYPE=""
DOMAIN=""
CLIENT_NAME=""
WP_ROOT=""
DB_PREFIX="tgn_"
PORTAL_SITE_ID=""
WP_VERSION=""
PHP_VERSION=""

while [ $# -gt 0 ]; do
  case "$1" in
    --type)            TYPE="$2"; shift 2 ;;
    --domain=*)        DOMAIN="${1#*=}"; shift ;;
    --domain)          DOMAIN="$2"; shift 2 ;;
    --name=*)          CLIENT_NAME="${1#*=}"; shift ;;
    --name)            CLIENT_NAME="$2"; shift 2 ;;
    --wp-root=*)       WP_ROOT="${1#*=}"; shift ;;
    --wp-root)         WP_ROOT="$2"; shift 2 ;;
    --db-prefix=*)     DB_PREFIX="${1#*=}"; shift ;;
    --db-prefix)       DB_PREFIX="$2"; shift 2 ;;
    --portal-site-id=*) PORTAL_SITE_ID="${1#*=}"; shift ;;
    --portal-site-id)  PORTAL_SITE_ID="$2"; shift 2 ;;
    --wp-version=*)    WP_VERSION="${1#*=}"; shift ;;
    --wp-version)      WP_VERSION="$2"; shift 2 ;;
    --php-version=*)   PHP_VERSION="${1#*=}"; shift ;;
    --php-version)     PHP_VERSION="$2"; shift 2 ;;
    *) echo "Unknown option: $1"; usage ;;
  esac
done

# Resolve target
mkdir -p "$TARGET"
TARGET="$(cd "$TARGET" && pwd)"
SKILLS_DIR="$TARGET/.claude/skills"
HOOKS_DIR="$TARGET/.claude/hooks"

# Detect type if not specified
if [ -z "$TYPE" ]; then
  TYPE=$(detect_type "$TARGET")
fi

echo ""
echo "=== Voyager Skills Setup ==="
echo "  Target: $TARGET"
echo "  Type:   $TYPE"
echo ""

# ---------------------------------------------------------------
# CLIENT SITE
# ---------------------------------------------------------------
if [ "$TYPE" = "client-site" ]; then
  if [[ -z "$DOMAIN" || -z "$CLIENT_NAME" || -z "$WP_ROOT" ]]; then
    echo "Error: --domain, --name, and --wp-root are required for client-site type."
    usage
  fi

  # Auto-detect WP/PHP versions if not provided
  if [ -z "$WP_VERSION" ]; then
    WP_VERSION=$(wp --path="$WP_ROOT" core version 2>/dev/null || echo "7.0")
  fi
  if [ -z "$PHP_VERSION" ]; then
    PHP_VERSION=$(php -r 'echo PHP_MAJOR_VERSION.".".PHP_MINOR_VERSION;' 2>/dev/null || echo "8.3")
  fi

  echo "  Client: $CLIENT_NAME ($DOMAIN)"
  echo "  WP Root: $WP_ROOT"
  echo ""

  # 1. Scaffold CLAUDE.md
  if [ -f "$TARGET/CLAUDE.md" ]; then
    echo "→ CLAUDE.md already exists, skipping."
  else
    echo "→ Writing CLAUDE.md..."
    substitute "$(cat "$SCRIPT_DIR/templates/CLAUDE.md.template")" > "$TARGET/CLAUDE.md"
  fi

  # 2. Scaffold .mcp.json
  if [ -f "$TARGET/.mcp.json" ]; then
    echo "→ .mcp.json already exists, skipping."
  else
    echo "→ Writing .mcp.json..."
    substitute "$(cat "$SCRIPT_DIR/templates/.mcp.json.template")" > "$TARGET/.mcp.json"
  fi

  # 3. Settings
  mkdir -p "$TARGET/.claude"
  if [ -f "$TARGET/.claude/settings.json" ]; then
    echo "→ .claude/settings.json already exists, skipping."
  else
    echo "→ Writing .claude/settings.json..."
    cat > "$TARGET/.claude/settings.json" << SETTINGS
{
  "permissions": {
    "allow": [
      "Read(/**)",
      "Bash(wp --path=* *)",
      "Bash(php -l *)",
      "Bash(php -r *)",
      "Bash(git status)",
      "Bash(git log *)",
      "Bash(git diff *)",
      "Bash(git add *)",
      "Bash(git commit *)",
      "Bash(git push *)",
      "Bash(git pull *)",
      "Bash(git checkout *)",
      "Bash(git branch *)",
      "Bash(composer install)",
      "Bash(composer update)",
      "Bash(npm install)",
      "Bash(npm run *)",
      "WebFetch(domain:$DOMAIN)",
      "WebFetch(domain:v3.voyagermark.com)",
      "WebFetch(domain:portal.voyagermark.com)",
      "WebFetch(domain:developer.wordpress.org)"
    ],
    "deny": []
  }
}
SETTINGS
  fi

  # 4. Copy client skills
  echo ""
  echo "→ Copying client skills..."
  mkdir -p "$SKILLS_DIR"

  for skill in publish report fleet-health pseo pseo-manage content-audit link-builder seo-report wp-debug wp-preflight; do
    # Check skills/ first, then wordpress/
    if [ -d "$SCRIPT_DIR/skills/$skill" ]; then
      copy_skill "$SCRIPT_DIR/skills/$skill" "$SKILLS_DIR"
    elif [ -d "$SCRIPT_DIR/wordpress/$skill" ]; then
      copy_skill "$SCRIPT_DIR/wordpress/$skill" "$SKILLS_DIR"
    fi
  done
  # Always include conventions + router
  copy_skill "$SCRIPT_DIR/wordpress/wp-voyager-conventions" "$SKILLS_DIR"
  copy_skill "$SCRIPT_DIR/shared/voyager-router" "$SKILLS_DIR"

  # 5. Copy hooks
  echo ""
  echo "→ Copying hooks..."
  mkdir -p "$HOOKS_DIR"
  if [ -d "$SCRIPT_DIR/hooks" ]; then
    cp "$SCRIPT_DIR/hooks/"*.sh "$HOOKS_DIR/" 2>/dev/null && echo "  Hooks copied." || echo "  No hooks found."
  fi

  echo ""
  echo "=== Client site ready ==="
  echo ""
  echo "Next steps:"
  echo "  1. Review $TARGET/CLAUDE.md — verify paths and fill in any gaps"
  echo "  2. Open Claude Code in $TARGET to confirm MCP connects (wp mcp-adapter check)"
  echo "  3. Run /onboard-client \"$CLIENT_NAME\" to complete Notion + WordPress setup"
  echo ""
  exit 0
fi

# ---------------------------------------------------------------
# DEV REPO TYPES
# ---------------------------------------------------------------
echo "→ Copying skills..."
mkdir -p "$SKILLS_DIR"

# Always copy conventions
copy_skill "$SCRIPT_DIR/wordpress/wp-voyager-conventions" "$SKILLS_DIR"

case "$TYPE" in
  theme)
    copy_skill "$SCRIPT_DIR/wordpress/wp-block-theming" "$SKILLS_DIR"
    copy_skill "$SCRIPT_DIR/wordpress/wp-performance" "$SKILLS_DIR"
    copy_skill "$SCRIPT_DIR/wordpress/wp-patterns" "$SKILLS_DIR"
    copy_skill "$SCRIPT_DIR/wordpress/wp-debug" "$SKILLS_DIR"
    copy_skill "$SCRIPT_DIR/wordpress/wp-preflight" "$SKILLS_DIR"
    copy_skill "$SCRIPT_DIR/wordpress/wp-deploy" "$SKILLS_DIR"
    ;;
  blocks)
    copy_skill "$SCRIPT_DIR/wordpress/wp-block-dev" "$SKILLS_DIR"
    copy_skill "$SCRIPT_DIR/wordpress/wp-interactivity" "$SKILLS_DIR"
    copy_skill "$SCRIPT_DIR/wordpress/wp-block-scaffold" "$SKILLS_DIR"
    copy_skill "$SCRIPT_DIR/wordpress/wp-block-audit" "$SKILLS_DIR"
    copy_skill "$SCRIPT_DIR/wordpress/wp-patterns" "$SKILLS_DIR"
    copy_skill "$SCRIPT_DIR/wordpress/wp-debug" "$SKILLS_DIR"
    copy_skill "$SCRIPT_DIR/wordpress/wp-preflight" "$SKILLS_DIR"
    copy_skill "$SCRIPT_DIR/wordpress/wp-deploy" "$SKILLS_DIR"
    ;;
  plugin)
    copy_skill "$SCRIPT_DIR/wordpress/wp-plugin-dev" "$SKILLS_DIR"
    copy_skill "$SCRIPT_DIR/wordpress/wp-phpstan" "$SKILLS_DIR"
    copy_skill "$SCRIPT_DIR/wordpress/wp-debug" "$SKILLS_DIR"
    copy_skill "$SCRIPT_DIR/wordpress/wp-preflight" "$SKILLS_DIR"
    copy_skill "$SCRIPT_DIR/wordpress/wp-deploy" "$SKILLS_DIR"
    ;;
  *)
    echo "Unknown type '$TYPE'. Use --type theme|blocks|plugin|client-site"
    exit 1
    ;;
esac

# Always copy router
copy_skill "$SCRIPT_DIR/shared/voyager-router" "$SKILLS_DIR"

echo ""
echo "Done. Skills installed for '$TYPE' repo."
echo "Restart Claude Code to pick up new skills."
