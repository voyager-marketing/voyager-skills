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
