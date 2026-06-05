---
name: scaffold-client
description: "Use when asked to scaffold a new client site, create a client repo, set up a new client in GitHub, onboard a new client to the Voyager WordPress stack, or run the client site scaffold. Takes a slug and client name and produces a private GitHub repo forked from voyager-blank-child with CLAUDE.md placeholders filled, a local clone, and three linked Notion records (Client, Project, dispatch Task)."
argument-hint: "--slug <kebab-case> --name <\"Full Client Name\"> [--service-tier <Tier1|Tier2|Tier3|Build-Only>] [--domain <production-domain>] [--existing-client-id <notion-page-id>] [--local-path <path>] [--dry-run]"
user-invocable: true
owner: Ben
last_reviewed: 2026-06-05
---

# scaffold-client

GitHub + Notion bootstrap for a new Voyager client site. One command from "client signed" to: private GitHub repo forked from `voyager-blank-child`, CLAUDE.md and style.css placeholders filled, GitHub variables set, local clone ready for Laragon bootstrap, and three linked Notion records (Client, Project, dispatch Task).

**Scope:** GitHub + Notion side only. SpinupWP provisioning (Phase B.2) and Cloudflare DNS (Phase B.3) are separate steps in the SOP. After this skill runs, the operator follows the SpinupWP New Site Provisioning SOP manually.

---

## Parameters

| Flag | Required | Description |
|------|----------|-------------|
| `--slug` | Yes | Kebab-case client slug, e.g. `acme-construction`. Drives repo name (`<slug>-theme`), local clone path, DB name. |
| `--name` | Yes | Full client name in quotes, e.g. `"Acme Construction"`. Used in CLAUDE.md, style.css, Notion records. |
| `--service-tier` | No | `Tier1`, `Tier2`, `Tier3`, or `Build-Only`. Defaults to `Tier2`. Recorded in the Notion Project body. |
| `--domain` | No | Production domain, e.g. `acme-construction.com`. If omitted, staging-only path (`<slug>.voyager.website`). |
| `--existing-client-id` | No | Notion page URL or ID for an existing Client record. Use when the client was already a prospect. |
| `--local-path` | No | Override the clone path. Default: `F:\dev\voyager-clients\<slug>`. |
| `--dry-run` | No | Print the full plan with no side effects. Required for first-run testing. |

**Slug validation:** must match `^[a-z][a-z0-9-]{1,38}[a-z0-9]$` (3-40 chars, lowercase kebab, no leading/trailing dash, no slashes).

---

## Step 0: Parse inputs and set derived values

Resolve all values you'll need throughout the skill before taking any action:

```
SLUG         = <--slug value>
CLIENT_NAME  = <--name value>
SERVICE_TIER = <--service-tier, default "Tier2">
REPO_NAME    = <SLUG>-theme
REPO_URL     = https://github.com/voyager-marketing/<REPO_NAME>
LOCAL_PATH   = <--local-path, or F:\dev\voyager-clients\<SLUG>>
STAGING_URL  = https://<SLUG>.voyager.website
PROD_URL     = <--domain value, or "TBD">
DB_NAME      = <SLUG with dashes replaced by underscores>_local
```

If `--dry-run` is set, prefix every action below with `[DRY RUN]` and print the exact command or Notion payload that would run. Execute nothing.

---

## Step 1: Validate inputs and check preconditions

Run all checks before taking any action. Fail fast with a clear message on the first miss.

**Slug format:** confirm `SLUG` matches the pattern above.

**gh authentication and scope:**
```bash
gh auth status
```
Must show `voyager-marketing` org access with `repo` and `workflow` scopes. If not: `gh auth login --scopes repo,workflow`.

**Repo doesn't exist yet:**
```bash
gh repo view voyager-marketing/<REPO_NAME> 2>&1
```
Must return a 404 / "Could not resolve to a Repository". If it exists and `--dry-run` is not set, check whether this is a resume scenario (see Idempotency below) before erroring.

**Local path is clear:**
`LOCAL_PATH` must not exist or must be an empty directory.

**Notion MCP is available:**
Verify by fetching the Clients DB schema:
```
notion-fetch: collection://1e9bfa0d-34b6-4864-a693-9118c8f71033
```
If this fails, Notion MCP is not connected. Stop and ask the user to verify the MCP server.

