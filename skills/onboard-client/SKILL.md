---
name: onboard-client
description: "Use when asked to onboard a new client, provision or set up a new client site, add a client to the system, run the SpinupWP new-site path, or verify a client's WordPress setup is correctly configured."
argument-hint: "<client-name> [--verify-only] [--site=domain]"
user-invocable: true
owner: Ben
last_reviewed: 2026-05-28
distribution: internal
origin: voyager
mcp_requirement: required
logic_type: workflow
surface: all
---

# Onboard Client

Full pipeline: Notion records, WP verification, Tier 1 bindings, sync filter, Pattern Cloud, first content cycle. Triggers on "onboard [client]", "set up new client [name]", `/onboard-client`.

**Modes.** Default runs the full pipeline. `--verify-only` runs Step 3 only and skips Notion writes.

## Step 0a: Site Provisioning Decision

First decide whether the WordPress site already exists.

- **Site exists:** continue to Step 0, then resolve Notion records and verify WordPress.
- **Site does not exist:** run [[How-To] Infra: SpinupWP New Site Provisioning](https://www.notion.so/36e47c03778b819f9a0de7e148e4cd38) before Step 1.

The provisioning SOP must produce a reachable domain, SpinupWP Site ID, Server ID, system user, DB name, WP admin login, active parent + child theme, Cloudflare DNS handoff, and GitHub deploy workflow. Do not create onboarding records that claim the site is active until the provisioned URL returns 200 with HTTPS or the SOP explicitly reports a temporary certificate blocker.

## Step 0: Scaffold Claude Config (after site exists)

Skip if `.claude/` already exists. Otherwise gather server root, WP root, DB prefix (default `wp_`), Portal Site ID, then run:

```bash
voyager-skills/install.sh --domain=<domain> --name="<Client Name>" \
  --wp-root=<wp-root> --db-prefix=<prefix> \
  --portal-site-id=<id> --target=<server-root>
```

Confirm `CLAUDE.md`, `.mcp.json`, `settings.json`, 10 skills, 3 hooks. Stop and report if anything is missing.

## Step 1: Resolve or Create Client in Notion

Search Client Profiles DB (`1e9bfa0d-34b6-4864-a693-9118c8f71033`) for the client name.

- **Found**: note the page ID, proceed.
- **Not found**: ask for client name, primary contact, contact email, industry. **Confirm before creating.** Create via `notion-create-pages`.

Never create a duplicate. If a near-match exists, show it and ask.

## Step 2: Verify or Create Website Record

Search Websites DB (`c6685c2d-de74-48ef-8225-ffdbc63ee1a8`) for the domain.

- **Found**: confirm it links to the Step 1 client page, note the page ID.
- **Not found**: ask for domain, full URL, hosting provider. **Confirm before creating.** Create the Website record linked to the client page with Stage=`Prod`, Status=`Active`.

## Step 3: Verify WordPress Setup

Call `wp_verify_setup(site)`. Also query the WP Plugins DB (`2d247c03778b80ddb8addfdf85368c73`) for the site's install profile:

1. Determine the site's `Install On` profile from scope: `New Build`, `MWP-Only`, `SEO-Only`, `Migration`, `Forms Site`, `Custom Field Site`, plus `All Sites`.
2. Pull WP Plugins rows where `Required = true` and `Install On` includes `All Sites` or the matching site profile.
3. For each returned row, resolve the expected active plugin slug from `wp.org Slug`; if blank, use the row's internal package key or documented Voyager slug.
4. Verify each plugin is active with WP-CLI, for example `wp_run_cli(site, "plugin is-active <slug>")`, or by matching the slug in `wp plugin list --status=active --format=json`.
5. Report the dynamic plugin set by plugin name, expected slug, source row, and active/missing status. Do not replace missing DB rows with a hardcoded fallback list.

Report each item pass/fail:

| Check | Expected |
|---|---|
| Required plugins | Every matching WP Plugins DB row is active |
| Abilities API | Active, count returned |
| Portal ID | `voyager_portal_site_id` present |
| Theme | Active theme is a client child theme whose parent/template is `voyager-block-theme` |
| CPTs | `service_area`, `industry_page`, `neighborhood`, `portfolio`, `team` |
| Binding sources | `voyager/post-meta-text`, `voyager/site-data`, `voyager/contextual-cta`, `voyager/geo` |

If `--verify-only`, stop and output the checklist.

## Step 3b: Provision Site Data (Tier 1 Bindings)

Gather phone, email, street, city, state, zip, hours, socials (Facebook, Instagram, LinkedIn). Check the Notion Website record first.

Run `wp_execute_ability(site, "voyager-orbit/provision-site-data", { phone, email, address, city, state, zip, hours, social: {...} })`. Verify with `wp_get_options(site, ["voyager_site_phone", "voyager_site_email", "voyager_site_address", "voyager_site_city", "voyager_site_state", "voyager_site_zip", "voyager_site_hours"])`. Report any missing options.

## Step 3c: Configure Notion Sync Filter (Client Isolation)

**HARD BLOCK. NEVER skip.** Without a sync filter, an unfiltered sync pulls ALL client content onto this site. Data integrity violation, not a warning.

1. Use the Client Profile page ID from Step 1.
2. Run `wp_execute_ability(site, "voyager-blocks/set-sync-filter", { alias: "content", property: "Client", value: "<client-notion-page-id>", type: "relation" })`. <!-- TODO: confirm ability slug; if not exposed, fall back to wp_run_cli with the update_option pattern from the prior version. -->
3. **Dry-run verify** with `wp_run_cli(site, "voyager notion sync --database=content --dry-run")`. **Hard assertion:** the output must contain the literal substring `Client filter: Client = {page-id}` (with the actual page ID). If that exact line is absent — even if no other-client content appears — treat as failure and **STOP**. The set-sync-filter call may have silently no-op'd (ability not exposed, wrong slug, malformed args) and the sync would run unfiltered. Do not proceed on the absence of evidence.

If the line IS present, also verify the listed content shows only this client's items. If other-client content appears, **STOP and fix before continuing.**

Onboarding is not complete until the dry-run passes both checks.

## Step 3d: Verify Pattern Cloud Sync

Call `pattern_sync_to_site(site)` to push the canonical pattern manifest. <!-- TODO: confirm the tool sets `pattern_cloud_url` if missing; if not, prepend a wp_execute_ability call to set the default URL `https://v3.voyagermark.com/wp-json/voyager-blocks/v1/patterns/manifest`. --> Report the number of patterns synced.

## Step 4: Create First Content Cycle

Search Content Cycles DB (`dcff4afb-e469-481f-929c-cd23cc87f822`) for a cycle linked to this client in the current month.

- **Found**: note the cycle page ID.
- **Not found**: **confirm before creating.** Create with Title `"<Client Name> [Month Year]"`, Client linked to Step 1, Month set to the first day of the target month (e.g., `2026-04-01`).

## Step 5: Create Initial Content Items

Ask the user for blog post count, page count, and any target keywords. **Confirm count and titles before creating.**

For each item, create a record in Content DB (`cba94900-3a60-4292-ba6b-f8aeea62e439`) with Title (working title or keyword placeholder), Client (Step 1 link), Content Cycle (Step 4 link), Status `"💡 Idea"` if no keyword, `"Up Next"` if a keyword was provided.

## Step 6: Summary Report

```
## Client Onboarding: {Client Name}

### Notion
- Client Profile: {found | created} (ID: {page_id})
- Website Record: {found | created}, {domain}
- Content Cycle: {found | created}, {cycle title}
- Content Items: {N} ({M} with keywords, {K} ideas)

### WordPress ({domain})
- Required plugins from WP Plugins DB: {all active | list missing}
- Abilities API: {N} abilities
- Portal ID: {id | ❌}
- Theme: {child_name}, parent `voyager-block-theme` {confirmed | ❌}
- CPTs / Binding Sources: {all present | list missing}
- Site data provisioned: phone, email, address, hours, social
- Sync filter: Client = {page-id} (dry-run passed)
- Pattern Cloud: {N} patterns synced

### Next Steps
- pSEO: /pseo
- Content: /content-brief
```

If any step failed, list what succeeded, what failed, and what needs manual attention.

## Guardrails

- **Always confirm** before creating any Notion record (client profile, website, cycle, or content items).
- **Never skip** WordPress verification — even for clients being added to Notion only.
- **Never create duplicates** — search before creating. If a near-match is found, show it to the user and ask to confirm.
- **Report failures clearly** — if a WP-CLI command fails or a Notion write fails, state what succeeded, what failed, and what the user needs to do manually.
- **Content Cycle Month** must always be the first day of the target month (e.g., `2026-04-01` for April 2026).
- **Remote sites** — when SSH is not available, note in the summary which WP verification checks could not be run and recommend the user run them manually or via a local session.
- **NEVER skip Step 3c (Notion sync filter).** An unfiltered sync pulls all client content onto this site. The sync filter must be set and dry-run verified before onboarding is considered complete. This is a hard data-integrity requirement, not optional.

## Related

- [[How-To] Infra: SpinupWP New Site Provisioning](https://www.notion.so/36e47c03778b819f9a0de7e148e4cd38)
- [[How-To] Infra: Local Development Environment (Laragon)](https://www.notion.so/36e47c03778b81628c26d0b1cc7a3ead)
- [[Playbook] Infra: Cloudflare Zone Setup & Client Delegation](https://www.notion.so/34c47c03778b81549862e40549d44ae2)
- [WP Plugins DB](https://www.notion.so/2d247c03778b80ddb8addfdf85368c73)
