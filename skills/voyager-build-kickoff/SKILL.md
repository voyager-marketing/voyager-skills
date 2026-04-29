---
name: voyager-build-kickoff
description: Use when provisioning the Voyager dev environment for a Path A (new build) client who already has a Clients DB row. Creates SpinupWP site at [slug].voyager.website on the shared Voyager Dev server, adds Cloudflare DNS, installs Voyager plugin stack and block theme, waits for Orbit to auto-register with Portal, stashes the Orbit secret on the Websites DB row, and flips Clients DB infra flags. Trigger phrases include "run build kickoff for [name]", "provision dev site for [name]", "build kickoff [name]", "/build-kickoff [name]". Halts if the client has no Clients DB row, is not Path A, or already has a Websites DB row. Do NOT use for launch activities (domain delegation, GA4, GSC, kickoff email, care plan upsell) or existing-site takeovers (Path B, use voyager-site-dna).
owner: Ben
last_reviewed: 2026-04-29
---

# Voyager Build Kickoff

Day 1 infra provisioning for a Path A client. Spins up a Voyager-standard dev site on the shared Voyager Dev SpinupWP server, wires it to Portal via Orbit self-registration, and hands off a ready-to-design environment. Runs after `voyager-client-intake` has created the Clients DB row and confirmed Path A.

Time to complete. Roughly 10 to 15 minutes end-to-end (DNS propagation + site provision + plugin install + theme install + Orbit registration + HTTPS verify).

Scope. Dev environment only. Launch activities (domain delegation, GA4, GSC, kickoff email, Stripe care plan upsell) fire later via a separate launch skill.

Verified live against `melody-magic-site.voyager.website` on 2026-04-22.

---

## Phase 0. Session prep (runs once per session)

Silently. Cache results.

### 0.0 Load required tools

- **Notion MCP**. Should be loaded. If not, `tool_search` query `"Notion page database"`.
- **SpinupWP API**. Accessed via `curl` with `SPINUPWP_API_KEY` env var. No MCP. No CLI on the server.
- **Cloudflare API**. Accessed via `curl` with `CLOUDFLARE_API_TOKEN` env var. No MCP.
- **GitHub CLI**. `gh auth status` must succeed. Used for release downloads AND git-tag tarball downloads.
- **SSH**. Required to install plugins / theme on the provisioned site. Pattern: `ssh -i ~/.ssh/id_rsa benw@<server_ip>`. The sudo password for `benw` on the Voyager Dev server lives on that server's Notion Servers row (`Password` field); read it once per session and never log it.

Halt if any are missing. Report which and surface remediation.

### 0.1 Env var check

| Var | Purpose | Required scope |
|---|---|---|
| `SPINUPWP_API_KEY` | SpinupWP site provisioning | Read/write |
| `CLOUDFLARE_API_TOKEN` | DNS record creation on voyager.website zone | **`Zone.DNS:Edit`** on voyager.website (Read-only tokens and Global API Key tokens both fail the POST — check perms via `GET /client/v4/zones?name=voyager.website` and confirm `#dns_records:edit` is in the response) |

Private plugin + theme downloads use `gh` CLI auth (already checked in Phase 0.0) — no separate PAT needed.

Portal registration is initiated by Orbit itself on plugin activation, not by this skill. No `PORTAL_API_KEY` required.

Storage. Use `.claude/settings.local.json` `env` block (gitignored, loaded by Claude Code on startup). NEVER commit these to `.claude/settings.json`. If this shell doesn't see them (variables were set with `setx` or added to `settings.local.json` mid-session), restart Claude Code before running.

### 0.2 Fetch Notion schemas (parallel)

- Clients DB. `collection://1e9bfa0d-34b6-4864-a693-9118c8f71033`
- Websites DB data source. `collection://f12cc677-9dd3-499d-b23e-9c7873c5620f`
- Servers DB data source. `collection://21e21904-2f4b-4cc9-a314-5ef68ed6cf32`

Confirm the properties below exist. Halt if any are missing.

**Clients DB required properties:**
- `Company` (title)
- `Status` (single-select)
- `WP Publish Enabled` (select, values `__YES__`/`__NO__`)
- `Voyager Orbit Installed` (checkbox)
- `Block Theme` (checkbox)
- `Voyager Blocks` (checkbox)
- `Websites` (relation to Websites DB)

Path A is inferred from state: `WP Publish Enabled = __YES__` OR `Services` contains `Website` or `MWP`, plus empty `Websites` relation and unchecked `Voyager Orbit Installed`. No `Path` property is read or written.

