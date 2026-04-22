---
name: voyager-build-kickoff
description: Use when provisioning the Voyager dev environment for a Path A (new build) client who already has a Clients DB row. Creates SpinupWP site at [slug].voyager.website on the shared Voyager server, adds Cloudflare DNS, installs Voyager plugin stack and block theme, waits for Orbit to auto-register with Portal, stashes the Orbit secret on the Websites DB row, and flips Clients DB infra flags. Trigger phrases include "run build kickoff for [name]", "provision dev site for [name]", "build kickoff [name]", "/build-kickoff [name]". Halts if the client has no Clients DB row, is not Path A, or already has a Websites DB row. Do NOT use for launch activities (domain delegation, GA4, GSC, kickoff email, care plan upsell) or existing-site takeovers (Path B, use voyager-site-dna).
owner: Ben
last_reviewed: 2026-04-21
---

# Voyager Build Kickoff

Day 1 infra provisioning for a Path A client. Spins up a Voyager-standard dev site on the shared Voyager SpinupWP server, wires it to Portal via Orbit self-registration, and hands off a ready-to-design environment. Runs after `voyager-client-intake` has created the Clients DB row and confirmed Path A.

Time to complete. Roughly 3 to 5 minutes (site provision + DNS propagation + plugin install + Orbit registration callback).

Scope. Dev environment only. Launch activities (domain delegation, GA4, GSC, kickoff email, Stripe care plan upsell) fire later via a separate launch skill.

---

## Phase 0. Session prep (runs once per session)

Silently. Cache results.

### 0.0 Load required tools

- **Notion MCP**. Should be loaded. If not, `tool_search` query `"Notion page database"`.
- **SpinupWP API**. Accessed via `curl` with `SPINUPWP_API_TOKEN` env var. No MCP.
- **Cloudflare API**. Accessed via `curl` with `CLOUDFLARE_API_TOKEN` env var. No MCP.
- **GitHub CLI**. `gh auth status` must succeed. Used to pull latest release zips for theme and private plugins.

Halt if any are missing. Report which and surface remediation.

### 0.1 Env var check

| Var | Purpose |
|---|---|
| `SPINUPWP_API_TOKEN` | SpinupWP site provisioning |
| `CLOUDFLARE_API_TOKEN` | DNS record creation on voyager.website zone |
| `GITHUB_RELEASE_PAT` | Private plugin + theme release zip downloads |

Portal registration happens automatically via Orbit plugin activation (no `PORTAL_API_KEY` needed from skill).

If any missing, halt with the exact export command needed.

### 0.2 Fetch Notion schemas (parallel)

- Clients DB. `collection://1e9bfa0d-34b6-4864-a693-9118c8f71033`
- Websites DB data source. `collection://f12cc677-9dd3-499d-b23e-9c7873c5620f`
- Servers DB data source. `collection://21e21904-2f4b-4cc9-a314-5ef68ed6cf32`

Confirm the properties below exist. Halt if any are missing (especially `Path` on Clients, which must be added manually before first run).

**Clients DB required properties:**
- `Company` (title)
- `Status` (single-select)
- `WP Publish Enabled` (select, values `__YES__`/`__NO__`)
- `Voyager Orbit Installed` (checkbox)
- `Block Theme` (checkbox)
- `Voyager Blocks` (checkbox)
- `Websites` (relation to Websites DB)

Path is not a Clients property. Path A is inferred from state: `WP Publish Enabled = YES` + `Websites` relation empty + `Voyager Orbit Installed` unchecked. That combination only holds for a new build pre-provision. Path B clients already have a `Websites` row; Path C has `WP Publish Enabled = NO`.

**Websites DB properties used:**
- `Domain` (title)
- `userDefined:URL` (URL, displayed as "URL")
- `Stage` (select, value `Dev` used here)
- `Status` (select, value `In Progress` during provisioning, `Active` on success, `Needs Review` on failure)
- `Orbit Secret` (text, written after Orbit self-registers)
- `SpinupWP Site ID` (text)
- `Server` (relation to Servers DB — carries IP Address and Hosting as rollups)
- `Company` (relation to Clients DB)
- `Prefix` (text, the WP table prefix)

