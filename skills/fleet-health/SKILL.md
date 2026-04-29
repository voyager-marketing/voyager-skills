---
name: fleet-health
description: "Use when asked to check fleet health, run fleet monitoring, audit all client sites, check binding health across the fleet, or check site status across the Voyager client fleet. Default mode covers infra (plugins, Portal registration, tier, Pattern Cloud). `--bindings` covers binding-source health (empty fields, fallback rates, Notion connectivity)."
argument-hint: "[--site=domain] [--bindings] [--threshold=20] [--notify]"
user-invocable: true
owner: Ben
last_reviewed: 2026-04-29
---

# Fleet Health Sweep

Run health checks across all Voyager client sites. Two modes:

- **Default (infra mode)** — plugin versions, Portal registration, tier detection, Pattern Cloud, site data status. Uses the `voyager-orbit/fleet-site-status` ability.
- **`--bindings` mode** — block-binding health: empty required fields, fallback rates, Notion connectivity, pSEO field coverage. Uses three voyager-blocks abilities (formerly the standalone `fleet-binding-audit` skill, merged 2026-04-29).

Both modes run via WP-CLI on the local install and via the Portal MCP / AbilityBridge REST endpoint on remote client sites.

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

## `--bindings` mode — binding health audit

Run when the user asks about binding health, empty pSEO fields, fallback rates, or Notion connectivity. Uses three abilities from `voyager-blocks`:

| Ability | What it returns |
|---|---|
| `voyager-blocks/audit-binding-health` | Field coverage per CPT, empty required fields per site |
| `voyager-blocks/get-binding-stats` | Resolution counts, fallback rates over a window |
| `voyager-blocks/check-notion-health` | Notion API connectivity, cache freshness |

### Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| Empty required fields | >10% | >20% |
| Fallback rate (null bindings) | >15% | >30% |
| Notion API unreachable | — | Any |
| Days since last binding resolution | >7 | >14 |

`--threshold=20` overrides the empty-field critical threshold.

### Local site call

```bash
wp --path=$WP_ROOT --user=1 eval '
$audit  = wp_get_ability("voyager-blocks/audit-binding-health");
$stats  = wp_get_ability("voyager-blocks/get-binding-stats");
$notion = wp_get_ability("voyager-blocks/check-notion-health");

echo "=== Binding Health ===\n";
echo json_encode($audit->execute([]), JSON_PRETTY_PRINT);

echo "\n\n=== Binding Stats (30d) ===\n";
echo json_encode($stats->execute(["days" => 30]), JSON_PRETTY_PRINT);

echo "\n\n=== Notion Health ===\n";
echo json_encode($notion->execute([]), JSON_PRETTY_PRINT);
'
```

### Remote sites

Same three abilities via AbilityBridge REST endpoint:
`POST /voyager/v1/abilities/execute` with `{"ability": "voyager-blocks/<ability-name>"}`.

### `--bindings` output format

```
## Fleet Binding Audit — {date}

### Summary
- Sites audited: {n}
- Healthy: {n} | Warning: {n} | Critical: {n}
- Total bindings resolved (30d): {n}
- Fleet fallback rate: {n}%

### Sites needing attention
| Site | Issue | Empty Fields | Fallback Rate |
|---|---|---|---|
| {domain} | {description} | {n}/{total} | {n}% |

### pSEO coverage
| Site | Service Areas | Avg Field Coverage | Fully Populated |
|---|---|---|---|
| {domain} | {n} pages | {n}% | {n}/{total} |

### Recommendations
- {site}: Enrich {n} service area pages with missing fields
- {site}: Notion API token expired — reconfigure
```

## Scheduled agent use

Two recommended schedules:

- **Monday 9:00 AM ET — infra mode** (default). Catches plugin drift, missing configs, stale Pattern Cloud. Reports to Notion fleet status page + Slack `#fleet-ops`.
- **Wednesday 10:00 AM ET — `--bindings` mode**. Catches stale pSEO data, broken Notion connections, field drift. Same notification path. Flag sites with >20% empty fields for enrichment.