**If `--existing-client-id` provided:** fetch that page and confirm it is a row in the Clients DB (`collection://1e9bfa0d-34b6-4864-a693-9118c8f71033`). Extract the page URL for use in Step 7.

Report all checks passed before continuing.

---

## Step 2: Create GitHub repo from template

```bash
gh repo create voyager-marketing/<REPO_NAME> \
  --template voyager-marketing/voyager-blank-child \
  --private \
  --description "Custom WordPress child theme for <CLIENT_NAME>. Built on the Voyager block theme."
```

GitHub's template fork is async. Poll until the repo has at least one commit:
```bash
# Poll up to 30s (6 × 5s)
for i in 1..6:
  gh repo view voyager-marketing/<REPO_NAME> --json pushedAt
  # if pushedAt is set, break
  sleep 5
```

If still empty after 30s, warn the user and proceed — the clone in Step 4 will catch the failure.

---

## Step 3: Set GitHub repo variables

These are placeholders the deploy workflow reads. Operator fills the TBD values after SpinupWP provisioning.

```bash
gh variable set THEME_SLUG         --body "<SLUG>"                       --repo voyager-marketing/<REPO_NAME>
gh variable set SPINUPWP_DOMAIN    --body "<STAGING_URL domain only>"    --repo voyager-marketing/<REPO_NAME>
gh variable set SPINUPWP_HOST      --body "TBD"                          --repo voyager-marketing/<REPO_NAME>
gh variable set SPINUPWP_USER      --body "TBD"                          --repo voyager-marketing/<REPO_NAME>
```

