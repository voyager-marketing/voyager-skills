---
name: fleet-health
description: "Use when asked to check fleet health, run fleet monitoring, audit all client sites, or check site status across the Voyager client fleet."
argument-hint: "[--site=domain] [--notify]"
user-invocable: true
---

# Fleet Health Sweep

Run a comprehensive health check across all Voyager client sites. Uses the `fleet-site-status` ability via WP-CLI or Portal MCP.

## What It Checks Per Site

Uses `voyager-orbit/fleet-site-status` ability which returns:
- Plugin versions (Orbit, Blocks, Core)
- Portal registration status
- Binding sources count + abilities count
- Pattern Cloud configuration
- Site data population status
- CPTs registered
- Detected tier (tier-1, tier-2, tier-3, unconfigured)

## For Local Site (WP-CLI)

```bash
wp --path=$WP_ROOT --user=1 eval '
$ability = wp_get_ability("voyager-orbit/fleet-site-status");
$result = $ability->execute([]);
echo json_encode($result, JSON_PRETTY_PRINT);
'
```

## For Remote Client Sites

Use the Portal Bridge via AbilityBridge REST endpoint:
`POST /voyager/v1/abilities/execute` with `{"ability": "voyager-orbit/fleet-site-status"}` and HMAC auth.

## Health Grading

| Grade | Criteria |
|-------|----------|
| **Healthy** | All plugins active, Portal registered, tier detected, binding sources >= 3 |
| **Warning** | Missing Pattern Cloud config, site data not populated, outdated plugin version |
| **Critical** | Portal not registered, Orbit/Blocks/Core missing, 0 binding sources |

## Output Format

```
## Fleet Health Report — {date}

### Summary
- Total sites: N | Healthy: N | Warning: N | Critical: N

### Issues Found
- {site}: {issue description}

### Recommendations
- {actionable recommendation}
```

## Notification

If `--notify` is passed, post summary to Slack #fleet-ops:
```
slack_send_message: channel="#fleet-ops", text={summary}
```

## Scheduled Agent Use

Design this to run as a weekly managed agent:
- **Schedule:** Monday 9:00 AM ET
- **Purpose:** Catch plugin drift, missing configs, stale Pattern Cloud
- **Action:** Summary to Notion fleet status page + Slack #fleet-ops
