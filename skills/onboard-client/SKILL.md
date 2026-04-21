---
name: onboard-client
description: "Use when asked to onboard a new client, set up a new client site, add a client to the system, or verify a client's WordPress setup is correctly configured."
argument-hint: "<client-name> [--verify-only] [--site=domain]"
user-invocable: true
owner: Ben
last_reviewed: 2026-04-21
---

# Onboard Client

Full pipeline for adding a new client to the Voyager system: Notion records, WordPress verification, Tier 1 bindings, and content cycle setup.

## Modes

- **Default**: Full pipeline — Notion records + WP verification + bindings + content cycle.
- **`--verify-only`**: Run Step 3 only (WP verification checklist). Skip all Notion steps.

---

## Step 0: Scaffold Claude Config (new servers only)

Skip this step if the server already has a `.claude/` directory.

Ask for the following before running the installer:
- Server root path
- WordPress root path
- DB table prefix (default: `wp_`)
- Portal Site ID

Run the Voyager Skills installer:

```bash
voyager-skills/install.sh \
  --domain=<domain> \
  --name="<Client Name>" \
  --wp-root=<wp-root-path> \
  --db-prefix=<prefix> \
  --portal-site-id=<id> \
  --target=<server-root>
```

Verify the following were created:
- `CLAUDE.md`
- `.mcp.json`
- `settings.json`
- 10 skills installed
- 3 hooks registered

If any are missing, report what failed and do not proceed until resolved.

---

## Step 1: Resolve or Create Client in Notion

Search the Client Profiles DB (`collection://1e9bfa0d-34b6-4864-a693-9118c8f71033`) for the client name.

- **If found**: Note the page ID and proceed to Step 2.
- **If not found**: Ask the user for:
  - Client name
  - Primary contact name
  - Primary contact email
  - Industry

  Confirm before creating. Then create the record via `notion-create-pages` in the Client Profiles DB with the fields above.

Never create a duplicate record. If unsure, ask the user to confirm the match before proceeding.

---

## Step 2: Verify or Create Website Record

Search the Websites DB (`c6685c2d-de74-48ef-8225-ffdbc63ee1a8`) for the client's domain.

- **If found**: Confirm the record is linked to the correct client page and note the page ID.
- **If not found**: Ask the user for:
  - Domain (e.g., `example.com`)
  - Full URL (e.g., `https://example.com`)
  - Hosting provider

  Confirm before creating. Then create the Website record linked to the client page with:
  - Stage: `Prod`
  - Status: `Active`

---

## Step 3: Verify WordPress Setup

### Local sites (WP-CLI)

Run the following WP-CLI command on the server:

```bash
wp --path=$WP_ROOT --user=1 eval '
require_once ABSPATH . "wp-admin/includes/plugin.php";

// Required plugins
$plugins = [
  "voyager-orbit/voyager-core.php",
  "voyager-blocks/voyager-blocks.php",
  "seo-by-rank-math/seo-by-rank-math.php",
];
foreach ($plugins as $p) {
  echo (is_plugin_active($p) ? "✅" : "❌") . " $p\n";
}

// Theme
$theme = wp_get_theme();
echo ($theme->get("Name") === "Voyager" ? "✅" : "❌") . " Theme: " . $theme->get("Name") . "\n";

// Portal registration
$portal_id = get_option("voyager_portal_site_id", "");
echo ($portal_id ? "✅ Portal registered (ID: $portal_id)" : "❌ Portal not registered") . "\n";

// Abilities API
if (function_exists("wp_get_abilities")) {
  echo "✅ " . count(wp_get_abilities()) . " abilities available\n";
} else {
  echo "❌ Abilities API not active\n";
}

// CPTs
$required_cpts = ["service_area", "industry_page", "neighborhood", "portfolio", "team"];
foreach ($required_cpts as $cpt) {
  echo (post_type_exists($cpt) ? "✅" : "❌") . " CPT: $cpt\n";
}

// Binding sources
$binding_sources = [
  "voyager/post-meta-text",
  "voyager/site-data",
  "voyager/contextual-cta",
  "voyager/geo",
];
$registered_sources = function_exists("wp_get_registered_block_bindings_sources")
  ? array_keys(wp_get_registered_block_bindings_sources())
  : [];
foreach ($binding_sources as $src) {
  echo (in_array($src, $registered_sources) ? "✅" : "❌") . " Binding: $src\n";
}
'
```

### Remote sites (Portal MCP)

For remote sites without direct SSH access, use `wp_get_post(site)` to verify Portal connectivity is active. Note that full WP-CLI verification (plugin versions, CPTs, binding sources) requires SSH access and cannot be completed remotely through the Portal alone.

### Verification checklist

Report each item as pass or fail:

| Check | Expected |
|---|---|
| Orbit (voyager-orbit) | Active, v1.39.0+ |
| Blocks (voyager-blocks) | Active |
| RankMath (seo-by-rank-math) | Active |
| Abilities API (`wp_get_abilities`) | Active |
| Portal registered | `voyager_portal_site_id` option present |
| Theme | Voyager theme active |
| CPTs | `service_area`, `industry_page`, `neighborhood`, `portfolio`, `team` all registered |
| Binding sources | `voyager/post-meta-text`, `voyager/site-data`, `voyager/contextual-cta`, `voyager/geo` all registered |

