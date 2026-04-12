#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

usage() {
  echo "Usage: $0 <target-repo-path> [--type theme|blocks|plugin]"
  echo ""
  echo "Copies relevant skills into a target repo's .claude/skills/ directory."
  echo "Auto-detects repo type if --type is not specified."
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
  local name
  name=$(basename "$src")
  mkdir -p "$dest/$name"
  cp "$src/SKILL.md" "$dest/$name/SKILL.md"
  echo "  Copied: $name"
}

# Parse args
TARGET="${1:-}"
TYPE=""

if [ -z "$TARGET" ]; then
  usage
fi

shift
while [ $# -gt 0 ]; do
  case "$1" in
    --type) TYPE="$2"; shift 2 ;;
    *) echo "Unknown option: $1"; usage ;;
  esac
done

# Resolve target
TARGET="$(cd "$TARGET" && pwd)"
SKILLS_DIR="$TARGET/.claude/skills"

# Detect type if not specified
if [ -z "$TYPE" ]; then
  TYPE=$(detect_type "$TARGET")
fi

echo "Target: $TARGET"
echo "Type:   $TYPE"
echo "Skills: $SKILLS_DIR"
echo ""

# Always copy conventions
copy_skill "$SCRIPT_DIR/wordpress/wp-voyager-conventions" "$SKILLS_DIR"

case "$TYPE" in
  theme)
    copy_skill "$SCRIPT_DIR/wordpress/wp-block-theming" "$SKILLS_DIR"
    copy_skill "$SCRIPT_DIR/wordpress/wp-performance" "$SKILLS_DIR"
    ;;
  blocks)
    copy_skill "$SCRIPT_DIR/wordpress/wp-block-dev" "$SKILLS_DIR"
    copy_skill "$SCRIPT_DIR/wordpress/wp-interactivity" "$SKILLS_DIR"
    ;;
  plugin)
    copy_skill "$SCRIPT_DIR/wordpress/wp-plugin-dev" "$SKILLS_DIR"
    copy_skill "$SCRIPT_DIR/wordpress/wp-phpstan" "$SKILLS_DIR"
    ;;
  *)
    echo "Could not detect repo type. Use --type to specify."
    exit 1
    ;;
esac

# Always copy router
copy_skill "$SCRIPT_DIR/shared/voyager-router" "$SKILLS_DIR"

echo ""
echo "Done. Copied skills for '$TYPE' repo."
echo "Restart Claude Code to pick up new skills."