**Servers DB properties used:**
- `Name` (title)
- `IP Address` (text)
- `Host` (select, value `SpinupWP`)
- `Datacenter` (select, value `NYC3`)
- `Status` (select, value `Active`)

### 0.3 Resolve shared Voyager server

Default. All dev sites run on the shared **Voyager Dev** SpinupWP server.

Hardcoded lookup (confirmed 2026-04-21):
- Notion page. `https://www.notion.so/22893507c65f431ca4e3a08e8ceffab6`
- Server Notion ID. `22893507-c65f-431c-a4e3-a08e8ceffab6`
- IP Address. `159.65.174.126`
- Host. SpinupWP
- Datacenter. NYC3

Resolution flow:
1. If `--server-notion-id=<id>` passed, use that. Fetch the Server row to get IP + name.
2. Otherwise, fetch the Voyager Dev server by hardcoded ID above. Verify `Status = Active` and `Host = SpinupWP`. If not active, halt with "Voyager Dev server is [status]. Create a replacement in Servers DB and pass --server-notion-id=<id>."
3. Cache `server_notion_url`, `server_notion_id`, `server_ip`, `server_name`.

Resolve SpinupWP numeric server ID via API:

```
GET https://api.spinupwp.app/v1/servers
  Authorization: Bearer $SPINUPWP_API_TOKEN
```

Match on `ip_address = server_ip`. Capture `spinupwp_server_id`. Halt if no match ("Notion IP [x] not found on SpinupWP — Servers DB row may be stale").

---

## Phase 1. Resolve + gate

### Step 1 — Resolve Clients row

Input priority:
1. `--clients-db-url=<id>` if passed (direct handoff from intake).
2. Positional `<business_name>`. Query Clients DB by `Company` (case-insensitive, trimmed).

If zero matches, halt. "No Clients row for [name]. Run `voyager-client-intake` first."

If more than one match, show list, ask user to pick.

Capture `clients_db_url`, `clients_db_id`, `business_name` (from `Company` field).

### Step 2 — Gate checks (Path A inferred from state)

All must pass. Halt on first failure with specific reason.

- `Status` = `Active`.
- **At least one build signal.** Either `WP Publish Enabled` = `__YES__` OR `Services` contains `Website` or `MWP`. If neither, halt. "No build signal on Clients row. `WP Publish Enabled = NO` and `Services` does not include Website/MWP. This is Path C (marketing-only) or a data problem. Use voyager-client-message or another skill."
- `Websites` relation is empty. If populated, this is likely Path B (takeover) or already built. Halt. "Client already has a Websites row. If this is a takeover, run voyager-site-dna. If the previous build failed, resume with --phase=N against the existing row."
- `Voyager Orbit Installed` = unchecked. If checked, halt. "Client already provisioned. Aborting."

If `WP Publish Enabled = __NO__` but `Services` includes `Website` or `MWP`, proceed but warn: "Services indicates a build but `WP Publish Enabled = __NO__`. Likely a Clients row created before voyager-client-intake was live. Flipping the flag to `__YES__` as part of Phase 5 cleanup." Then add that flag flip to the Phase 5 Clients DB update.

These checks together imply Path A. No explicit path field is read or written.

### Step 3 — Determine slug

- Slug. Default `slugify(business_name)`.
- If `--slug=<kebab>` passed, use that.
- Validate the slug is not already taken. Query Websites DB for `Domain` = `[slug].voyager.website`. If exists, halt. "Subdomain [slug].voyager.website already in use. Pick a different slug with --slug=<kebab>."

### Step 4 — Pre-flight confirmation

Show plan. Ask to proceed.

```
Build kickoff for [business_name]:

Path: A (new build)
Staging URL: https://[slug].voyager.website
Server: [server_name] ([server_ip]) — shared Voyager server

Will do:
1. Create Websites DB row (Stage=Dev, Status=In Progress)
2. Provision SpinupWP site on shared server (~60s)
3. Add Cloudflare DNS A record, wait for propagation
4. Install plugins. Orbit, Blocks, Core, Abilities API, MCP Adapter, WP AI Client, Rank Math
5. Install + activate voyager-block-theme
6. Wait for Orbit to auto-register with Portal
7. Capture Orbit Secret, write to Websites row
8. Flip Clients flags (Orbit, Theme, Blocks = YES)
9. Write CLIENT.md handoff on server

Proceed?
```

