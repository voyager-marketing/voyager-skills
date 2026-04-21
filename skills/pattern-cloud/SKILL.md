---
name: pattern-cloud
description: "Use this skill when the user asks to sync patterns to client sites, check pattern cloud status, export patterns, manage the pattern library, or push patterns to the fleet."
argument-hint: "[sync site.com] [sync-all] [status] [export]"
allowed-tools: [Bash, Read, Grep, Glob, Agent, TodoWrite, mcp__wordpress__mcp-adapter-execute-ability]
user-invocable: true
owner: Ben
last_reviewed: 2026-04-21
---

# Pattern Cloud — Managed Pattern Library

Sync Voyager's 114+ patterns to client sites via the Pattern Cloud. Patterns are served from v3.voyagermark.com and cached on client sites for 24 hours.

## WP Root

The WP root path is defined in the project's CLAUDE.md. Use `WP_ROOT` from that file. All WP-CLI commands should be run with `--path=$WP_ROOT`.

## Commands

### `export` — Generate fresh manifest
Generate the pattern manifest from the source site and show the count.

```bash
wp eval "
\$manifest = voyager_blocks_export_pattern_manifest();
echo 'Version: ' . \$manifest['version'] . PHP_EOL;
echo 'Patterns: ' . \$manifest['count'] . PHP_EOL;
echo 'Generated: ' . \$manifest['generated'] . PHP_EOL;
" --path=$WP_ROOT
```

### `status` — Check sync status
Show which settings are configured and when patterns were last synced.

```bash
wp eval "
\$meta = get_option('voyager_blocks_remote_patterns_meta', []);
\$settings = get_option('voyager_blocks_settings', []);
echo 'Cloud URL: ' . (\$settings['pattern_cloud_url'] ?? '(not set)') . PHP_EOL;
echo 'Auto-Sync: ' . ((\$settings['pattern_cloud_auto_sync'] ?? true) ? 'ON' : 'OFF') . PHP_EOL;
echo 'Last Synced: ' . (\$meta['last_synced'] ?? 'never') . PHP_EOL;
echo 'Remote Count: ' . (\$meta['count'] ?? 0) . PHP_EOL;
echo 'Source Version: ' . (\$meta['version'] ?? 'unknown') . PHP_EOL;
" --path=$WP_ROOT
```

### `sync [site]` — Push patterns to a specific client site
Force-refresh a client site's pattern cache via MCP.

Use the MCP tool `pattern_sync_to_site` with the site domain:
```bash
# Via WP-CLI on the target site (if local)
wp eval "
delete_transient('voyager_blocks_remote_patterns');
\$patterns = voyager_blocks_fetch_remote_patterns();
echo 'Synced ' . count(\$patterns) . ' patterns' . PHP_EOL;
" --path=$WP_ROOT
```

Or describe to the user that they should use the MCP tool `pattern_sync_to_site` with the site domain.

### `sync-all` — Push to all fleet sites
Iterate through all configured MCP sites and sync each one.

Note: This requires the MCP Server. Describe the process:
1. Get site list from MCP fleet
2. For each site, call `pattern_sync_to_site`
3. Report results per site

## Setup (Client Sites)

To enable Pattern Cloud on a client site:
1. Go to Settings > Voyager Blocks > Pattern Config
2. Set Pattern Cloud URL: `https://v3.voyagermark.com/wp-json/voyager-blocks/v1/patterns/manifest`
3. Enable Auto-Sync (on by default)
4. Patterns appear in the editor within 24 hours (or immediately after manual sync)

## Architecture

```
v3 (source)     →  REST endpoint  →  Client sites
114+ patterns   →  JSON manifest  →  Transient cache (24h)
                                  →  register_block_pattern()
```
