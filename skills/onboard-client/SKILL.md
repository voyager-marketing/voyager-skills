---
name: onboard-client
description: "Use this skill when the user asks to onboard a new client, set up a new client, add a client site, or verify a client's WordPress setup."
argument-hint: "<client-name> [--verify-only] [--site=domain]"
allowed-tools: [Bash, Read, Grep, Glob, Agent, mcp__claude_ai_Notion__notion-search, mcp__claude_ai_Notion__notion-fetch, mcp__claude_ai_Notion__notion-create-pages, mcp__claude_ai_Notion__notion-update-page, mcp__claude_ai_Notion__notion-query-database-view]
user-invocable: true
---

# Client Onboarding Automation

Onboard a new client across Notion and WordPress, or verify an existing client's setup. Uses MCP tools for Notion and WP-CLI for WordPress.

## Notion IDs

| Database | ID |
|----------|----|
| Client Profiles | `collection://1e9bfa0d-34b6-4864-a693-9118c8f71033` |
| Websites | `collection://f12cc677-9dd3-499d-b23e-9c7873c5620f` |
| Content Cycles | `collection://dcff4afb-e469-481f-929c-cd23cc87f822` |
| Content | `collection://cfda5145-1b35-4980-934d-d2f26ead562c` |

## WP Root

The WP root path is defined in the project's CLAUDE.md. Use `WP_ROOT` from that file, or resolve it via:
```bash
wp --info --format=json | jq -r '.wp_root'
```

## Modes

### `--verify-only` (check existing setup)

Verify a client's WordPress site is properly configured. Skip Notion steps and go directly to Step 3 (Verify WordPress Setup). Report the checklist and exit.

### default (full onboard)

Complete client onboarding across Notion + WordPress. Execute all steps below in order.

## Pipeline Steps

### Step 0: Scaffold Claude Config (new servers only)

If this is a brand new client server (no `.claude/` directory exists yet), scaffold the Claude Code config before anything else.

Ask the user:
- Server root path (e.g. `/sites/client.com`)
- WP root path (e.g. `/sites/client.com/files/`)
- DB prefix (default: `tgn_`)
- Portal Site ID (can be filled in after Portal registration)

Then run the installer from the voyager-skills repo:

```bash
voyager-skills/install.sh \
  --domain=<client-domain> \
  --name="<Client Name>" \
  --wp-root=<wp-root> \
  --db-prefix=<db-prefix> \
  --portal-site-id=<portal-id> \
  --target=<server-root>
```

Verify the output:
- ✅ `<server-root>/CLAUDE.md` created
- ✅ `<server-root>/.mcp.json` created with correct `--path`
- ✅ `<server-root>/.claude/settings.json` created
- ✅ `<server-root>/.claude/skills/` populated (10 skills)
- ✅ `<server-root>/.claude/hooks/` populated (3 hooks)

If the server already has a `.claude/` directory, skip this step.

### Step 1: Resolve or Create Client in Notion

Search the Client Profiles DB (`collection://1e9bfa0d-34b6-4864-a693-9118c8f71033`) for the client name:

```
notion-search: query="<client-name>" filter_type="page"
```

Look for matches within the Client Profiles collection. If found, fetch the page and note the client page URL for linking.

If not found, ask the user for details:
- Client name
- Contact name
- Contact email
- Industry/vertical

Then create the Client Profile page:
```
notion-create-pages:
  parent_type: "database"
  parent_id: "1e9bfa0d-34b6-4864-a693-9118c8f71033"
  title: "<Client Name>"
  properties: (as gathered from user)
```

Note the client page URL for linking in subsequent steps.

### Step 2: Verify or Create Website Record

Search the Websites DB (`collection://f12cc677-9dd3-499d-b23e-9c7873c5620f`) for the client's domain:

```
notion-search: query="<domain>" filter_type="page"
```

If not found, ask the user for:
- Domain name
- Site URL
- Hosting provider
- DNS provider

Create the Website record linked to the Client:
```
notion-create-pages:
  parent_type: "database"
  parent_id: "f12cc677-9dd3-499d-b23e-9c7873c5620f"
  title: "<domain>"
  properties:
    "Stage": "Prod"
    "Status": "Active"
    "Client": relation to client page
```