Options. `Run it` / `Change slug` / `Cancel`.

---

## Phase 2. Provision infrastructure

### Step 5 — Create Websites DB row (In Progress state)

Create the row upfront so failures mid-provision leave a breadcrumb for resume. Use the existing template for consistency.

Template. `5e7cf74e-6103-45eb-a12b-26c50305e9cb` ("New voyager.website site") on the Websites DB.

Override properties:
- `Domain` = `[slug].voyager.website`
- `userDefined:URL` = `https://[slug].voyager.website`
- `Stage` = `Dev`
- `Status` = `In Progress`
- `Server` = relation to `server_notion_url` (the shared Voyager server row)
- `Company` = relation to `clients_db_url`
- `Prefix` = `wp_`

Capture `website_db_url`, `website_db_id`.

### Step 6 — SpinupWP site provision

Create the site on the existing shared server. Do NOT create a new server.

```
POST https://api.spinupwp.app/v1/servers/[spinupwp_server_id]/sites
  Authorization: Bearer $SPINUPWP_API_TOKEN
  Content-Type: application/json
  {
    "domain": "[slug].voyager.website",
    "site_user": "[slug]",
    "php_version": "8.2",
    "wp": {
      "title": "[business_name]",
      "admin_user": "voyager_admin",
      "admin_email": "sites@voyagermark.com",
      "locale": "en_US"
    },
    "db": {
      "name": "[slug]_wp",
      "user": "[slug]_wp",
      "host": "localhost"
    },
    "ssl": {
      "enabled": true,
      "certificate_type": "letsencrypt"
    },
    "https": true
  }
```

Capture `site_id` from response. Poll `GET /v1/sites/[site_id]` until `status = ready`, timeout 5 minutes.

Update Websites row. `SpinupWP Site ID` = `site_id`.