**Websites DB properties used** (confirmed live in Notion):
- `Domain` (title)
- `userDefined:URL` (URL field, displayed as "URL")
- `Stage` (select, value `Dev` used here)
- `Status` (select, value `In Progress` during provisioning, `Active` on success, `Needs Review` on failure)
- `Orbit Secret` (text, 64-char HMAC key — written after Orbit self-registers)
- `SpinupWP Site ID` (text, numeric site ID from SpinupWP)
- `Server` (relation to Servers DB — IP Address and Hosting come as rollups)
- `Company` (relation to Clients DB — bidirectional, auto-fills Clients.Websites)
- `Prefix` (text — SpinupWP auto-generates a random 3-char prefix like `4kq_`)
- `System User`, `WP User`, `WP Password`, `DB Name`, `DB User`, `DB Password` (text — stash provision-time credentials)

**Servers DB properties used:**
- `Name` (title), `IP Address`, `Host` (select: `SpinupWP`), `Datacenter` (select: `NYC3`), `Status` (select: `Active`), `Password` (text — sudo password for SSH)

### 0.3 Resolve shared Voyager Dev server

All dev sites run on the shared **Voyager Dev** SpinupWP server.

Hardcoded:
- Notion page. `https://www.notion.so/22893507c65f431ca4e3a08e8ceffab6`
- Server Notion ID. `22893507-c65f-431c-a4e3-a08e8ceffab6`
- IP Address. `159.65.174.126`
- Host. SpinupWP, Datacenter. NYC3
- SpinupWP numeric server ID. `16035`

Resolution flow:
1. If `--server-notion-id=<id>` passed, fetch that Server row; use its IP and SpinupWP ID lookup.
2. Otherwise, fetch the Voyager Dev server by hardcoded Notion ID. Verify `Status = Active` and `Host = SpinupWP`. If not, halt.
3. Confirm `spinupwp_server_id = 16035` by calling `GET https://api.spinupwp.app/v1/servers` and matching `ip_address = 159.65.174.126`. If no match, halt ("Notion IP stale — Servers DB row needs update").
4. Read the sudo password from the Server row's `Password` field. Cache in memory for the session only.

---

## Phase 1. Resolve + gate

### Step 1 — Resolve Clients row

Input priority:
1. `--clients-db-url=<id>` if passed (direct handoff from intake).
2. Positional `<business_name>`. Query Clients DB by `Company` (case-insensitive, trimmed).

If zero matches, halt. "No Clients row for [name]. Run `voyager-client-intake` first."
If multiple, ask user to pick.

Capture `clients_db_url`, `clients_db_id`, `business_name`.

### Step 2 — Gate checks (Path A inferred from state)

All must pass. Halt on first failure with specific reason.

- `Status` = `Active`.
- **At least one build signal.** Either `WP Publish Enabled = __YES__` OR `Services` contains `Website` or `MWP`. If neither, halt (probably Path C or data issue).
- `Websites` relation is empty. If populated, halt (Path B takeover or already built — different skill).
- `Voyager Orbit Installed` = unchecked. If checked, halt ("Client already provisioned").

If `WP Publish Enabled = __NO__` but `Services` includes `Website`/`MWP`, proceed; flip the flag as part of Phase 5. This handles Clients rows created before `voyager-client-intake` was live.

### Step 3 — Determine slug

- Slug. Default `slugify(business_name)` (kebab-case, no special chars).
- If `--slug=<kebab>` passed, use that.
- Validate: query Websites DB for `Domain = [slug].voyager.website`. Halt if taken.
- Verify site_user: for SpinupWP, derive a no-dash version (e.g. `melody-magic-site` → `melodymagicsite`). Max 32 chars. If over, truncate or derive differently.

### Step 4 — Pre-flight confirmation

Show the plan (phases to run, expected URLs, server to use). Options: `Run it` / `Change slug` / `Cancel`.

---

## Phase 2. Provision infrastructure

DNS precedes site creation because SpinupWP's `https: {enabled: true}` in the site-create payload only works if DNS is already visible to Let's Encrypt at provision time.

### Step 5 — Create Websites DB row (In Progress state)

Use template `5e7cf74e-6103-45eb-a12b-26c50305e9cb` ("New voyager.website site") on Websites DB data source `f12cc677-9dd3-499d-b23e-9c7873c5620f`.

Override properties:
- `Domain` = `[slug].voyager.website`
- `userDefined:URL` = `https://[slug].voyager.website`
- `Stage` = `Dev`
- `Status` = `In Progress`
- `Server` = relation to Voyager Dev (`22893507-c65f-431c-a4e3-a08e8ceffab6`)
- `Company` = relation to Clients row
- `Prefix` = `wp_` (will be overwritten with SpinupWP-generated prefix after site create)

Capture `website_db_url`, `website_db_id`.

### Step 6 — Cloudflare DNS

Zone. `voyager.website`, zone ID `5ed6cffac6ab37ff6da397fc2818fd7c` (cache per session).

```
POST https://api.cloudflare.com/client/v4/zones/5ed6cffac6ab37ff6da397fc2818fd7c/dns_records
  Authorization: Bearer $CLOUDFLARE_API_TOKEN
  {
    "type": "A",
    "name": "[slug]",
    "content": "159.65.174.126",
    "ttl": 300,
    "proxied": false
  }
```

