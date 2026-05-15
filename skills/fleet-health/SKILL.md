---
name: fleet-health
description: "Use when asked to check fleet health, run fleet monitoring, audit all client sites, check binding health across the fleet, or check site status across the Voyager client fleet. Default mode covers infra. `--bindings` covers binding-source health."
argument-hint: "[--site=domain] [--bindings|--both] [--threshold=20] [--notify]"
allowed-tools: [mcp__claude_ai_Voyager_MCP__wp_fleet_health]
user-invocable: true
owner: Ben
last_reviewed: 2026-05-15
distribution: internal
origin: voyager
mcp_requirement: required
logic_type: tool-wrapper
surface: all
---

# Fleet Health Sweep

Run fleet health through the Voyager MCP `wp_fleet_health` composite. The MCP owns site fanout, AbilityBridge calls, health grading, binding thresholds, and partial-failure handling. The skill owns intent routing, report formatting, optional Slack notification, and scheduled-agent guidance.

## Modes

- Default infra mode: `mode="infra"`. Checks plugin status, Portal registration, tier detection, Pattern Cloud, site data, and binding-source count.
- `--bindings`: `mode="bindings"`. Checks empty required fields, fallback rates, Notion connectivity, stale binding resolution, and pSEO coverage.
- `--both`: `mode="both"`. Runs infra and bindings in one server-side sweep.

## Arguments

- `--site=domain`: pass as `site_filter` to check one matching domain/name/site ID.
- `--threshold=20`: pass as `threshold_overrides.empty_field_critical_pct`. Default critical threshold is 20%.
- `--notify`: after rendering the report, send the summary to Slack `#fleet-ops` if Slack tools are available.

## MCP Call

```ts
wp_fleet_health({
  mode,
  site_filter,
  threshold_overrides: {
    empty_field_critical_pct,
    fallback_critical_pct
  }
})
```

Expected return:

```ts
{
  summary: {
    total: number,
    healthy: number,
    warning: number,
    critical: number,
    fleet_fallback_rate_30d?: number
  },
  sites: [{
    domain: string,
    name: string,
    grade: "healthy" | "warning" | "critical",
    issues: string[],
    recommendations: string[],
    infra?: object,
    bindings?: object
  }]
}
```

## Output

```md
## Fleet Health Report — {date}

### Summary
- Total sites: {total}
- Healthy: {healthy} | Warning: {warning} | Critical: {critical}
- Fleet fallback rate: {fleet_fallback_rate_30d}% (bindings/both only)

### Sites Needing Attention
| Site | Grade | Issues | Recommended Action |
|---|---|---|---|
| {domain} | {grade} | {top issues} | {top recommendation} |

### Healthy Sites
- {domain}
```

For `--bindings`, include a second table when fields are present:

```md
### Binding Coverage
| Site | Empty Required Fields | Fallback Rate | Notion | Total Resolved 30d |
|---|---:|---:|---|---:|
```

## Notification

If `--notify` is passed, post the summary block and the top critical/warning sites to Slack `#fleet-ops`. Do not post raw site payloads.

## Scheduled Agent Use

- Monday 9:00 AM ET: infra mode. Catches plugin drift, missing configs, stale Pattern Cloud, and onboarding gaps.
- Wednesday 10:00 AM ET: `--bindings --threshold=20`. Catches stale pSEO data, broken Notion connections, and field drift.

## Guardrails

1. Do not call WP-CLI or individual abilities from the skill; use `wp_fleet_health`.
2. Do not change site state. This skill is read-only except optional Slack notification.
3. Treat `critical` sites as needing human review, not automatic remediation.
4. If the MCP returns partial failures, show them clearly under the affected site.
5. Do not hide healthy sites entirely; include a compact healthy count/list so scheduled runs are auditable.