Ensure Stage = "Prod" and Status = "Active".

### Step 3: Verify WordPress Setup

Use WP-CLI with the WP root from CLAUDE.md:
```bash
wp --path=$WP_ROOT --user=1 eval '
// Check required plugins
$plugins = [
    "voyager-orbit/voyager-core.php",
    "voyager-blocks/voyager-blocks.php",
    "voyager-core/voyager-core.php",
    "seo-by-rank-math/seo-by-rank-math.php",
];
foreach ($plugins as $p) {
    $active = is_plugin_active($p);
    echo ($active ? "✅" : "❌") . " $p\n";
}

// Check theme
$theme = wp_get_theme();
echo "\nTheme: " . $theme->get("Name") . " v" . $theme->get("Version") . "\n";
$is_voyager = strpos(strtolower($theme->get("Name")), "voyager") !== false
    || strpos(strtolower($theme->get_template()), "voyager") !== false;
echo ($is_voyager ? "✅" : "❌") . " Voyager theme active\n";

// Check Portal registration
$portal_id = get_option("voyager_portal_site_id", "");
echo ($portal_id ? "✅ Portal registered (ID: $portal_id)" : "❌ Portal not registered") . "\n";

// Check CPTs
$cpts = get_post_types(["_builtin" => false], "names");
$voyager_cpts = array_filter($cpts, function($t) { return strpos($t, "voyager") !== false; });
echo (count($voyager_cpts) > 0 ? "✅" : "❌") . " CPTs registered: " . implode(", ", $voyager_cpts) . "\n";

// Check abilities
if (function_exists("wp_get_abilities")) {
    $abilities = wp_get_abilities();
    echo "✅ " . count($abilities) . " abilities available\n";
} else {
    echo "❌ Abilities API not active\n";
}

// Plugin versions
$orbit = get_plugin_data(WP_PLUGIN_DIR . "/voyager-orbit/voyager-core.php", false);
$blocks = get_plugin_data(WP_PLUGIN_DIR . "/voyager-blocks/voyager-blocks.php", false);
echo "\nVersions:\n";
echo "  Orbit: " . ($orbit["Version"] ?? "n/a") . "\n";
echo "  Blocks: " . ($blocks["Version"] ?? "n/a") . "\n";
'
```

For remote sites, use the MCP ability `voyager-orbit/verify-setup` via AbilityBridge. Note this for the user if the site is not local.

Report a checklist:
- ✅/❌ Orbit active (v1.39.0+)
- ✅/❌ Blocks active (v1.0.0+)
- ✅/❌ Core active (v1.0.0+)
- ✅/❌ RankMath active
- ✅/❌ Abilities API active
- ✅/❌ MCP Adapter active
- ✅/❌ Portal registered
- ✅/❌ Theme correct
- ✅/❌ CPTs registered (service_area, industry_page, neighborhood, portfolio, team, services, testimonials)
- ✅/❌ Binding sources active (voyager/post-meta-text, voyager/site-data, voyager/contextual-cta, voyager/geo)

If `--verify-only` mode, stop here and display the checklist.

### Step 3b: Provision Site Data (Tier 1 Bindings)

After verifying WordPress, provision the client's site data for block bindings. Ask the user for (or look up from the Notion Client Profile):

- Business phone number
- Business email
- Street address, city, state, ZIP
- Business hours
- Social media URLs (Facebook, Instagram, LinkedIn, X)

Then execute the `voyager-orbit/provision-site-data` ability:

```bash
wp --path=$WP_ROOT --user=1 eval '
$ability = wp_get_ability("voyager-orbit/provision-site-data");
$result = $ability->execute([
    "phone"            => "(555) 123-4567",
    "email"            => "hello@client.com",
    "address"          => "123 Main St",
    "address_city"     => "Denver",
    "address_state"    => "CO",
    "address_zip"      => "80202",
    "hours"            => "Mon-Fri 9am-5pm MST",
    "social_facebook"  => "https://facebook.com/clientpage",
    "social_instagram" => "https://instagram.com/clientprofile",
    "social_linkedin"  => "https://linkedin.com/company/client",
    "social_x"         => "https://x.com/clienthandle",
]);
echo json_encode($result, JSON_PRETTY_PRINT);
'
```