Capture `cloudflare_record_id`. If POST returns 401/403 "Authentication error", the token lacks `Zone.DNS:Edit` — halt with remediation.

### Step 6b — Wait for DNS propagation

Poll via `nslookup <domain> 1.1.1.1` (NOT `dig` — not available on Windows git bash). Every 5 seconds, accept when Address matches `159.65.174.126`. Timeout 180s.

Alternative poller: Node's `dns.promises.resolve4()` with `dns.setServers(['1.1.1.1'])`.

If not propagated in 180s, continue anyway but flag that HTTPS may not enable at site creation (SpinupWP re-checks DNS internally; Let's Encrypt needs it visible).

### Step 7 — SpinupWP site provision

```
POST https://api.spinupwp.app/v1/sites
  Authorization: Bearer $SPINUPWP_API_KEY
  Content-Type: application/json
```

Payload (schema confirmed via `f:\dev\voyager\voyager-report\trigger\spinupwp-site-creation.ts`):

```json
{
  "server_id": 16035,
  "domain": "[slug].voyager.website",
  "site_user": "[slug-no-dashes]",
  "installation_method": "wp",
  "php_version": "8.2",
  "public_folder": "/",
  "page_cache": {"enabled": false},
  "https": {"enabled": true},
  "database": {
    "name": "[slug_no_dashes]_wp",
    "username": "[slug_no_dashes]_wp",
    "password": "<generated 32-char>"
  },
  "wordpress": {
    "title": "[business_name]",
    "admin_user": "voyager_admin",
    "admin_email": "sites@voyagermark.com",
    "admin_password": "<generated 32-char>"
  }
}
```

Note. NOT `wp.*` — the nested key is `wordpress`, not `wp`. NOT `db.user` — it's `database.username`. NOT `ssl.enabled` — HTTPS control is via `https.enabled` at creation only (see known issue below).

Generate passwords with `require('crypto').randomBytes(24).toString('base64').replace(/[+/=]/g,'').slice(0,32)`.

Capture `site_id`, `event_id` from response.

### Step 7b — Poll event + verify HTTPS

Poll `GET https://api.spinupwp.app/v1/events/[event_id]` every 30 seconds. **Terminal success status is `deployed`, NOT `completed`.** Fail on `failed`. Timeout 20 minutes (HTTPS cert install adds time).

When status reaches `deployed`, fetch `GET https://api.spinupwp.app/v1/sites/[site_id]` and check:
- `status: deployed`
- `https.enabled: true`
- `database.table_prefix` = auto-generated 3-char prefix (e.g. `4kq_`) — capture for the Websites row

**Known SpinupWP bug**: if DNS wasn't visible to SpinupWP at the moment of site creation (even if visible elsewhere), SpinupWP silently drops `https.enabled` to `false`. No post-creation API endpoint enables it (`/v1/sites/{id}/https` only accepts `type=custom`; no Let's Encrypt value works). If `https.enabled: false` after deploy:

1. Halt skill execution.
2. Output: "HTTPS not enabled during site creation. Click 'Install Let's Encrypt certificate' on https://dashboard.spinupwp.com/sites/[site_id] then say 'continue'."
3. On resume, verify `https.enabled: true` and `curl -I https://[domain]/` returns 200 with a valid Let's Encrypt cert (issuer contains `Let's Encrypt`).

### Step 7c — Update Websites row with infra details

```
SpinupWP Site ID: [site_id]
Prefix: [table_prefix]
WP User: voyager_admin
WP Password: [admin_password]
DB Name: [database.name]
DB User: [database.username]
DB Password: [database.password]
System User: [site_user]
```

---

## Phase 3. Install plugin stack + theme

All installs via SSH + WP-CLI. SpinupWP's API exposes no WP-CLI or plugin-management endpoints (`/v1/sites/{id}/plugins` returns 404).

**SSH pattern** (used throughout Phase 3 and beyond):
```bash
ssh -i ~/.ssh/id_rsa -o StrictHostKeyChecking=no benw@159.65.174.126 "<command>"

