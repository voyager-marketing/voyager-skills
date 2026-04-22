# Automation

This repo has four moving parts beyond the skills themselves. Each closes a loop in the sync matrix from `CLAUDE.md` / the sync-to-claude-teams runbook.

| Piece | What it does | When it runs |
|---|---|---|
| `scripts/validate-skills.mjs` | Hard-gates every SKILL.md: YAML frontmatter, kebab-case name, owner, `last_reviewed`, description under 1024 chars. Warns on stale reviews (>90d) and missing use-trigger phrases. | On every PR and on push to main (`validate` workflow). Also locally via `npm run validate`. |
| `scripts/build-zips.mjs` | Builds `dist/org/<skill>.zip` + `dist/personal/<skill>.zip` with forward-slash paths so Claude.ai's upload validator accepts them. | Locally via `npm run build-zips`. Also on every push to main (`release` workflow) — zips uploaded as a workflow artifact. |
| `scripts/sync-to-notion.mjs` | Reads every SKILL.md's frontmatter, fetches the Skills DB in Notion, patches Description / Owner / Last reviewed / Repo path when the repo and DB diverge. Never touches human-curated fields (Surface, Lifecycle, Last eval, relations). | On every push to main (`release` workflow). Also manually: `NOTION_API_KEY=secret_xxx npm run sync-notion`. Add `--dry-run` to report diffs without patching. |
| `scripts/check-v1-skills-api.mjs` | Pings Anthropic's `/v1/skills` beta endpoint, records response shape, detects signals that Teams Org panel provisioning is now supported. | First of every month at 14:00 UTC (`api-check` workflow). Also manually via `workflow_dispatch`. |

## Required GitHub repo secrets

Set these in **Settings → Secrets and variables → Actions → New repository secret**. Workflows degrade gracefully when a secret is absent (they skip the relevant step and log why), so add them incrementally.

| Secret | Needed by | Where to get it |
|---|---|---|
| `NOTION_API_KEY` | `release` workflow (Notion sync) | Notion → Settings → Integrations → New internal integration → copy `secret_xxx`. Then open the **Skills** database page → `...` menu → Connections → Add the integration. |
| `SLACK_WEBHOOK_URL` | `release` workflow (changelog post) and `api-check` workflow | Slack → `#dev-agents` → Integrations → Add incoming webhook → copy the `https://hooks.slack.com/services/...` URL. |
| `ANTHROPIC_API_KEY` | `api-check` workflow | [console.anthropic.com](https://console.anthropic.com) → API Keys → Create Key. Scope it read-only to skills if that option exists. |

## Local development

```bash
npm install          # once
npm run validate     # validate every SKILL.md
npm run build-zips   # rebuild dist/
npm run sync-notion  # requires NOTION_API_KEY exported locally
```

The `dist/` folder is gitignored. `node_modules/` is too.

## Adding a new automated check

1. Drop a `.mjs` file under `scripts/`.
2. Add a matching script to `package.json`.
3. If it should run in CI, add a workflow under `.github/workflows/`.
4. If it needs secrets, update this doc's table.

## Failure modes

- **Validation fails on merge to main** — blocks the release workflow. Fix the offending SKILL.md and re-push.
- **Notion sync fails** — release workflow continues (zip artifact still uploaded), but the DB drifts. Check the Action log; most likely the integration lost access to the Skills DB (re-share it).
- **Slack post fails silently** — the step's `curl` is non-fatal. Check the Action log for the HTTP response. Most common cause: rotated webhook URL.
- **`/v1/skills` API check reports 401** — `ANTHROPIC_API_KEY` rotated or revoked. Regenerate.

## The eventual collapse

Once Anthropic's `/v1/skills` API supports Teams Org panel provisioning (tracked by the monthly cron), three things change:

1. `scripts/build-zips.mjs` gets a sibling `scripts/upload-to-panel.mjs` that hits `/v1/skills` directly.
2. The release workflow's manual step dissolves — merges to main auto-publish to the panel.
3. `docs/sync-to-claude-teams.md` is archived as a historical record.

Until then, the manual upload runbook stays the ceiling.