This populates all `voyager_site_*` options used by the `voyager/site-data` binding source. The site footer, header contact info, and CTAs will immediately reflect the client's data.

### Step 3c: Verify Pattern Cloud Sync

Ensure the client site has Pattern Cloud configured:

```bash
wp --path=$WP_ROOT option get voyager_blocks_settings --format=json | jq '.pattern_cloud_url'
```

If empty, set it:
```bash
wp --path=$WP_ROOT option patch insert voyager_blocks_settings pattern_cloud_url 'https://v3.voyagermark.com/wp-json/voyager-blocks/v1/patterns/manifest'
```

Then trigger a sync:
```bash
wp --path=$WP_ROOT eval '
$ability = wp_get_ability("voyager-blocks/sync-patterns");
if ($ability) { echo json_encode($ability->execute(["action" => "refresh"])); }
'
```

### Step 4: Create First Content Cycle in Notion

Search the Content Cycles DB (`collection://dcff4afb-e469-481f-929c-cd23cc87f822`) for existing cycles for this client:

```
notion-search: query="<client-name>" filter_type="page"
```

Filter results to the Content Cycles collection. If no cycle exists for the current month, create one:

```
notion-create-pages:
  parent_type: "database"
  parent_id: "dcff4afb-e469-481f-929c-cd23cc87f822"
  title: "<Client Name> — <Month Year>"
  properties:
    "Client": relation to client page
    "Month": current month date
```

Example title: "Built Right Homes — April 2026"

### Step 5: Create Initial Content Items

Ask the user:
- How many blog posts per month?
- How many pages?
- Any specific keywords to start with?

Create Content items in the Content DB (`collection://cfda5145-1b35-4980-934d-d2f26ead562c`):

```
notion-create-pages:
  parent_type: "database"
  parent_id: "cfda5145-1b35-4980-934d-d2f26ead562c"
  title: "<placeholder or keyword-based title>"
  properties:
    "Client": relation to client page
    "Cycle": relation to cycle page
    "Type": "Blog" or "Page"
    "Status": "💡 Idea" or "Up Next"
    "Keyword": keyword if provided
    "Month": current month date
```

Create one item per blog post and per page requested. If keywords were provided, distribute them across items. If no keywords, set Status to "💡 Idea" so the SEO Cycle Planner can assign them later.

### Step 6: Summary Report

Display the full onboarding summary:

```
## Client Onboarding: {Client Name}

### Notion
- ✅ Client Profile: {link}
- ✅ Website Record: {domain}
- ✅ Content Cycle: {month}
- ✅ Content Items: {count} created

### WordPress ({domain})
- ✅ Orbit v{version} — {n} abilities
- ✅ Blocks v{version} — {n} binding sources
- ✅ Core v{version} — CPTs registered
- ✅ RankMath v{version}
- ✅ Portal registered (ID: {site_id})
- ✅ Pattern Cloud synced ({n} patterns)

### Tier 1 Bindings (Active)
- ✅ Site data provisioned (phone, email, address, hours, social)
- ✅ voyager/site-data — footer, header, contact info
- ✅ voyager/contextual-cta — smart CTAs per page type
- ✅ voyager/geo — visitor location personalization

### Ready for:
- Tier 1: Smart bindings active on all pages
- Tier 2: pSEO city pages via batch-create-service-areas
- Content pipeline: SEO Cycle Planner → Draft Writer → Publisher
```

## Guardrails

1. **Always confirm before creating Notion records** -- show the user what will be created and ask for approval
2. **Never skip the WordPress verification** -- even in full onboard mode, always run Step 3
3. **Never create duplicate records** -- always search first before creating in any Notion DB
4. **Use relations correctly** -- Client, Cycle, and Website records must be properly linked
5. **Report failures clearly** -- if any step fails, report what succeeded and what needs manual attention

## Important Notes

- **WP Root:** Resolve from CLAUDE.md or `wp --info`
- **DB Prefix:** Use `$wpdb->prefix` — do not hardcode
- Remote site verification is not yet implemented -- note this for the user and suggest manual checks or Portal Bridge when available
- The Content Cycles DB uses a "Month" date property -- set it to the first day of the target month (e.g., `2026-04-01`)
- Content items with no keyword should be set to "💡 Idea" status so the SEO Cycle Planner skill can assign keywords later