# For WP-CLI as the site user (sudo is NOT NOPASSWD):
echo "$SUDO_PASSWORD" | sudo -S -u [site_user] wp --path=/sites/[domain]/files <wp-cli-command>
```

SSH as `melodymagicsite` (site user) fails with `Permission denied (publickey)` since site users don't have our key in their authorized_keys by default. Always SSH as `benw`, then `sudo -u [site_user]` for WP-CLI.

**CLIENT.md write pattern** (applies here and Phase 5): write to `/tmp/` first, then `sudo mv` into place. Don't combine `echo "$PW" | sudo -S tee <target> <<'EOF'...EOF` — the heredoc attaches to `tee`, not sudo, so the password doesn't reach stdin.

### Step 8 — Download plugin + theme assets locally

Release sources (corrected vs. prior SKILL.md — several were wrong):

| Plugin | Source | Install format |
|---|---|---|
| voyager-orbit | `gh release download --repo voyager-marketing/voyager-orbit --pattern "*.zip"` | Release zip |
| voyager-core | `gh release download --repo voyager-marketing/voyager-core --pattern "*.zip"` | Release zip |
| voyager-blocks | `gh api repos/voyager-marketing/voyager-blocks/tarball/v1.0.0 > voyager-blocks-v1.0.0.tar.gz` | **Source tarball — release zip is broken (missing `src/` dir)** |
| abilities-api | `gh release download --repo WordPress/abilities-api --pattern "abilities-api.zip"` | Release zip (WordPress org, not voyager-marketing) |
| mcp-adapter | `gh release download --repo WordPress/mcp-adapter --pattern "mcp-adapter.zip"` | Release zip (WordPress org) |
| wordpress-mcp | `gh release download --repo Automattic/wordpress-mcp --pattern "wordpress-mcp.zip"` | Release zip (Automattic, not Voyager — and not "wp-ai-client", which doesn't exist) |
| Rank Math SEO | WP.org | Install via `wp plugin install seo-by-rank-math` on site |
| voyager-block-theme | `gh api repos/voyager-marketing/voyager-block-theme/tarball/v2.0.1 > voyager-block-theme-v2.0.1.tar.gz` | **Source tarball — no GitHub releases, only git tags** |

Download in parallel (bash `&`, then `wait`). Verify file sizes > 0. Stage in `/tmp/kickoff-<slug>/` locally.

### Step 9 — Upload to server

```bash
scp -i ~/.ssh/id_rsa \
  voyager-orbit.zip voyager-core.zip \
  abilities-api.zip mcp-adapter.zip wordpress-mcp.zip \
  voyager-blocks-v1.0.0.tar.gz \
  voyager-block-theme-v2.0.1.tar.gz \
  benw@159.65.174.126:/tmp/
```

### Step 10 — Install plugins via WP-CLI

Install order (Orbit **LAST** — its activation triggers Portal registration, which expects the rest of the stack already present):

```bash
SITE_PATH="/sites/[domain]/files"

# voyager-core first (simplest, no deps)
echo "$SUDO_PASSWORD" | sudo -S -u [site_user] wp --path="$SITE_PATH" plugin install /tmp/voyager-core.zip --activate

# abilities-api + mcp-adapter + wordpress-mcp (framework plugins)
echo "$SUDO_PASSWORD" | sudo -S -u [site_user] wp --path="$SITE_PATH" plugin install /tmp/abilities-api.zip --activate
echo "$SUDO_PASSWORD" | sudo -S -u [site_user] wp --path="$SITE_PATH" plugin install /tmp/mcp-adapter.zip --activate
echo "$SUDO_PASSWORD" | sudo -S -u [site_user] wp --path="$SITE_PATH" plugin install /tmp/wordpress-mcp.zip --activate

# voyager-blocks via source tarball (release zip broken — see Step 8 table)
ssh -i ~/.ssh/id_rsa benw@159.65.174.126 bash <<EOF
  cd /tmp && rm -rf vblocks-prep && mkdir vblocks-prep && cd vblocks-prep
  tar -xzf /tmp/voyager-blocks-v1.0.0.tar.gz
  EXTRACTED=\$(ls -d */ | head -1 | tr -d '/')
  mv "\$EXTRACTED" voyager-blocks
  echo "$SUDO_PASSWORD" | sudo -S rm -rf "$SITE_PATH/wp-content/plugins/voyager-blocks"
  echo "$SUDO_PASSWORD" | sudo -S mv voyager-blocks "$SITE_PATH/wp-content/plugins/"
  echo "$SUDO_PASSWORD" | sudo -S chown -R [site_user]:[site_user] "$SITE_PATH/wp-content/plugins/voyager-blocks"
  echo "$SUDO_PASSWORD" | sudo -S -u [site_user] wp --path="$SITE_PATH" plugin activate voyager-blocks
EOF

# Rank Math from WP.org
echo "$SUDO_PASSWORD" | sudo -S -u [site_user] wp --path="$SITE_PATH" plugin install seo-by-rank-math --activate

