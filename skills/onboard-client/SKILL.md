---
name: onboard-client
description: "Use when asked to onboard a new client, set up a new client site, add a client to the system, or verify a client's WordPress setup is correctly configured."
argument-hint: "<client-name> [--verify-only] [--site=domain]"
user-invocable: true
owner: Ben
last_reviewed: 2026-04-30
---

# Onboard Client

Full pipeline: Notion records, WP verification, Tier 1 bindings, sync filter, Pattern Cloud, first content cycle. Triggers on "onboard [client]", "set up new client [name]", `/onboard-client`.

**Modes.** Default runs the full pipeline. `--verify-only` runs Step 3 only and skips Notion writes.

## Step 0: Scaffold Claude Config (new servers only)

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

Call `wp_verify_setup(site)`. Report each item pass/fail:

| Check | Expected |
|---|---|
| Orbit | Active, v1.39.0+ |
| Blocks | Active |
| RankMath | Active |
| Abilities API | Active, count returned |
| Portal ID | `voyager_portal_site_id` present |
| Theme | Voyager |
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
3. **Dry-run verify** with `wp_run_cli(site, "voyager notion sync --database=content --dry-run")`. Output must show `Client filter: Client = {page-id} (relation)` and list only this client's content. If other-client content appears, **STOP and fix before continuing.**

Onboarding is not complete until the dry-run passes.

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
- Orbit / Blocks / RankMath: {active | ❌}
- Abilities API: {N} abilities
- Portal ID: {id | ❌}
- Theme: {name}
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