If `--verify-only` was passed, stop here and output the checklist results.

---

## Step 3b: Provision Site Data (Tier 1 Bindings)

Ask for or look up the following site data fields. If the client has an existing Website record in Notion, check there first before prompting.

Required fields:
- Phone number
- Email address
- Street address
- City
- State
- ZIP code
- Business hours (e.g., `Mon–Fri: 8am–5pm`)
- Social URLs (Facebook, Instagram, LinkedIn — as applicable)

Once all fields are gathered, execute the `voyager-orbit/provision-site-data` ability via WP-CLI:

```bash
wp --path=$WP_ROOT --user=1 eval '
do_action("voyager_run_ability", "voyager-orbit/provision-site-data", [
  "phone"   => "<phone>",
  "email"   => "<email>",
  "address" => "<street>",
  "city"    => "<city>",
  "state"   => "<state>",
  "zip"     => "<zip>",
  "hours"   => "<hours>",
  "social"  => [
    "facebook"  => "<facebook_url>",
    "instagram" => "<instagram_url>",
    "linkedin"  => "<linkedin_url>",
  ],
]);
echo "Site data provisioned.\n";
'
```

This populates the `voyager_site_*` options used by the `voyager/site-data` binding source across all blocks.

---

## Step 3c: Verify Pattern Cloud Sync

Check the `pattern_cloud_url` setting in `voyager_blocks_settings`:

```bash
wp --path=$WP_ROOT --user=1 eval '
$settings = get_option("voyager_blocks_settings", []);
$url = $settings["pattern_cloud_url"] ?? "";
echo $url ? "✅ Pattern Cloud URL: $url\n" : "❌ Pattern Cloud URL not set\n";
'
```

If empty, set the default URL and trigger a sync:

```bash
wp --path=$WP_ROOT --user=1 eval '
$settings = get_option("voyager_blocks_settings", []);
$settings["pattern_cloud_url"] = "https://v3.voyagermark.com/wp-json/voyager-blocks/v1/patterns/manifest";
update_option("voyager_blocks_settings", $settings);
do_action("voyager_run_ability", "voyager-blocks/sync-patterns", []);
echo "Pattern Cloud URL set and sync triggered.\n";
'
```

Report the number of patterns synced after the ability runs.

---

## Step 4: Create First Content Cycle in Notion

Search the Content Cycles DB (`collection://dcff4afb-e469-481f-929c-cd23cc87f822`) for an existing cycle linked to this client in the current month.

- **If found**: Note the cycle page ID and proceed to Step 5.
- **If not found**: Confirm before creating. Create a new Content Cycle with:
  - Title: `"<Client Name> — <Month Year>"` (e.g., `"Acme Plumbing — April 2026"`)
  - Client: linked to client page from Step 1
  - Month: first day of the target month as a date (e.g., `2026-04-01`)

---

## Step 5: Create Initial Content Items

Ask the user for:
- Number of blog posts per month
- Number of pages (if any)
- Any specific target keywords (optional)

Confirm the count before creating. For each item, create a record in the Content DB (`cba94900-3a60-4292-ba6b-f8aeea62e439`) with:
- Title: working title or keyword-based placeholder
- Client: linked to client page
- Content Cycle: linked to cycle from Step 4
- Status:
  - `"💡 Idea"` — if no keyword provided
  - `"Up Next"` — if a target keyword was provided

Do not create items without user confirmation of the count and titles.

---

## Step 6: Summary Report

Output a summary in this format:

```
## Client Onboarding: {Client Name}

### Notion
- Client Profile: {found | created} (ID: {page_id})
- Website Record: {found | created} — {domain}
- Content Cycle: {found | created} — {cycle title}
- Content Items: {N} items created ({M} with keywords, {K} as ideas)

### WordPress ({domain})
- Orbit: {version} — {active | ❌ INACTIVE}
- Blocks: {active | ❌ INACTIVE}
- RankMath: {active | ❌ INACTIVE}
- Abilities API: {N} abilities — {active | ❌ INACTIVE}
- Portal ID: {id | ❌ NOT REGISTERED}
- Theme: {name} — {Voyager | ❌ NOT VOYAGER}
- CPTs: {all present | list missing}
- Binding Sources: {all present | list missing}
- Pattern Cloud: {N} patterns synced

### Tier 1 Bindings
- Site data provisioned: phone, email, address, hours, social

### Next Steps
- pSEO setup: use /pseo
- Content pipeline: use /content-brief
```

If any step failed, list what succeeded and what requires manual attention before the client is considered fully onboarded.

---

## Guardrails

- **Always confirm** before creating any Notion record (client profile, website, cycle, or content items).
- **Never skip** WordPress verification — even for clients being added to Notion only.
- **Never create duplicates** — search before creating. If a near-match is found, show it to the user and ask to confirm.
- **Report failures clearly** — if a WP-CLI command fails or a Notion write fails, state what succeeded, what failed, and what the user needs to do manually.
- **Content Cycle Month** must always be the first day of the target month (e.g., `2026-04-01` for April 2026).
- **Remote sites** — when SSH is not available, note in the summary which WP verification checks could not be run and recommend the user run them manually or via a local session.
