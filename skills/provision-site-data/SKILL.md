---
name: provision-site-data
description: Use when pushing Tier 1 site data (phone, email, address, hours, social URLs) to a Voyager-managed WordPress site after build-kickoff. Pulls known fields from the Notion Clients row, asks for the missing ones (hours + social), then runs the voyager-orbit/provision-site-data ability via WP-CLI over SSH. Verifies the `voyager_site_*` options were written. Trigger phrases include "provision site data for [name]", "push site data to [name]", "run tier 1 bindings for [name]", "/provision-site-data [name]". Halts if the client has no Websites row or the site isn't reachable. Do NOT use before voyager-build-kickoff has completed (site + Orbit must be live).
owner: Ben
last_reviewed: 2026-04-22
---

# Provision Site Data

Pushes Tier 1 site data into WordPress `voyager_site_*` options so the `voyager/site-data` block binding source can render phone, email, address, hours, and social URLs across all blocks and patterns. Runs the `voyager-orbit/provision-site-data` ability registered by Orbit on every Voyager-managed site.

Time to complete. Roughly 1 to 2 minutes once inputs are confirmed.

Scope. One site at a time, after `voyager-build-kickoff` has completed. Assumes Orbit is active and Portal-registered on the target site (without Orbit, the ability doesn't exist).

---

## Phase 0. Session prep

### 0.0 Load tools

- **Notion MCP**. Required to resolve client + site + read address/phone/email.
- **SSH**. `ssh -i ~/.ssh/id_rsa benw@<server_ip>` for WP-CLI execution. Same pattern as voyager-build-kickoff.
- **Settings**. Read sudo password from the Servers DB row's `Password` field.

### 0.1 Fetch schemas

Clients DB `collection://1e9bfa0d-34b6-4864-a693-9118c8f71033` and Websites DB `collection://f12cc677-9dd3-499d-b23e-9c7873c5620f`.

---

## Phase 1. Resolve target

### Step 1 — Resolve Clients row

Input priority:
1. `--clients-db-url=<id>` if passed.
2. Positional `<business_name>`. Query Clients DB by `Company` (case-insensitive).

Capture `clients_db_url`, `clients_db_id`, `business_name`.

If not found or ambiguous, prompt user to pick.

### Step 2 — Resolve Websites row

Follow the Clients row's `Websites` relation. Must be non-empty, exactly one row. If multiple, ask user which one (client could have Dev + Prod separately).

Capture from Websites row:
- `Domain` (e.g. `melody-magic-site.voyager.website`)
- `userDefined:URL` (the https URL)
- `SpinupWP Site ID`
- `Server` relation → server IP via rollup (or fetch the Server row directly)
- `System User` (site_user for sudo -u)

If any missing, halt with what's empty. Site probably wasn't fully provisioned by build-kickoff — re-run that first.

### Step 3 — Reachability check

`curl -I [url]` must return a 2xx/3xx with `Server: nginx`. If not reachable, halt ("Site not reachable — check build-kickoff completion before provisioning data").

---

## Phase 2. Gather inputs

### Step 4 — Pull known fields from Notion

From Clients row:

| Field | Source |
|---|---|
| `phone` | `Company Number` or `Primary Number` (whichever is populated) |
| `email` | `Primary Email(s)` (first email if multiple) |
| `address_raw` | `Company Address` (free-text, parse) |

Parse `address_raw` best-effort into:
- `street` — everything before the first comma
- `city` — between first and second comma
- `state` — 2-letter code or state name in the last comma segment
- `zip` — trailing 5-digit (or ZIP+4)

Example. `"3041 Lauderdale Drive, Henrico, VA 23233"` →
- street: `3041 Lauderdale Drive`
- city: `Henrico`
- state: `VA`
- zip: `23233`

If the parse fails (address doesn't split cleanly), show the raw string and ask the user to provide the components.

### Step 5 — Ask for missing fields

```
Business hours? (one line per day or compact form, e.g. "Mon–Fri: 10am–6pm, Sat: 9am–3pm, Sun: closed")
Facebook URL? (optional — leave blank if none)
Instagram URL? (optional)
LinkedIn URL? (optional)
```

These are not in Notion by default. For subsequent runs, consider adding them to the Clients row's `WP Notes` field or a dedicated "Site Data" field so they don't have to be re-asked.

### Step 6 — Confirm

Show the full payload that will be written. Ask to proceed.

```
Push these to [domain]?

Phone:    [phone]
Email:    [email]
Address:  [street], [city], [state] [zip]
Hours:    [hours]
Facebook: [url or "-"]
Instagram: [url or "-"]
LinkedIn: [url or "-"]

Proceed?
```

Options. `Run it` / `Edit a field` / `Cancel`.

---

## Phase 3. Execute

### Step 7 — Run the ability via WP-CLI

SSH pattern (from voyager-build-kickoff v2):

```bash
ssh -i ~/.ssh/id_rsa -o StrictHostKeyChecking=no benw@[server_ip] \
  "echo \"\$SUDO_PW\" | sudo -S -u [site_user] wp --path=/sites/[domain]/files eval '
    do_action(\"voyager_run_ability\", \"voyager-orbit/provision-site-data\", [
      \"phone\"   => \"[phone]\",
      \"email\"   => \"[email]\",
      \"address\" => \"[street]\",
      \"city\"    => \"[city]\",
      \"state\"   => \"[state]\",
      \"zip\"     => \"[zip]\",
      \"hours\"   => \"[hours]\",
      \"social\"  => [
        \"facebook\"  => \"[facebook_url]\",
        \"instagram\" => \"[instagram_url]\",
        \"linkedin\"  => \"[linkedin_url]\"
      ],
    ]);
    echo \"Site data provisioned.\n\";
  '"
```

Escaping is fiddly. Easier pattern: stage a PHP file at `/tmp/provision.php` on the server (as benw, no sudo), then run `wp --path=... eval-file /tmp/provision.php` via sudo.

### Step 8 — Verify

Read back each option to confirm. The ability writes to:
- `voyager_site_phone`
- `voyager_site_email`
- `voyager_site_address`
- `voyager_site_city`
- `voyager_site_state`
- `voyager_site_zip`
- `voyager_site_hours`
- `voyager_site_social_facebook`
- `voyager_site_social_instagram`
- `voyager_site_social_linkedin`

```bash
wp option get voyager_site_phone
wp option get voyager_site_email
# etc.
```

If any option is missing or empty when it shouldn't be, halt with the diff.

### Step 9 — Report

```
Tier 1 site data pushed to [domain]. Options written:

  voyager_site_phone: [phone]
  voyager_site_email: [email]
  voyager_site_address: [street]
  voyager_site_city: [city]
  voyager_site_state: [state]
  voyager_site_zip: [zip]
  voyager_site_hours: [hours]
  voyager_site_social_facebook: [url or "(empty)"]
  voyager_site_social_instagram: [url or "(empty)"]
  voyager_site_social_linkedin: [url or "(empty)"]

These are bound to any block using the voyager/site-data binding source.
Edit directly via WP Admin → Settings → Voyager Site Data (or re-run this skill).
```

No changes to the Notion Clients row. The source of truth for site data is the WP option (which Orbit syncs up to Portal for fleet visibility). If the client ever updates their phone/hours/etc., re-run this skill; don't edit options in WP Admin alone (drift risk).

---

## Error handling

| Failure | Fix |
|---|---|
| No Clients row found | Run `voyager-client-intake` first |
| Clients row has empty `Websites` relation | Run `voyager-build-kickoff` first |
| Site not reachable | Check if build-kickoff completed. DNS + SSL + WP must all be live |
| SSH authentication fails | Verify `~/.ssh/id_rsa` works against `benw@<ip>` |
| `voyager_run_ability` hook not firing | Orbit may be inactive. `wp plugin status voyager-orbit` to verify |
| Ability returns error | Surface Orbit's error verbatim. Common: invalid phone format, missing required field |

All failures exit 1. No Notion writes happen (skill is read-from-Notion, write-to-WP-only).

---

## What this skill does NOT do

- Write to Notion (source of truth for address/phone/email stays there)
- Install plugins (assumes Orbit is already active)
- Provision the site itself → `voyager-build-kickoff`
- Configure brand tokens (primary/secondary hex, logo) → separate skill pending
- Scaffold core pages → pending `voyager-orbit/scaffold-core-pages` ability

---

## Reference IDs

### Databases
- Clients DB. `1e9bfa0d-34b6-4864-a693-9118c8f71033`
- Websites DB. `c6685c2d-de74-48ef-8225-ffdbc63ee1a8`

### Orbit ability
- `voyager-orbit/provision-site-data` — registered by voyager-orbit plugin in the `voyager-provisioning` ability category.

### Bound options (written by the ability)
- `voyager_site_phone`, `voyager_site_email`, `voyager_site_address`, `voyager_site_city`, `voyager_site_state`, `voyager_site_zip`, `voyager_site_hours`
- `voyager_site_social_facebook`, `voyager_site_social_instagram`, `voyager_site_social_linkedin`

---

## Known drift risks

- **No Notion source for business hours / social URLs** — must be asked every time until we add those to the Clients DB schema. Candidates: a "Site Data" JSON field, or individual `Hours`, `Facebook`, `Instagram`, `LinkedIn` text fields.
- **Address parser is heuristic** — assumes US format with commas. For international clients or quirky addresses, the parser will fail and prompt for manual entry.
- **Ability namespace** — `voyager-orbit/provision-site-data` as of Orbit 1.66.1. If Orbit ever namespaces abilities differently (e.g. `voyager/orbit/provision-site-data`), update Step 7 and the Reference IDs.
