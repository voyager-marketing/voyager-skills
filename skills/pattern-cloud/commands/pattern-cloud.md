---
description: Sync Voyager patterns to client sites via the Pattern Cloud
argument-hint: "[sync site.com] [sync-all] [status] [export]"
---

# /pattern-cloud

Manage the Pattern Cloud pattern library. Arguments: $ARGUMENTS

Follow the SKILL.md pipeline:

- `export`: Generate the pattern manifest and show version, count, and generated timestamp.
- `status`: Show Pattern Cloud URL, Auto-Sync on/off, last synced time, remote count, and source version.
- `sync [site]`: Force-refresh a specific client site's pattern cache. Clear the transient and re-fetch from the manifest URL.
- `sync-all`: Iterate all MCP fleet sites and sync each one via `pattern_sync_to_site`. Report per-site results.
- Run WP-CLI commands with `--path=$WP_ROOT` (path from CLAUDE.md).
- Pattern Cloud URL: `https://v3.voyagermark.com/wp-json/voyager-blocks/v1/patterns/manifest`
- Patterns cache for 24 hours. Manual sync clears the transient immediately.
