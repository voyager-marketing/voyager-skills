---
name: fleet-health
description: "Use this skill when the user asks to check fleet health, run fleet monitoring, audit all client sites, or check site status across the fleet."
argument-hint: "[--site=domain] [--notify]"
allowed-tools: [Bash, Read, Grep, Glob, Agent, mcp__claude_ai_Notion__notion-search, mcp__claude_ai_Notion__notion-create-pages, mcp__claude_ai_Notion__notion-update-page, mcp__claude_ai_Slack__slack_send_message]
user-invocable: true
---

# Fleet Health Sweep

Run a comprehensive health check across all Voyager client sites. Uses the `fleet-site-status` ability via MCP or local WP-CLI.

## What It Checks Per Site

Uses the `voyager-orbit/fleet-site-status` ability which returns:
- Plugin versions (Orbit, Blocks, Core)
- Portal registration status
- Binding sources count
- Abilities count
- Pattern Cloud configuration
- Site data population
- CPTs registered
- Detected tier (tier-1, tier-2, tier-3, unconfigured)

## WP Root

The WP root path is defined in the project's CLAUDE.md. Use `WP_ROOT` from that file.

## For Local Site

```bash
wp --path=$WP_ROOT --user=1 eval '
$ability = wp_get_ability("voyager-orbit/fleet-site-status");
$result = $ability->execute([]);
echo json_encode($result, JSON_PRETTY_PRINT);
'
```

## For Remote Client Sites (via MCP)

Use the MCP ability execution path:
```
wp_execute_ability → voyager-orbit/fleet-site-status
```

Each client site with Orbit installed exposes this ability via AbilityBridge REST API.

## Health Grading

| Grade | Criteria |
|-------|----------|
| **Healthy** | All plugins active, Portal registered, tier detected, binding sources >= 3 |
| **Warning** | Missing Pattern Cloud config, site data not populated, outdated plugin version |
| **Critical** | Portal not registered, Orbit/Blocks/Core missing, 0 binding sources |

## Output Format

After checking all sites, produce a summary:

```
## Fleet Health Report — {date}

### Summary
- Total sites: {n}
- Healthy: {n} | Warning: {n} | Critical: {n}

### Issues Found
- {site}: {issue description}
- {site}: {issue description}

### Recommendations
- {actionable recommendation}
```

## Notification

If `--notify` is passed, send the summary to Slack channel #fleet-ops using:
```
slack_send_message: channel=#fleet-ops, text={summary}
```

## Scheduled Agent Use

This skill is designed to run as a weekly managed agent:
- **Schedule:** Monday 9:00 AM ET
- **Purpose:** Catch plugin drift, missing configs, stale patterns
- **Action:** Report to Notion fleet status page + Slack notification
