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
        count=$((count + 1))
      fi
    done
  fi
done

echo ""
echo "Installed $count commands to $TARGET_DIR"
echo "Restart Claude Code to pick up new commands."