Do NOT set `SSH_DEPLOY_KEY` — that secret is generated and pasted by the operator during SpinupWP provisioning per the [SpinupWP New Site Provisioning SOP](https://www.notion.so/36e47c03778b819f9a0de7e148e4cd38).

---

## Step 4: Clone repo locally

```bash
git clone git@github.com:voyager-marketing/<REPO_NAME>.git "<LOCAL_PATH>"
```

If the clone fails (SSH key not configured for the org), fall back to HTTPS:
```bash
git clone https://github.com/voyager-marketing/<REPO_NAME>.git "<LOCAL_PATH>"
```

Confirm the clone contains `CLAUDE.md` and `style.css` before continuing.

---

## Step 5: Fill CLAUDE.md placeholders

Read `<LOCAL_PATH>/CLAUDE.md` and replace every placeholder token in-place. Notion URLs won't be known until Steps 7-9 — use `TBD` with a note if they aren't resolved yet. If Steps 7-9 complete first (in a dry-run plan they're printed in order), substitute the real URLs.

| Token | Replace with |
|-------|-------------|
| `{CLIENT_NAME}` | `CLIENT_NAME` |
| `{SLUG}` | `SLUG` |
| `{STAGING_URL}` | `STAGING_URL` |
| `{PRODUCTION_URL_OR_TBD}` | `PROD_URL` |
| `{NOTION_PROJECT_URL}` | Project page URL from Step 8 (or `TBD`) |
| `{NOTION_CLIENT_URL}` | Client page URL from Step 7 |
| `{SERVER_ID}` | `TBD` |
| `{SITE_ID}` | `TBD` |

Write the file back. Do not add or remove any other content.

---

## Step 6: Edit style.css header

In `<LOCAL_PATH>/style.css`, update only these fields inside the header comment block:

```
Theme Name:  <CLIENT_NAME> Theme
Text Domain: <SLUG>
Description: Custom WordPress child theme for <CLIENT_NAME>, built on the Voyager block theme.
Version:     0.1.0
```

Leave all other fields (`Theme URI`, `Author`, `Author URI`, `Template`, `Requires at least`, `Tested up to`, `Requires PHP`, `License`, `License URI`, `Tags`) untouched. Preserve everything below the closing `*/`.

Also update `functions.php`: replace the string `voyager-blank-child` with `<SLUG>` everywhere it appears as a text domain, function prefix, or constant name. Do a careful read first — do not rename PHP built-ins.

---

## Step 7: Resolve or create Notion Client record

**DB:** `collection://1e9bfa0d-34b6-4864-a693-9118c8f71033`

If `--existing-client-id` was provided: use that record. Fetch it, confirm the `Company` title matches `CLIENT_NAME` (warn if not, but don't block). Record its page URL as `CLIENT_NOTION_URL`.

If not provided: search the Clients DB for `CLIENT_NAME` first. Show any near-matches to the user and ask to confirm before creating. If none found, confirm once before creating:

```
notion-create-pages in collection://1e9bfa0d-34b6-4864-a693-9118c8f71033:
  Company (title): <CLIENT_NAME>
  Status: Active
  Services: ["Website", "Website Design"]
  Block Theme: __YES__
  Voyager Blocks: __YES__
  Voyager Orbit Installed: __YES__
  WP Publish Enabled: __YES__
  WP SEO Plugin: RankMath
```

Record the created page URL as `CLIENT_NOTION_URL`.

---

## Step 8: Create Notion Project record

**DB:** `collection://76ac613c-1b50-4d2e-a65e-891fac9c0879`

Confirm before creating:

```
notion-create-pages in collection://76ac613c-1b50-4d2e-a65e-891fac9c0879:
  Name (title): <CLIENT_NAME> Website Build
  Status: Onboarding
  Type: 🌐 Client Build
  Priority: P1
  Client Profile: [<CLIENT_NOTION_URL>]
  Repo: <REPO_URL>
  Development Site: <STAGING_URL>
```

Page body (insert_content after creation):
```markdown
## Build Brief

- **Service Tier:** <SERVICE_TIER>
- **GitHub Repo:** <REPO_URL>
- **Local Path:** <LOCAL_PATH>
- **Staging:** <STAGING_URL>
- **Production:** <PROD_URL>
- **Scaffolded by:** scaffold-client skill

## Next Steps

1. Run Laragon bootstrap: `powershell -ExecutionPolicy Bypass -File scripts\bootstrap-laragon.ps1 -Slug <SLUG>`
2. Provision SpinupWP site per [SpinupWP New Site Provisioning SOP](https://www.notion.so/36e47c03778b819f9a0de7e148e4cd38)
3. Set Cloudflare DNS per [Cloudflare DNS SOP](https://www.notion.so/34c47c03778b81549862e40549d44ae2)
4. After SpinupWP: fill GitHub vars SPINUPWP_HOST, SPINUPWP_USER, set SSH_DEPLOY_KEY secret
5. Push smoke commit; verify deploy workflow runs green
```

Record the created page URL as `PROJECT_NOTION_URL`.

Now go back and update the CLAUDE.md `{NOTION_PROJECT_URL}` token with `PROJECT_NOTION_URL` (re-edit the file if Steps 5-6 ran first).

---

## Step 9: Create Notion dispatch Task

**DB:** `collection://dab85f68-382b-49ef-853c-ea5a4e0e4805`

```
notion-create-pages in collection://dab85f68-382b-49ef-853c-ea5a4e0e4805:
  Name (title): Initial build for <CLIENT_NAME>
  Status: Up Next
  Type: 🔧 Dev
  Labels: ["dispatch", "client-facing"]
  Priority: P1
  Repo: <REPO_NAME>
```

Page body:
```markdown
Baseline build for <CLIENT_NAME>. Repo: <REPO_URL>.

## Kickoff checklist

- [ ] Bootstrap local env: `scripts\bootstrap-laragon.ps1 -Slug <SLUG>`
- [ ] Verify site loads at `http://<SLUG>.test/`
- [ ] Set brand tokens in `theme.json` (colors, fonts)
- [ ] Design intake complete
- [ ] Run `/mission` to pull next dispatch task from Notion
- [ ] Follow Block Site Build Baseline SOP: https://www.notion.so/36f47c03778b81279493cdc3a96f002f

## Links

- Notion Project: <PROJECT_NOTION_URL>
- Notion Client: <CLIENT_NOTION_URL>
- GitHub: <REPO_URL>
- Local: <LOCAL_PATH>
```

Record the created page URL as `TASK_NOTION_URL`.

---

## Step 10: Commit and push placeholder fills

```bash
cd "<LOCAL_PATH>"
git add CLAUDE.md style.css functions.php
git commit -m "Scaffold: fill template placeholders for <CLIENT_NAME>"
git push origin main
```

If the push fails due to no remote tracking branch, run `git push -u origin main`.

---

## Step 11: Print summary

```
✓ Scaffolded <CLIENT_NAME> (<SLUG>)

GitHub:          <REPO_URL>
Local:           <LOCAL_PATH>
Notion Client:   <CLIENT_NOTION_URL>
Notion Project:  <PROJECT_NOTION_URL>
Notion Task:     <TASK_NOTION_URL>

Next steps (in order):
  1. Bootstrap local:
       powershell -ExecutionPolicy Bypass -File "<LOCAL_PATH>\scripts\bootstrap-laragon.ps1" -Slug <SLUG>
  2. Provision SpinupWP:
       https://www.notion.so/36e47c03778b819f9a0de7e148e4cd38
  3. Cloudflare DNS:
       https://www.notion.so/34c47c03778b81549862e40549d44ae2
  4. After SpinupWP, set the TBD GitHub vars:
       gh variable set SPINUPWP_HOST --body "<value>" --repo voyager-marketing/<REPO_NAME>
       gh variable set SPINUPWP_USER --body "<value>" --repo voyager-marketing/<REPO_NAME>
       gh secret set SSH_DEPLOY_KEY --body "$(cat ~/.ssh/<SLUG>_deploy_key)" --repo voyager-marketing/<REPO_NAME>
  5. Push a smoke commit; verify deploy workflow runs green.
```

---

## Dry-run behavior

When `--dry-run` is set:
- Print `[DRY RUN]` before every step
- Show the exact `gh` commands that would run
- Show the full Notion record payloads (all properties and body content)
- Show the exact file diffs for CLAUDE.md and style.css
- Execute nothing — no GitHub API calls, no Notion writes, no file changes
- End with: `Dry run complete. Re-run without --dry-run to execute.`

---

## Idempotency

If re-run with the same slug after a partial failure, detect existing state rather than erroring:

- **Repo exists:** note it, skip Step 2, proceed from Step 3. Check if variables are already set and skip those individually.
- **Local clone exists and is non-empty:** skip Step 4. Check whether CLAUDE.md placeholders are still unfilled; if so, run Step 5 anyway.
- **Notion Client exists:** skip creation, use existing record.
- **Notion Project exists** (search by Name = `<CLIENT_NAME> Website Build`): skip creation, use existing.
- **Notion Task exists** (search by Name = `Initial build for <CLIENT_NAME>`): skip creation, use existing.

Print `(reused)` next to any item that was detected rather than created. Print `(created)` for new items.

---

## Rollback

If any step after Step 2 fails, the skill prints a rollback plan and stops. It does NOT auto-rollback.

```
Scaffold failed at Step <N>. What was done:
  ✓ GitHub repo created: <REPO_URL>
  ✓ Variables set: THEME_SLUG, SPINUPWP_DOMAIN
  ✗ Failed: <description>

To rollback:
  gh repo delete voyager-marketing/<REPO_NAME> --yes
  # Delete Notion records if created (URLs above)
  # Remove local clone: Remove-Item -Recurse -Force "<LOCAL_PATH>"

To retry from failure point: re-run with the same args (idempotency skips completed steps).
```

Partial states are often fine to keep — use judgment before deleting.

---

## Guardrails

- **Always confirm** before creating any Notion record. Show the full payload and ask once.
- **Never create a duplicate Client.** Search before creating. Show near-matches and ask the user to confirm it's a different entity.
- **Never overwrite an existing non-empty local path** without explicit user confirmation.
- **Dry-run is required** for first use with a real client. Do not skip it.
- **Do not install plugins or touch WP.** The Laragon bootstrap handles plugin installation. This skill's job is GitHub + Notion only.
- **Do not send the welcome email.** That's a separate step in [Client Onboarding](https://www.notion.so/34847c03778b815291c4f4f689b17737).
- **Note the onboard-client overlap.** `onboard-client` also creates a Notion Client record (Step 1). If scaffold-client already ran, skip `onboard-client` Steps 1-2 — the records exist. Run `onboard-client --verify-only` after SpinupWP provisioning to verify the WP stack.
