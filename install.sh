#!/usr/bin/env bash
# ============================================================
# voyager-skills/install.sh
#
# Installs Voyager skills into Claude Code:
#   1. Symlinks each skills/<name>/ → ~/.claude/skills/<name>/
#      So Claude Code auto-discovers them by intent.
#   2. Symlinks each skills/<name>/commands/*.md → ~/.claude/commands/
#      So slash commands like /content-strategy work globally.
#
# Idempotent: re-run any time to pick up new skills or new commands.
# Updates propagate via `git pull` since the targets are symlinks.
#
# Usage:
#   ./install.sh
#   ./install.sh --skills-target <dir>   (override ~/.claude/skills)
#   ./install.sh --commands-target <dir> (override ~/.claude/commands)
# ============================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILLS_TARGET="$HOME/.claude/skills"
COMMANDS_TARGET="$HOME/.claude/commands"

while [ $# -gt 0 ]; do
  case "$1" in
    --skills-target=*)   SKILLS_TARGET="${1#*=}"; shift ;;
    --skills-target)     SKILLS_TARGET="$2"; shift 2 ;;
    --commands-target=*) COMMANDS_TARGET="${1#*=}"; shift ;;
    --commands-target)   COMMANDS_TARGET="$2"; shift 2 ;;
    --target=*)          COMMANDS_TARGET="${1#*=}"; shift ;;  # back-compat
    --target)            COMMANDS_TARGET="$2"; shift 2 ;;
    --help|-h)
      echo "Usage: $0 [--skills-target <dir>] [--commands-target <dir>]"
      echo "Defaults: ~/.claude/skills and ~/.claude/commands"
      exit 0
      ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

mkdir -p "$SKILLS_TARGET" "$COMMANDS_TARGET"

# ---------- 1. Symlink skill directories for auto-discovery ----------
skill_count=0
for skill_dir in "$SCRIPT_DIR"/skills/*/; do
  [ -d "$skill_dir" ] || continue
  skill_name=$(basename "$skill_dir")
  # Skip if no SKILL.md (defensive — every skill folder should have one)
  [ -f "${skill_dir}SKILL.md" ] || { echo "  ⚠ $skill_name: no SKILL.md, skipping"; continue; }
  ln -sfn "${skill_dir%/}" "$SKILLS_TARGET/$skill_name"
  skill_count=$((skill_count + 1))
done
echo "Linked $skill_count skills → $SKILLS_TARGET"

# ---------- 2. Symlink slash commands ----------
cmd_count=0
for cmd_dir in "$SCRIPT_DIR"/skills/*/commands; do
  [ -d "$cmd_dir" ] || continue
  skill_name=$(basename "$(dirname "$cmd_dir")")
  for cmd_file in "$cmd_dir"/*.md; do
    [ -f "$cmd_file" ] || continue
    filename=$(basename "$cmd_file")
    ln -sf "$cmd_file" "$COMMANDS_TARGET/$filename"
    cmd_count=$((cmd_count + 1))
  done
done
echo "Linked $cmd_count slash commands → $COMMANDS_TARGET"

echo ""
echo "Restart Claude Code to pick up changes (or just open a new session)."