# Orbit LAST (triggers Portal registration)
echo "$SUDO_PASSWORD" | sudo -S -u [site_user] wp --path="$SITE_PATH" plugin install /tmp/voyager-orbit.zip --activate
```

Verify all 7 active plus SpinupWP defaults (`spinupwp`, `limit-login-attempts-reloaded`):
```bash
echo "$SUDO_PASSWORD" | sudo -S -u [site_user] wp --path="$SITE_PATH" plugin list --status=active --format=csv
```

**Known non-fatal warnings** (do NOT fail the run on these):
- `voyager-core`: `include(): Failed opening '.../vendor/composer/../../src/Updater/GitHubUpdater.php'` — composer autoload miss. Plugin still works.
- `voyager-orbit`: `Deprecated: ...canReadRest(): Implicitly marking parameter $request as nullable` — PHP 8.4 deprecation.
- Multiple `WP_Ability::__construct ... Property "_voyager_sanitizer_wrapped" is not a valid property` — WP 6.9.0 tightened property validation. Orbit/blocks declare a property that isn't in the allowed set. Non-fatal noise until Orbit/blocks are updated.

### Step 11 — Install theme

Theme release zip doesn't exist (no GitHub releases). Use source tarball at latest git tag. `zip` is not installed on the SpinupWP server, so **don't re-zip** — directly move the extracted dir into `wp-content/themes/`.

```bash
ssh -i ~/.ssh/id_rsa benw@159.65.174.126 bash <<EOF
  cd /tmp && rm -rf theme-prep && mkdir theme-prep && cd theme-prep
  tar -xzf /tmp/voyager-block-theme-v2.0.1.tar.gz
  EXTRACTED=\$(ls -d */ | head -1 | tr -d '/')
  mv "\$EXTRACTED" voyager-block-theme
  echo "$SUDO_PASSWORD" | sudo -S mv voyager-block-theme "$SITE_PATH/wp-content/themes/"
  echo "$SUDO_PASSWORD" | sudo -S chown -R [site_user]:[site_user] "$SITE_PATH/wp-content/themes/voyager-block-theme"
  echo "$SUDO_PASSWORD" | sudo -S -u [site_user] wp --path="$SITE_PATH" theme activate voyager-block-theme
EOF
```

Verify: `wp theme list --status=active` shows `voyager-block-theme` active.

---

## Phase 4. Verify Orbit registration + capture secret

Orbit generates its site_secret (64-char hex) and POSTs to Portal on first activation. Portal verifies via callback to `https://[domain]/wp-json/voyager/v1/verify`. **Callback URL must be HTTPS** — Portal rejects HTTP with "Callback URL must use HTTPS in production" (HTTP 400).

Portal endpoint (Orbit's default): `https://app.voyagermark.com/api/sites/register` (public, no auth — SSRF-protected + rate-limited). **NOT** `https://app.voyagermark.com/api/wp-manager/sites/register` (staff-only, Clerk-gated, returns 401 Unauthorized without valid session). **NOT** `portal.voyagermark.com` (doesn't resolve).

Orbit's request schema (what it sends):
```json
{
  "domain": "...",
  "site_url": "...",
  "site_secret": "...64 hex chars...",
  "callback_url": "https://.../wp-json/voyager/v1/verify",
  "metadata": {"wp_version": "...", "plugin_version": "...", "php_version": "...", "site_name": "..."}
}
```

Portal's `/api/sites/register` schema matches exactly (`domain` key, not `site_id`).

### Step 12 — Poll registration status

```bash
echo "$SUDO_PASSWORD" | sudo -S -u [site_user] wp --path="$SITE_PATH" option get voyager_registration_status
```

Expected values: `none`, `pending`, `active`, `failed`. Poll every 5s, timeout 60s. Success: `active`.

If `failed`, debug via direct retry:
```bash
echo "$SUDO_PASSWORD" | sudo -S -u [site_user] wp --path="$SITE_PATH" eval '
  $s = new \Voyager\Orbit\Auth\RegistrationService();
  $r = $s->attemptRegistration();
  echo "status: " . $r["status"] . "\n";
  echo "message: " . $r["message"] . "\n";
'
```

Common failure causes:
- **"HTTP error: 400" + Portal returned "Callback URL must use HTTPS in production"** → HTTPS isn't actually live on the site. Verify Phase 2 Step 7b completed and SSL cert issued. If missing, pause for manual SSL enable, then reset and retry:
  ```bash
  echo "$SUDO_PASSWORD" | sudo -S -u [site_user] wp --path="$SITE_PATH" option update voyager_registration_retries 0
  echo "$SUDO_PASSWORD" | sudo -S -u [site_user] wp --path="$SITE_PATH" option update voyager_registration_status none
  # then call RegistrationService::attemptRegistration() as above
  ```
- **DNS unreachable from Portal's side** → Portal's verify-callback can't hit the site. Check Cloudflare WAF or firewall rules.

### Step 13 — Capture secret to Notion

```bash
SECRET=$(ssh ... "sudo -S -u [site_user] wp --path=$SITE_PATH option get voyager_site_secret")
```

64 chars expected. Write to Notion Websites row `Orbit Secret` field via Notion MCP. Never log or echo to the main output.

Also update Websites row:
- `Status` = `Active`
- `date:Website Launched:start` = today (ISO)
- `date:Website Launched:is_datetime` = 0

---

## Phase 5. Finalize

### Step 14 — Update Clients DB

```json
{
  "Voyager Orbit Installed": "__YES__",
  "Block Theme": "__YES__",
  "Voyager Blocks": "__YES__"
}
```

Plus, if we auto-flipped from `__NO__` in Phase 1 (Services-based Path A detection):
```json
{"WP Publish Enabled": "__YES__"}
```

