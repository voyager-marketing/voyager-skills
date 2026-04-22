---
name: voyager-wp-manager
description: "Use this skill when asked to update a client's WordPress site, publish content, change SEO meta, create pSEO pages, or check site health for a specific client."
argument-hint: "<client-name-or-domain> [--task=update|publish|health|pseo]"
allowed-tools: [mcp__claude_ai_Notion__notion-search, mcp__claude_ai_Notion__notion-fetch, mcp__claude_ai_Notion__notion-query-database-view]
user-invocable: true
owner: Ben
last_reviewed: 2026-04-21
---

# voyager-wp-manager

A Chat skill for executing WordPress updates on client sites via the Voyager MCP Server.

> **Lifecycle note.** This skill is **Deprecated** and being run in parallel with its replacements: `fleet-health` + `pattern-cloud` + `client-prep`. Do not retire until the replacements have two weeks of verification in Live status. See the Voyager Skills Hub for the replacement map.

## When to activate

Activate when the user says anything like:
- "Go update [client]'s website"
- "Update the homepage for [client]"
- "Publish a blog post to [domain]"
- "Change the SEO title on [page] for [client]"
- "Push content to [client]'s WordPress site"
- "Create service area pages for [client]"
- "Check what's on [client]'s WordPress site"

## Prerequisites

The Voyager MCP Server must be connected to this Project:
- URL: `voyager-mcp.voyagermark.com/mcp`
- Auth: Bearer token (same as MCP_API_KEY)

If the MCP Server is not connected, tell the user and stop.

## Step-by-step workflow

### Step 1 — Identify the client site
Search Notion for the client name → find their **Websites DB** record.

Extract:
- `domain` — their WordPress site URL
- `voyager_tier` — what capabilities they have
- `orbit_secret` — (MCP Server uses this automatically; don't display it)

If the client isn't in the Websites DB, ask for their domain directly.

### Step 2 — Check site health (always)
Before making any changes, call: `wp_site_health` with `{ "domain": "[domain]" }`

If the site is unhealthy (errors, plugin conflicts, unreachable), report the issues and ask the user how to proceed. Don't attempt changes on a broken site.

### Step 3 — Execute the requested change

**To create or update a post/page:**
```
wp_upsert_content {
  "domain": "[domain]",
  "title": "...",
  "content": "...",
  "status": "publish|draft|future",
  "post_type": "post|page|service_page"
}
```

**To update SEO meta:**
```
wp_set_seo_meta {
  "domain": "[domain]",
  "post_id": [id],
  "title": "...",
  "description": "...",
  "focus_keyword": "..."
}
```

**To get existing content:**
```
wp_get_post {
  "domain": "[domain]",
  "slug": "..." | "post_id": [id]
}
```

**To create pSEO service area pages:**
```
pseo_batch_create {
  "domain": "[domain]",
  "cities": ["City 1, ST", "City 2, ST"],
  "service": "...",
  "skip_existing": true
}
```

**To run any Orbit ability directly:**
```
wp_execute_ability {
  "domain": "[domain]",
  "ability": "voyager-orbit/[ability-name]",
  "input": { ... }
}
```

### Step 4 — Confirm and log
After the change:
- Report what was updated and the URL to verify
- If a new post was created, note the WordPress post ID
- Ask if the user wants to update the Notion Content DB with the result (for published posts)

## What you can do via the MCP Server

| Task | Tool |
|------|------|
| Create/update posts, pages | `wp_upsert_content` |
| Update SEO meta | `wp_set_seo_meta` |
| Get existing content | `wp_get_post` |
| Upload media | `wp_upload_media` |
| Check site health | `wp_site_health` |
| View installed plugins | `wp_plugins_list` |
| Run security scan | `wp_security_scan` |
| Get leads | `leads_list`, `leads_stats` |
| Generate client report | `report_generate` |
| Create pSEO pages | `pseo_batch_create` |
| Run any ability | `wp_execute_ability` |
| Fleet status | `wp_fleet_status` |

## Tier awareness

Check the client's Voyager Tier before suggesting features:

- **Tier 1** — bindings work, site data populated, basic content updates
- **Tier 2** — pSEO city pages, freshness scans, AI content enrichment
- **Tier 3** — Notion sync, Pattern Cloud, full reporting, managed agents
- **Tier 4** — white-label, multi-tenant, agency licensing

If a client is on a lower tier and the task requires a higher tier feature, flag this and suggest upgrading.

## Error handling

| Error | What to do |
|-------|-----------|
| Site unreachable | Report the issue, check BetterStack uptime monitor |
| HMAC auth failure | Orbit Secret may need rotation — ask Ben |
| Ability not found | Client may not have Orbit installed or it's outdated |
| Rate limit | Slow down, batch smaller requests |

## Setup instructions (for adding to the Voyager Marketing Project)

1. Go to claude.ai → Voyager Marketing project → Settings
2. Under MCP Connections → Add custom server
3. URL: `https://voyager-mcp.voyagermark.com/mcp`
4. Auth: Bearer token (get from Ben — same as `MCP_API_KEY` in the MCP server config)
5. Upload this SKILL.md to the Project knowledge base as a user skill
6. Rename the uploaded file to `voyager-wp-manager` in the skills list

Once added, Chat can execute WordPress operations directly from natural language.
