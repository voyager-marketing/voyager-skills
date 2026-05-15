---
description: Run a health check across all Voyager client sites
argument-hint: "[--site=domain] [--bindings|--both] [--threshold=20] [--notify]"
---

# /fleet-health

Check health status across the Voyager client fleet. Arguments: $ARGUMENTS

Follow the SKILL.md pipeline:

- Parse `--site`, `--bindings`, `--both`, `--threshold`, and `--notify`.
- Call `wp_fleet_health` once with `mode`, `site_filter`, and threshold overrides.
- Render summary counts, sites needing attention, recommendations, and binding coverage when returned.
- Do not call WP-CLI, WebFetch, or individual Voyager abilities from this command.
- If `--notify` is passed, send only the summary and top issue list to Slack `#fleet-ops`.
- Monday scheduled runs use default infra mode. Wednesday scheduled runs use `--bindings --threshold=20`.
