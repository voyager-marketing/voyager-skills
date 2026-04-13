---
description: Generate a monthly client performance report from Orbit + Notion data
argument-hint: "<client-name> [month] [--notion] [--format=table|markdown]"
---

# /report

Generate a monthly client summary. Arguments: $ARGUMENTS

Follow the SKILL.md pipeline:

- Resolve the client by searching the Notion Client Profiles DB (`collection://1e9bfa0d-34b6-4864-a693-9118c8f71033`).
- Determine the target month (default: current month). Accept "March 2026", "last month", "2026-03", etc.
- Pull lead and analytics data via the `voyager-orbit/generate-client-report` ability (fall back to direct DB queries if ability is unavailable).
- Query the Notion Content DB for content items from the target month.
- Format as a full markdown summary (default) or condensed tables only (`--format=table`).
- If `--notion` is passed, create a Notion page under the client profile and return the URL.
- Always use `$wpdb->prepare()` for any direct DB queries.
- Calculate month-over-month percentage change for lead counts.
- If lead tables do not exist or count is zero, report that clearly rather than erroring.