The `Websites` relation auto-populates bidirectionally from the Websites row's `Company` relation set in Phase 2 Step 5 — no explicit update needed.

### Step 15 — Write CLIENT.md on server

Write to `/tmp/CLIENT.md` as `benw` (heredoc is safe here, no sudo), then `sudo mv` into `/sites/[domain]/CLIENT.md` and `sudo chown` to `[site_user]:[site_user]`.

Content (substitute vars):
```md
# [business_name]

Voyager-managed development site. Provisioned [date] by voyager-build-kickoff.

## URLs
- Staging: https://[slug].voyager.website
- WP Admin: https://[slug].voyager.website/wp-admin

## Notion
- Clients: [clients_db_url]
- Websites: [website_db_url]

## Infrastructure
- SpinupWP server #[spinupwp_server_id] ([server_name], [server_ip])
- SpinupWP site #[spinupwp_site_id]
- Site user: [site_user]
- Cloudflare DNS: record [cloudflare_record_id]
- SSL: Let's Encrypt

## Plugin stack (active)
- voyager-orbit, voyager-core, voyager-blocks, voyager-block-theme, abilities-api, mcp-adapter, wordpress-mcp, seo-by-rank-math, plus SpinupWP defaults

## Portal registration
- Status: active (registered [timestamp] UTC)
- Portal URL: https://app.voyagermark.com
- Site ID: [domain]
- Secret: stored on Websites Notion row (Orbit Secret field)

## What's next (not done by build-kickoff)
- Brand tokens → manual for now
- Site data (phone, email, address, hours, social) → "provision site data for [business_name]"
- Content Cycle + content items
- Welcome email → voyager-client-message
- Launch activities (domain delegation, GA4, GSC, Stripe care plan) → voyager-site-launch (TBD)
```

### Step 16 — Final summary + JSON

Human-facing summary in chat with all URLs, IDs, next-steps list.

stdout JSON for programmatic consumers:

```json
{
  "exit_code": 0,
  "business_name": "...",
  "clients_db_url": "...",
  "website_db_url": "...",
  "staging_url": "https://[slug].voyager.website",
  "wp_admin_url": "https://[slug].voyager.website/wp-admin",
  "spinupwp_server_id": 16035,
  "spinupwp_site_id": 0,
  "cloudflare_record_id": "...",
  "server_ip": "159.65.174.126",
  "orbit_registration_status": "active",
  "orbit_registered_at": "..."
}
```

---

## Error handling

All failures update Websites row `Status = Needs Review` and exit 1 with a resume hint.

| Phase | Failure | Websites Status | Resume hint |
|---|---|---|---|
| 0.1 | Cloudflare token lacks `Zone.DNS:Edit` | not set | Generate token from "Edit zone DNS" template, restart |
| 0.2 | Clients or Websites DB schema drift | not set | Fix Notion schema |
| 0.3 | Voyager Dev server not Active or IP mismatch | not set | Fix Servers DB, pass `--server-notion-id=<id>` |
| 1 | Gate check fails | not set | Fix Clients row first |
| 2 Step 5 | Websites row create fails | n/a | `--phase=5` |
| 2 Step 6 | Cloudflare 401/403 | n/a | Check token scope. `--phase=6` |
| 2 Step 6b | DNS not propagated in 180s | `Needs Review` | Wait longer, manual nslookup check. `--phase=7` |
| 2 Step 7 | SpinupWP site POST fails | `Needs Review` | Fix payload, `--phase=7` |
| 2 Step 7b | Event status = `failed` | `Needs Review` | Check event output, `--phase=7` |
| 2 Step 7b | Site deployed but `https.enabled: false` | `In Progress` | **Manual**: click "Install Let's Encrypt certificate" in SpinupWP dashboard, then `continue` |
| 3 Step 10 | voyager-blocks fatal (missing src/) | `Needs Review` | Expected — skill should already use source tarball. If still failing, check repo |
| 3 Step 10 | Other plugin install fails | `Needs Review` | `--phase=10` |
| 3 Step 11 | Theme install/activate fails | `Needs Review` | `--phase=11` |
| 4 Step 12 | Orbit registration stuck `pending` > 5min | `Needs Review` | Check Portal reachability from site. `--phase=12` |
| 4 Step 12 | Orbit registration `failed` + "HTTPS required" | `Needs Review` | Verify HTTPS live, reset retries, retry via `RegistrationService::attemptRegistration()` |
| 4 Step 13 | Secret read fails | `Needs Review` | `--phase=13` |

On mid-run failure, the partial Websites row stays with `Status = Needs Review`. Resume re-runs only the named phase onward, reading the Websites row for already-captured IDs.

---

## What this skill does NOT do

