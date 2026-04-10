# Voyager Skills

Reusable agentic skills for WordPress agency operations. Built for [Claude Code](https://docs.anthropic.com/en/docs/claude-code) slash commands.

## What's a skill?

A skill is a packaged set of instructions, scripts, and presets that Claude Code can execute via slash commands. Think of them as reusable playbooks.

## Available Skills

| Skill | Command | Description |
|-------|---------|-------------|
| [wp-lab](skills/wp-lab/) | `/wp-lab`, `/wp-ephemeral`, `/wp-dev`, `/wp-clean` | Spin up ephemeral or continuous WordPress dev environments instantly |
| [content-strategy](skills/content-strategy/) | `/content-strategy` | Plan data-driven content strategy with Ahrefs keyword research |
| [editorial-qa](skills/editorial-qa/) | `/editorial-qa` | Review and improve marketing content quality |
| [client-prep](skills/client-prep/) | `/client-prep` | Build a briefing before any client call or meeting |
| [seo-research](skills/seo-research/) | `/seo-research` | Research SEO data via Ahrefs MCP -- keywords, backlinks, competitors |

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

## MCP Integrations

Some skills are enhanced by MCP server connections:

| MCP Server | Used By | What It Provides |
|------------|---------|------------------|
| Ahrefs | content-strategy, seo-research | Keyword data, backlinks, rankings, site audits |
| Notion | client-prep, content-strategy | CRM records, projects, content database |
| Google Calendar | client-prep | Meeting details, attendees |
| Gmail | client-prep | Recent email threads |
| Slack | client-prep | Channel mentions, team discussions |
| Stripe | client-prep | Invoice status, subscription details |

Skills work without MCP connections but produce richer output when connected.

## Creating a new skill

Use the meta command from within this repo:

```
/new-skill
```

## License

MIT
