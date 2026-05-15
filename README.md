# Voyager Skills

Reusable agentic skills for WordPress agency operations. Built for [Claude Code](https://docs.anthropic.com/en/docs/claude-code).

## Installation

### 1. Global slash commands (any machine, any project)

Clone and run `install.sh` to symlink all commands into `~/.claude/commands/`:

```bash
git clone https://github.com/voyager-marketing/voyager-skills.git
cd voyager-skills
./install.sh
```

Restart Claude Code. All commands are now available everywhere.

### 2. New client site (scaffold + skills)

```bash
./setup.sh /sites/client.com --type client-site \
  --domain client.com \
  --name "Client Name" \
  --wp-root /sites/client.com/files/ \
  --db-prefix tgn_ \
  --portal-site-id abc123
```

Writes `CLAUDE.md`, `.mcp.json`, `.claude/settings.json`, and installs the right skills for a client WordPress server. Then open Claude Code in that directory and run `/onboard-client`.

### 3. Dev repo (per-plugin/theme skills)

```bash
./setup.sh /path/to/voyager-blocks --type blocks
./setup.sh /path/to/voyager-block-theme --type theme
./setup.sh /path/to/voyager-orbit --type plugin
```

Auto-detects type if `--type` is omitted.

---

## Slash Commands (global)

Installed via `install.sh` into `~/.claude/commands/`.

| Command | Description |
|---------|-------------|
| `/publish` | Run the Notion→WordPress publishing pipeline |
| `/report` | Generate a monthly client analytics report |
| `/onboard-client` | Onboard a new client across Notion + WordPress |
| `/prospect-audit` | SEO + site audit on a prospect's domain |
| `/pseo` | Batch-create programmatic SEO service area pages |
| `/pseo-manage` | Audit, enrich, and manage existing pSEO pages |
| `/fleet-health` | Health sweep across all client sites |
| `/content-audit` | Audit site content freshness, quality, and gaps |
| `/link-builder` | Analyze internal links and find opportunities |
| `/pattern-cloud` | Sync Voyager patterns to client sites |
| `/seo-report` | SEO health report, content clusters, schema markup |
| `/content-strategy` | Data-driven content strategy via Ahrefs |
| `/editorial-qa` | Review and improve marketing content |
| `/client-prep` | Briefing before any client call or meeting |
| `/seo-research` | Keywords, backlinks, competitors via Ahrefs |
| `/wp-lab` | Spin up ephemeral WordPress dev environments |
| `/ship-session` | End-of-session: push repos, update Notion + memory |

---

## Per-Repo Skills

Installed via `setup.sh` into a repo's `.claude/skills/`.

### `--type blocks`
`wp-block-dev`, `wp-block-scaffold`, `wp-block-audit`, `wp-interactivity`, `wp-patterns`, `wp-debug`, `wp-preflight`, `wp-deploy`, `wp-voyager-conventions`

### `--type theme`
`wp-block-theming`, `wp-performance`, `wp-patterns`, `wp-debug`, `wp-preflight`, `wp-deploy`, `wp-voyager-conventions`

### `--type plugin`
`wp-plugin-dev`, `wp-phpstan`, `wp-debug`, `wp-preflight`, `wp-deploy`, `wp-voyager-conventions`

### `--type client-site`
`publish`, `report`, `fleet-health`, `content-audit`, `link-builder`, `seo-report`, `pseo`, `pseo-manage`, `wp-debug`, `wp-preflight`, `wp-voyager-conventions`, `voyager-router`

Plus scaffolds: `CLAUDE.md`, `.mcp.json`, `.claude/settings.json`

---

## MCP Integrations

| MCP Server | Used By |
|------------|---------|
| Notion | publish, report, onboard-client, client-prep, fleet-health |
| WordPress | publish, pseo, fleet-health, content-audit, link-builder |
| Ahrefs | content-strategy, seo-research, prospect-audit |
| Google Calendar | client-prep |
| Gmail | client-prep |
| Slack | fleet-health, client-prep |
| Stripe | client-prep |

Skills degrade gracefully — they work without MCP connections but produce richer output when connected.

---

## Creating a New Skill

From within this repo:

```
/new-skill
```

Or manually:
1. Create `skills/my-skill/SKILL.md` — full playbook
2. Create `skills/my-skill/commands/my-skill.md` — slash command wrapper
3. Run `./install.sh` to pick it up globally

## Governance

Validate skill frontmatter:

```bash
npm run validate
```

Print the private/imported/public inventory across `skills/`, `wordpress/`, `shared/`, and `diagnostics/`:

```bash
npm run inventory
```

Fail if any scanned skill is missing governance metadata:

```bash
npm run inventory -- --check
```

Validate the community skill intake manifest:

```bash
npm run validate:community
```

Check skill `allowed-tools` references against the local Voyager MCP catalog:

```bash
npm run check:mcp-contracts
```

Current direction: consume community skills aggressively, publish Voyager skills selectively, and keep private execution in Voyager MCP. See `docs/voyager-ai-os-roadmap.md` and `docs/community-skill-intake.md`.

---

## Directory Structure

```
voyager-skills/
├── install.sh              ← symlinks slash commands globally
├── setup.sh                ← per-repo skills + client site scaffolding
├── templates/
│   ├── CLAUDE.md.template
│   └── .mcp.json.template
├── skills/                 ← agency ops (slash commands + SKILL.md)
├── wordpress/              ← per-repo dev skills (SKILL.md only)
├── shared/                 ← cross-type shared skills
├── diagnostics/            ← site analysis tools
└── examples/               ← wp-lab presets and examples
```

## License

MIT
