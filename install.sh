#!/usr/bin/env bash
# ============================================================
# voyager-skills/install.sh
#
# Symlinks all slash commands from skills/*/commands/*.md
# into ~/.claude/commands/ so they're available globally
# in every Claude Code project on this machine.
#
# Usage:
#   ./install.sh [--target <dir>]
#
# Options:
#   --target <dir>   Override install directory (default: ~/.claude/commands)
# ============================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_DIR="$HOME/.claude/commands"

# Parse args
while [ $# -gt 0 ]; do
  case "$1" in
    --target=*) TARGET_DIR="${1#*=}"; shift ;;
    --target)   TARGET_DIR="$2"; shift 2 ;;
    --help|-h)
      echo "Usage: $0 [--target <dir>]"
      echo "Symlinks voyager skill commands into ~/.claude/commands/"
      exit 0
      ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

mkdir -p "$TARGET_DIR"

count=0
for skill_dir in "$SCRIPT_DIR"/skills/*/commands; do
  if [ -d "$skill_dir" ]; then
    skill_name=$(basename "$(dirname "$skill_dir")")
    for cmd_file in "$skill_dir"/*.md; do
      if [ -f "$cmd_file" ]; then
        filename=$(basename "$cmd_file")
        ln -sf "$cmd_file" "$TARGET_DIR/$filename"
        echo "  Linked /$filename  ($skill_name)"
        count=$((count + 1))
      fi
    done
  fi
done

echo ""
echo "Installed $count commands → $TARGET_DIR"
echo ""
echo "Available slash commands:"
for f in "$TARGET_DIR"/*.md; do
  [ -f "$f" ] && echo "  /$(basename "$f" .md)"
done
echo ""
echo "Restart Claude Code to pick up new commands."
