---
description: Run a health check across all Voyager client sites
argument-hint: "[--site=domain] [--notify]"
---

# /fleet-health

Check health status across the Voyager client fleet. Arguments: $ARGUMENTS

Follow the SKILL.md pipeline:

- For the local site, call `voyager-orbit/fleet-site-status` ability via WP-CLI.
- For remote client sites, use the MCP ability execution path via AbilityBridge REST.
- If `--site=domain` is provided, check only that specific site.
- Grade each site: Healthy (all plugins active, Portal registered, binding sources >= 3), Warning (missing config or outdated versions), Critical (Portal not registered, core plugins missing).
- Produce a summary with total sites, counts by grade, issues list, and recommendations.
- If `--notify` is passed, send the summary to Slack #fleet-ops via `slack_send_message`.
- This skill is also used as a weekly scheduled agent (Mondays 9 AM ET) to catch plugin drift and stale patterns.
