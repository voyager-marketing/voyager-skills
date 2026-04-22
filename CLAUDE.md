# CLAUDE.md — voyager-skills

**Repo purpose.** Canonical source of truth for every Voyager skill that fires in Claude.ai Chat, Claude Code, or the Anthropic API. Every `SKILL.md` lives here. Any edit to a skill happens here first. Other surfaces are downstream copies.

**Surfaces fed by this repo:**
- **Claude.ai Teams Org panel** (Ben + Alex, Chat). Manual upload via Customize > Skills. See `docs/sync-to-claude-teams.md`.
- **Claude Code** (Ben, terminal). Auto-loaded from `~/.claude/skills/` after running `install.sh` once. Updates propagate on `git pull`.
- **Anthropic API** (Portal, automations). Can be uploaded via `POST /v1/skills` with `anthropic-beta: skills-2025-10-02`.

**Parent plan in Notion:** [🧠 Voyager Skills Hub](https://www.notion.so/34947c03778b81809600fa6da5bec8f2). This is where governance, lifecycle, and the full catalog live. If you're unsure what to do, read the Hub.

---

## How this repo connects to the rest of Voyager

```
Chat (plans)  →  Notion Tasks [dispatch]  →  Code (executes)
                      ↑                            ↓
              🔍 Discoveries page  ←─────  Stop hook writes back
                      ↑
              Chat reads before next plan
```

Code posts to `#dev-agents` (Slack channel ID `C0AFC9W3UGH`) at session end.

**Notion brain databases:**
- Projects: `collection://76ac613c-1b50-4d2e-a65e-891fac9c0879`
- Tasks: `collection://dab85f68-382b-49ef-853c-ea5a4e0e4805` (handoff label: `dispatch`)

---

## Repo structure

```
voyager-skills/
├── CLAUDE.md                          ← this file
├── README.md                          ← human-facing intro
├── CHANGELOG.md                       ← every skill change logged here
├── install.sh                         ← one-time setup: installs slash commands globally
├── setup.sh                           ← scaffolds new client/project directories
├── skills/                            ← every live SKILL.md lives here
│   ├── voyager-voice/
│   │   └── SKILL.md
│   ├── voyager-client-message/
│   │   └── SKILL.md
│   └── ... (one folder per skill)
├── archive/                           ← retired skills (kept 90 days, then deleted)
└── docs/
    ├── sync-to-claude-teams.md        ← manual upload runbook
    ├── eval-workflow.md               ← how to run skill-creator eval
    └── lifecycle.md                   ← Draft → Live → Deprecated → Retired
```

---

## The four rules

1. **One repo, one truth for content. One DB per catalog for metadata.** `voyager-marketing/voyager-skills/skills/<name>/SKILL.md` is canonical for skill content. `voyager-marketing/voyager-mcp-server/src/tools-*.ts` is canonical for MCP tool content. Notion hosts two databases as metadata indexes on top: **Skills** and **MCP Tools**, both children of the [Voyager Skills Hub](https://www.notion.so/34947c03778b81809600fa6da5bec8f2). The DBs never duplicate source — they store lifecycle, owner, relations, and point at GitHub. Never edit a `SKILL.md` outside this repo; never record metadata outside those DBs.

2. **Every skill has owner frontmatter.** Each `SKILL.md` YAML frontmatter must include `owner: Ben` or `owner: Alex` and `last_reviewed: YYYY-MM-DD`. Required for Live status. The Skills DB mirrors these as its `Owner` and `Last reviewed` columns.

3. **Four lifecycle states.** `Draft`, `Live`, `Deprecated`, `Retired`. Stored as the `Lifecycle` select in the Skills DB. Defined in `docs/lifecycle.md`.

4. **Eval is a hard gate.** No skill moves from Draft to Live without a passing `skill-creator` eval run. Eval results go in `CHANGELOG.md` here and in the `Last eval` column of the Skills DB. See `docs/eval-workflow.md`.

---

## Starting a session

If this session was handed off from Chat via `voyager-mission-write`, the first move is always:

```
/mission
```

This pulls dispatch tasks from Notion for the current project. Execute them in phase order. Read the project's 🔍 Discoveries & Session Notes first if it exists.

If there's no mission and you're working from an ad-hoc request, proceed normally but check `CHANGELOG.md` and the Notion Hub before touching any skill.

---

## Session fitness metric

How you know you're done:

1. All dispatch tasks for the current project are marked Done in Notion
2. `CHANGELOG.md` has a new entry summarizing what changed, with eval results for any skill that was modified
3. The repo is committed and pushed to `main`
4. `#dev-agents` Slack has a session summary post

---

## What to do when you change a skill

Every skill edit follows the same flow:

1. **Edit `skills/<name>/SKILL.md`** on a branch
2. **Update `last_reviewed:`** in the frontmatter to today's date
3. **Run `skill-creator` eval** against the edited skill (hard gate)
4. **Write a `CHANGELOG.md` entry** with skill name, what changed, why, eval results, date
5. **Commit, push, open PR** (or merge directly if single-file low-risk change)
6. **Flag Ben if upload to Claude.ai Org panel is needed** (manual step per `docs/sync-to-claude-teams.md`)

---

## What NOT to do

- **Don't edit skills outside this repo.** Not in `~/.claude/skills/`, not in the Claude.ai UI, not in `voyager-portal/.agents/skills/`. If a Portal skill needs updating, raise it in Discoveries. Different repo, different scope.
- **Don't skip the eval gate.** Hard rule. No exceptions. If `skill-creator` isn't available, install it from `/mnt/skills/examples/skill-creator/` or stop and flag.
- **Don't retire a Live skill without a replacement proven.** The parallel-run pattern: new skill uploaded, two-week verification, then retire the old one. Human decision, not Code's.
- **Don't create more Notion databases for skills or MCP tools.** Two already exist as children of the Hub — **Skills** and **MCP Tools**. Everything that belongs in a catalog goes in one of them. No per-client, per-project, or per-category skills DBs.
- **Don't touch `voyager-portal/.agents/skills/`.** That's Portal dev skills, separate governance.
- **Don't paste `SKILL.md` bodies into Notion pages.** Notion references GitHub. GitHub is source of truth.

---

## Install & sync commands

**One-time setup on a new machine:**
```bash
git clone https://github.com/voyager-marketing/voyager-skills.git ~/code/voyager-skills
cd ~/code/voyager-skills
./install.sh
```

**Updating existing install:**
```bash
cd ~/code/voyager-skills
git pull
```
Changes take effect on next Claude Code session. No restart needed unless a brand-new top-level directory was added.

**Scaffold a new client server:**
```bash
./setup.sh /sites/client.com --type client-site \
  --domain client.com --name "Client Name" \
  --wp-root /sites/client.com/files/ --db-prefix tgn_
```

**Sync to Claude.ai Teams Org panel:**
See `docs/sync-to-claude-teams.md`. Manual process for now (no admin API supports this). Weekly cadence, or same-day if the change affects Alex's daily rotation.

---

## Skill ownership split

**Ben-owned (Personal + infrastructure):**
- `mission`, `voyager-mission-write`, `voyager-feature-spec`, `voyager-new-software-project`, `skill-creator`
- All Portal dev skills (live in `voyager-portal/.agents/skills/`, not this repo)

**Shared / Org-wide (Ben + Alex):**
- `voyager-voice`, `voyager-client-message`, `voyager-cold-email`
- `voyager-operating-principles`, `voyager-seo-approach`, `voyager-team-context`
- `project-knowledge-audit`, `project-splitter`
- Content pipeline skills (as they come online): `content-brief`, `content-strategy`, `editorial-qa`, `publish`, `social-repurpose`, `content-tracker`
- Client ops skills (as they come online): `client-prep`, `onboard-client`, `prospect-audit`, `fleet-health`, `pattern-cloud`

**Being run in parallel with replacements (do NOT retire yet):**
- `voyager-wp-manager` → replacement: `fleet-health` + `pattern-cloud`
- `voyager-prep-for-client` → replacement: `client-prep`
- `voyager-client-onboarding` → replacement: `onboard-client`
- `voyager-client-context-check` → replacement: `client-prep`

---

## Writing style

When editing SKILL.md content, follow the Voyager voice rules. They're defined in `skills/voyager-voice/SKILL.md`. Short version:

- No em dashes, ever. Use periods, commas, parentheses, or colons.
- No corporate filler, no stacked qualifiers, no hedging phrases.
- Direct, plain, concise prose.
- Write to Ben or Alex, not to a generic user.

---

## References

- [🧠 Voyager Skills Hub](https://www.notion.so/34947c03778b81809600fa6da5bec8f2) (Notion, governance + catalog)
- [Voyager Ecosystem Map](https://www.notion.so/33b47c03778b8104be2cc4e0167bb5e4) (agency-wide system map)
- [Claude Tooling Directory](https://www.notion.so/33d47c03778b8153a56edb2e75634ee1) (broader than skills)
- [Anthropic Skills Guide](https://platform.claude.com/docs/en/build-with-claude/skills-guide) (API reference)
- [skill-creator](/mnt/skills/examples/skill-creator/SKILL.md) (meta-skill for building and evaluating skills)