Capture `admin_password` from the provision response (stored in the same API call's `wp.admin_password` field). Keep in memory only, write to the Websites `WP Password` field at end of Phase 5.

On failure. Surface error, set Websites Status = `Needs Review`, leave domain in row, exit 1 with `resume_hint: --phase=6`.

### Step 7 — Cloudflare DNS

Zone. `voyager.website`. Look up zone ID once per session, cache.

```
GET https://api.cloudflare.com/client/v4/zones?name=voyager.website
  Authorization: Bearer $CLOUDFLARE_API_TOKEN
```

Then create A record:

```
POST https://api.cloudflare.com/client/v4/zones/[zone_id]/dns_records
  Authorization: Bearer $CLOUDFLARE_API_TOKEN
  Content-Type: application/json
  {
    "type": "A",
    "name": "[slug]",
    "content": "[server_ip]",
    "ttl": 1,
    "proxied": false
  }
```

Wait for propagation. Poll `dig @1.1.1.1 [slug].voyager.website A` until it resolves to `server_ip`, max 3 minutes.

SSL. Let's Encrypt issuance runs automatically via SpinupWP once DNS resolves. Verify cert within 2 minutes by fetching `https://[slug].voyager.website/wp-admin/install.php` and checking for valid cert. If cert issuance fails, continue but flag in summary. Alex can re-trigger from SpinupWP UI.

---

## Phase 3. Install stack

Plugin and theme installs run via SpinupWP's site shell (SSH) using WP-CLI. SpinupWP exposes shell commands through its API:

```
POST https://api.spinupwp.app/v1/sites/[site_id]/ssh
  Authorization: Bearer $SPINUPWP_API_TOKEN
  { "command": "<command>" }
```

### Step 8 — Plugin install

Seven plugins. Six private from `voyager-marketing` GitHub org, one public from WP.org.

| Plugin | Source | Slug |
|---|---|---|
| Voyager Orbit | GitHub `voyager-marketing/voyager-orbit` | `voyager-orbit` |
| Voyager Blocks | GitHub `voyager-marketing/voyager-blocks` | `voyager-blocks` |
| Voyager Core | GitHub `voyager-marketing/voyager-core` | `voyager-core` |
| Abilities API | GitHub `voyager-marketing/wp-abilities-api` | `wp-abilities-api` |
| MCP Adapter | GitHub `voyager-marketing/mcp-adapter` | `mcp-adapter` |
| WP AI Client | GitHub `voyager-marketing/wp-ai-client` | `wp-ai-client` |
| Rank Math SEO | WP.org | `seo-by-rank-math` |

For each private plugin:
```
gh release download --repo voyager-marketing/[repo] --pattern "*.zip" --dir /tmp
scp /tmp/[plugin].zip via SpinupWP upload API
wp plugin install /tmp/[plugin].zip --activate (via shell)
```

For Rank Math:
```
wp plugin install seo-by-rank-math --activate
```

Install Orbit LAST among the Voyager plugins, since its activation triggers Portal registration which expects the other plugins already present.

Verify all seven active via `wp plugin list --status=active --format=json`. If any missing, halt with which.

### Step 9 — Theme install + activate

```
gh release download --repo voyager-marketing/voyager-block-theme --pattern "*.zip" --dir /tmp
wp theme install /tmp/voyager-block-theme-*.zip --activate
```

Verify active via `wp theme list --status=active`.

---

## Phase 4. Wait for Orbit self-registration

Orbit generates its site secret and registers with Portal automatically on plugin activation. The skill does NOT make the Portal API call.

Mechanism (from Orbit source, `TokenManager.php` + `RegistrationService.php`):

1. On activation, Orbit calls `TokenManager::generateSecret()` → stores 64-char hex in `voyager_site_secret` option.
2. Orbit POSTs to `https://portal.voyagermark.com/api/wp-manager/sites/register` with `{site_url, site_id, site_secret, orbit_version, wp_version, php_version}`.
3. Portal triggers async callback to `https://[slug].voyager.website/wp-json/voyager/v1/verify`.
4. Orbit signs the challenge, Portal confirms.
5. Orbit sets `voyager_registration_status` option to `active`.

### Step 10 — Poll registration status

Poll the WP site until registration completes.

```
wp option get voyager_registration_status
```

Expected values. `none`, `pending`, `active`, `failed`.

Poll every 5 seconds, timeout 60 seconds. Accept `active` as success.

If status stuck at `pending`. Check Orbit logs via `wp option get voyager_registration_retries` — if > 0, registration is retrying. Wait up to 5 minutes total.

If status = `failed`. Halt. Surface `voyager_registration_status` + retry count. Exit 1, `resume_hint: --phase=10`.

### Step 11 — Capture Orbit Secret

```
wp option get voyager_site_secret
wp option get voyager_site_id
```

Write to Websites row via Notion MCP:
- `Orbit Secret` = output of `voyager_site_secret`

Never log or echo the secret to chat transcript. Pass it directly from WP-CLI stdout into the Notion update call.

Update Websites row. `Status` = `Active`.

---

## Phase 5. Finalize

### Step 12 — Update Clients DB flags

Update Clients row:
- `Voyager Orbit Installed` = checked
- `Block Theme` = checked
- `Voyager Blocks` = checked
- `Websites` = add relation to new Websites row
- `WP Publish Enabled` = `__YES__` (only if it was `__NO__` at Phase 1 and the Services fallback was used — flips the flag to match reality)

### Step 13 — Write CLIENT.md on server

Via SpinupWP site shell, write to `/sites/[slug].voyager.website/CLIENT.md`:

```
# [business_name]

Voyager-managed development site. Provisioned [date] by voyager-build-kickoff.

- Staging URL. https://[slug].voyager.website
- WP Admin. https://[slug].voyager.website/wp-admin
- Clients Notion. [clients_db_url]
- Websites Notion. [website_db_url]
- Orbit Portal site_id. [slug].voyager.website (domain is the Portal site_id)
- SpinupWP. server #[spinupwp_server_id], site #[site_id]

Plugin stack. Orbit, Blocks, Core, Abilities API, MCP Adapter, WP AI Client, Rank Math.
Theme. voyager-block-theme (activated).

Next phase. brand tokens, site data, core pages, content. Run via `voyager-orbit/*` abilities once client provides inputs.
```

### Step 14 — Return summary

Output in chat:

```
Build kickoff complete. [business_name]

Staging URL.    https://[slug].voyager.website
WP Admin.       https://[slug].voyager.website/wp-admin
Notion Clients. [clients_db_url]
Notion Website. [website_db_url]

Infra:
- SpinupWP server #[spinupwp_server_id] (shared Voyager), site #[site_id], IP [server_ip]
- Cloudflare DNS. A record [slug] → [server_ip] (propagated)
- SSL. Let's Encrypt [issued|pending]
- Plugins. 7/7 active
- Theme. voyager-block-theme active
- Orbit registration. active (secret stashed on Websites row)

Clients flags flipped:
- Voyager Orbit Installed. YES
- Block Theme. YES
- Voyager Blocks. YES

Next:
1. Gather brand tokens (primary hex, secondary hex, logo) → manual for now
2. Gather site data (phone, email, address, hours, social) → "provision site data for [business_name]"
3. Scaffold core pages → (pending Orbit release with scaffold-core-pages ability)
4. Ship design → voyager-block-theme child theme repo (create when customization starts)
```

Also emit JSON to stdout for programmatic consumers:

```json
{
  "exit_code": 0,
  "business_name": "...",
  "clients_db_url": "...",
  "website_db_url": "...",
  "staging_url": "...",
  "wp_admin_url": "...",
  "spinupwp_server_id": 0,
  "spinupwp_site_id": 0,
  "server_ip": "...",
  "orbit_registration_status": "active"
}
```

---

## Error handling

All failures update the Websites row `Status` to `Needs Review` and exit 1 with a resume hint. The Websites DB has no `Failed` status value, so `Needs Review` is the closest match.

| Phase | Common failure | Websites Status | Resume hint |
|---|---|---|---|
| 0 | Missing env var or MCP | not set | Surface exact fix. Nothing written yet |
| 0.2 | Clients DB missing `Path` property | not set | Ben adds the property. No resume |
| 0.3 | Shared Voyager server not found in Notion | not set | Create Server row manually or pass `--server-notion-id=<id>`. No resume |
| 1 | Gate check fails | not set | No resume. User must fix Clients row first |
| 2 Step 5 | Websites row create fails | n/a | `--phase=5` |
| 2 Step 6 | SpinupWP provision timeout | `Needs Review` | `--phase=6` |
| 2 Step 7 | Cloudflare zone not found or DNS stuck | `Needs Review` | Check `CLOUDFLARE_API_TOKEN` scope. `--phase=7` |
| 3 Step 8 | Plugin install fails (release 404, zip corrupt, shell timeout) | `Needs Review` | `--phase=8` |
| 3 Step 9 | Theme activate fails | `Needs Review` | `--phase=9` |
| 4 Step 10 | Orbit registration status = `failed` or stuck `pending` > 5min | `Needs Review` | Check Portal status. `--phase=10` |
| 4 Step 11 | Secret read fails | `Needs Review` | `--phase=11` |
| 5 Step 12 | Clients flag update fails | `Active` | No resume. Fix manually |

On any mid-run failure, the partial Websites row remains with `Status = Needs Review`. Resume re-runs only from the named phase onward by reading the Websites row for already-captured IDs.

---

## What this skill does NOT do

- Draft kickoff email → `voyager-client-message`
- Configure brand tokens → manual for now (pending ability release)
- Scaffold core pages → pending Orbit release with `voyager-orbit/scaffold-core-pages`
- Configure Rank Math baseline, GA4, GSC → launch-time skill (not yet built)
- Domain delegation → launch-time, manual per Alex's SOP
- Stripe care plan upsell → launch-time, `voyager-stripe-subscribe`
- Site data provisioning (phone, email, address, hours, social) → `voyager-orbit/provision-site-data` ability via onboard-client Step 3b, or run later when client provides
- Pattern Cloud sync → pending, layered in separately
- GitHub child-theme repo creation → only when customization starts, separate skill
- Local dev env (wp-env) → only when a developer needs to work on the code, separate skill
- Any Path B (takeover) or Path C (marketing-only) work → hand off to `voyager-site-dna`
- New server provisioning → all dev sites reuse the shared Voyager SpinupWP server. If that server is full, Ben creates a new one manually and updates Servers DB before re-running

---

## Handoff phrases after completion

- "draft welcome email" / "send welcome" → `voyager-client-message`
- "provision site data for [name]" → run onboard-client Step 3b or invoke `voyager-orbit/provision-site-data` directly
- "launch [name]" → (future) `voyager-site-launch`

---

## Reference IDs

### Databases
- Clients DB. `1e9bfa0d-34b6-4864-a693-9118c8f71033`
- Websites DB. `c6685c2d-de74-48ef-8225-ffdbc63ee1a8` (data source `collection://f12cc677-9dd3-499d-b23e-9c7873c5620f`)
- Servers DB. data source `collection://21e21904-2f4b-4cc9-a314-5ef68ed6cf32`

### Websites DB template
- New voyager.website site. `5e7cf74e-6103-45eb-a12b-26c50305e9cb`

### Cloudflare
- Zone. `voyager.website` (zone ID resolved at runtime, cached for session)

### SpinupWP
- API base. `https://api.spinupwp.app/v1`
- Shared Voyager server resolved at runtime from Servers DB

### Portal
- Base URL. `https://portal.voyagermark.com`
- Registration endpoint. `/api/wp-manager/sites/register` (called by Orbit, not by this skill)
- Verification callback. `/wp-json/voyager/v1/verify` on the WP site (Portal calls this)

### GitHub org
- `voyager-marketing`

### Orbit option keys (WP options written by Orbit plugin)
- `voyager_site_secret` — 64-char hex HMAC key
- `voyager_site_id` — domain
- `voyager_registration_status` — `none` | `pending` | `active` | `failed`
- `voyager_registered_at` — ISO timestamp
- `voyager_portal_base_url` — Portal URL

---

## Config

- `DNS_PROPAGATION_TIMEOUT_SEC`. `180`
- `SSL_ISSUE_TIMEOUT_SEC`. `120`
- `SITE_PROVISION_TIMEOUT_SEC`. `300`
- `ORBIT_REGISTRATION_POLL_INTERVAL_SEC`. `5`
- `ORBIT_REGISTRATION_POLL_TIMEOUT_SEC`. `300`

---

## Known drift risks

- Path is inferred from Clients state, not stored. If the state signals ever stop cleanly encoding A/B/C (for example, a Path A client gets a dummy Websites row added manually), the gate will misfire. Intake should never create a Websites row for Path A clients before build-kickoff runs.
- Voyager Dev server Notion ID is hardcoded (`22893507-c65f-431c-a4e3-a08e8ceffab6`). If Ben retires this server and provisions a new shared Voyager server, update Phase 0.3 hardcoded IDs OR pass `--server-notion-id=<id>` on every run until the hardcode is updated.
- The Voyager Dev server at IP `159.65.174.126` is shared across all dev sites. Monitor site count growth — SpinupWP default plans cap at roughly 5-10 sites per server depending on size. At that point, Ben provisions a new Voyager Dev server and updates this skill's hardcoded ID.
- Websites DB `Status` options do not include `Provisioning` or `Failed`. Skill uses `In Progress` during and `Needs Review` on failure. If Ben adds dedicated options later, update Phase 2 Step 5 and the error handling table.
- Orbit registration relies on the WP site being reachable from Portal's IP for the verify callback. If Cloudflare WAF or firewall blocks Portal, registration will hang in `pending`. SpinupWP defaults should allow this, but check if registration stalls.
- Portal registration endpoint shape may change. Validated against `app/api/wp-manager/sites/register/route.ts` as of 2026-04-21 — body requires `site_url`, `site_id`, `site_secret`, optional `orbit_version` / `wp_version` / `php_version`. Orbit's PortalClient must stay in sync with this contract.
- Rank Math is the only plugin from WP.org. If it ever requires a license token on install, this step needs a key.
- SpinupWP PHP version `8.2` is hardcoded. Revisit when `8.3` or `8.4` becomes the fleet default.
- GitHub release zip filenames may vary by repo (`*-build.zip`, `*-release.zip`, etc.). If `--pattern "*.zip"` matches multiple files per release, narrow the glob per repo.