- Draft welcome email → `voyager-client-message`
- Configure brand tokens → manual for now (pending Orbit ability release)
- Scaffold core pages → pending `voyager-orbit/scaffold-core-pages` ability
- Configure Rank Math baseline, GA4, GSC → launch-time skill (TBD: `voyager-site-launch`)
- Domain delegation → launch-time, Alex's manual SOP
- Stripe care plan upsell → launch-time, `voyager-stripe-subscribe`
- Site data provisioning (phone, email, address, hours, social) → `voyager-orbit/provision-site-data` ability, handed off post-run
- Pattern Cloud sync → pending, separate skill
- GitHub child-theme repo creation → only when customization starts, separate skill
- Local dev env (wp-env) → only when a developer needs to work on the code, separate skill
- Any Path B (takeover) or Path C (marketing-only) work → `voyager-site-dna`
- Divi/Elementor content migration → no converter tooling exists yet
- New server provisioning → all dev sites reuse shared Voyager Dev server

---

## Handoff phrases after completion

- "draft welcome email" → `voyager-client-message`
- "provision site data for [name]" → `voyager-orbit/provision-site-data` via onboard-client Step 3b
- "launch [name]" → (future) `voyager-site-launch`

---

## Reference IDs

### Databases
- Clients DB. `1e9bfa0d-34b6-4864-a693-9118c8f71033`
- Websites DB. `c6685c2d-de74-48ef-8225-ffdbc63ee1a8` (data source `collection://f12cc677-9dd3-499d-b23e-9c7873c5620f`)
- Servers DB. data source `collection://21e21904-2f4b-4cc9-a314-5ef68ed6cf32`

### Websites DB template
- New voyager.website site. `5e7cf74e-6103-45eb-a12b-26c50305e9cb`

### Voyager Dev server (hardcoded)
- Notion page. `22893507-c65f-431c-a4e3-a08e8ceffab6`
- SpinupWP server ID. `16035`
- IP. `159.65.174.126`

### Cloudflare
- Zone. `voyager.website`, zone ID `5ed6cffac6ab37ff6da397fc2818fd7c`

### Portal
- Base URL. `https://app.voyagermark.com/api` (Orbit's default via `TokenManager::getPortalBaseUrl()`)
- Public register endpoint. `POST /sites/register` (= `https://app.voyagermark.com/api/sites/register`)
- Verify callback (Portal → site). `GET https://[domain]/wp-json/voyager/v1/verify`

### GitHub sources
- `voyager-marketing/voyager-orbit` (release zip)
- `voyager-marketing/voyager-core` (release zip)
- `voyager-marketing/voyager-blocks` (source tarball — release zip broken)
- `voyager-marketing/voyager-block-theme` (source tarball — no releases)
- `WordPress/abilities-api` (release zip)
- `WordPress/mcp-adapter` (release zip)
- `Automattic/wordpress-mcp` (release zip)

### Orbit WP options
- `voyager_site_secret` — 64-char hex HMAC key
- `voyager_site_id` — domain (= Portal's site identifier)
- `voyager_registration_status` — `none` | `pending` | `active` | `failed`
- `voyager_registered_at` — ISO timestamp
- `voyager_portal_base_url` — Portal URL (empty means default)
- `voyager_registration_retries` — retry counter

---

## Config

- `DNS_PROPAGATION_TIMEOUT_SEC`. `180`
- `SITE_DEPLOY_TIMEOUT_SEC`. `1200` (20 min — HTTPS cert install adds time)
- `ORBIT_REGISTRATION_POLL_INTERVAL_SEC`. `5`
- `ORBIT_REGISTRATION_POLL_TIMEOUT_SEC`. `300`
- `DEFAULT_PHP_VERSION`. `8.2`
- `DEFAULT_WP_ADMIN_USER`. `voyager_admin`
- `DEFAULT_WP_ADMIN_EMAIL`. `sites@voyagermark.com`

---

## Optional follow-up modes (designed, not yet implemented)

When the prior `wordpress-website-project-onboarding` skill was retired into this one (2026-04-29), two of its phases didn't have a verified-working replacement here. They live as future-enhancement modes — flagged for follow-up implementation rather than copy-pasted as untested code.

### `--new-server` mode

**Use case.** A client needs their own SpinupWP server instead of sharing the Voyager Dev box. Reasons might include compliance scope, capacity at the shared server, or premium-tier site sizing. Today, every Path A client lands on the shared Voyager Dev server (id `16035`, IP `159.65.174.126`).

**Design sketch (from prior wp-onboarding skill).** Insert a new Phase 1.5 between gate and DNS:

```bash
curl -fsS -X POST https://api.spinupwp.app/v1/servers \
  -H "Authorization: Bearer $SPINUPWP_API_KEY" \
  -d '{
    "name": "voyager-<client-slug>",
    "provider": "digitalocean",
    "provider_server_region": "nyc3",
    "provider_server_size": "s-2vcpu-2gb",
    "ubuntu_version": "24.04",
    "database_type": "mariadb",
    "database_password": "<32-char-generated>"
  }'
```

Poll `GET /servers/<id>` until `status=active` (4-7 min). Provision timeout >15min → report, do NOT auto-retry (cost risk). Capacity error → fall back to alternate region, retry once. Then create a Servers DB row in Notion with the same shape as the Voyager Dev row, and use that server's ID + IP for the rest of the run.

Implementation gate. Don't ship `--new-server` until the cost-control story is clear (auto-shutdown of unused servers, billing transparency to Notion). Until then, multi-tenant on Voyager Dev.

### `--with-child-theme` mode

**Use case.** Site needs a per-client child theme with push-to-deploy from day one — most clients eventually want this once design work begins. Today, build-kickoff installs the parent `voyager-block-theme` and stops; child theme creation happens later when customization starts.

**Design sketch (per memory `project_voyager_blank_child.md`).** Don't scaffold a child theme from scratch — clone `voyager-marketing/voyager-blank-child` (the canonical starter), rename, push to a new client repo, wire push-to-deploy.

Expected steps:
1. `gh repo create voyager-marketing/<client-slug>-theme --private --template=voyager-marketing/voyager-blank-child`
2. Local clone, replace `voyager-blank-child` → `<client-slug>-theme` in `style.css`, `theme.json`, `functions.php`, `package.json`, etc.
3. Apply `--brand-primary`, `--brand-secondary`, `--logo` if passed.
4. Commit + push to `main`.
5. Wire SpinupWP push-to-deploy:
   ```bash
   curl -fsS -X PATCH https://api.spinupwp.app/v1/sites/<site-id> \
     -H "Authorization: Bearer $SPINUPWP_API_KEY" \
     -d '{
       "git": {
         "provider": "github",
         "repository": "git@github.com:voyager-marketing/<client-slug>-theme.git",
         "branch": "main",
         "deploy_path": "wp-content/themes/<client-slug>-theme",
         "deploy_script": "bash $HOME/files/wp-content/themes/<client-slug>-theme/deploy.sh"
       },
       "push_to_deploy": true
     }'
   ```
6. Add SpinupWP's deploy key to the GitHub repo (read-only).
7. Activate the child theme via WP-CLI (replaces parent activation in Phase 3 Step 11).

Implementation gate. Don't ship `--with-child-theme` until `voyager-blank-child` has a stable v1 release tag and a verified `deploy.sh` that doesn't conflict with our SSH+WP-CLI plugin install pattern. The wp-onboarding skill assumed `deploy.sh` did all plugin install too; this skill doesn't, so the merger needs careful reconciliation.

### Why not implement now

Both modes are real future needs but neither has been run live. Per project memory `project_voyager_build_kickoff` and the build-kickoff verification note (April 22), this skill earned its current state by being rewritten *after* a real run surfaced 11 gaps between paper spec and live API behavior. Adding unverified phases here would regress that quality bar. Track them as separate Notion roadmap items; promote when Ben says one is ready to land.

## Known drift risks

- **voyager-blocks release pipeline bug** — v1.0.0 release zip is missing the entire `src/` directory. Skill uses source tarball as workaround. Remove the workaround once the release pipeline is fixed (check future releases include `src/`).
- **SpinupWP HTTPS silent-fail behavior** — if DNS isn't visible to SpinupWP's internal resolver at the exact moment of site creation, `https.enabled: true` in the payload is silently set back to `false`. No API post-fix. Current mitigation: Phase 2 Step 7c pauses for manual UI enable. If SpinupWP ever adds a `POST /v1/sites/{id}/https` that accepts a Let's Encrypt type, automate it.
- **WP 6.9 property validation notices** — Orbit / voyager-blocks declare `_voyager_sanitizer_wrapped` on `WP_Ability` instances which WP 6.9+ flags as not-a-valid-property. Non-fatal but noisy in logs. Fix belongs in Orbit/blocks, not this skill.
- **Voyager Dev server IP hardcoded** — `159.65.174.126` cached. If Ben retires Voyager Dev and provisions a successor, update Phase 0.3 OR pass `--server-notion-id=<id>` on every run until the hardcode is updated.
- **Voyager Dev capacity** — server is shared across all dev sites. Monitor count growth. SpinupWP defaults cap at roughly 5-10 sites per low-tier droplet. At saturation, Ben provisions a new server and updates this skill.
- **Path A inference breaks** if anyone manually adds a Websites row to a Path A client before build-kickoff runs. Intake must not create Websites rows for Path A.
- **`dig` not available on Windows git bash** — skill uses `nslookup` instead. If run on Linux/Mac, `dig` would work; keep `nslookup` as a portability choice.
- **Portal endpoint shape**. Validated against `f:\dev\voyager\voyager-report\app\api\sites\register\route.ts` on 2026-04-22. If Portal changes the `/api/sites/register` schema, Orbit's `PortalClient::register()` and this skill's resume-hint text need updating in lockstep.
- **Server SSH access** — skill relies on `benw` user with `~/.ssh/id_rsa` authorized. If keys rotate, update the skill's auth pattern.
