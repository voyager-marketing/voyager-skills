---
description: Onboard a new client across Notion and WordPress
argument-hint: "<client-name> [--verify-only] [--site=domain]"
---

# /onboard-client

Onboard a new client or verify an existing setup. Arguments: $ARGUMENTS

Follow the SKILL.md pipeline:

- `--verify-only`: Skip Notion steps. Run only the WordPress verification checklist (Step 3) and exit.
- Default (full onboard): Execute all steps in order.
- **Step 0** (new servers only): Scaffold Claude config using `voyager-skills/install.sh` if no `.claude/` directory exists.
- **Step 1**: Search Notion Client Profiles DB. Create profile if not found (confirm first).
- **Step 2**: Search Notion Websites DB. Create website record linked to client if not found.
- **Step 3**: Verify WordPress setup via WP-CLI — plugins, theme, Portal registration, CPTs, abilities.
- **Step 3b**: Provision site data (phone, email, address, hours, social) via `voyager-orbit/provision-site-data`.
- **Step 3c**: Verify Pattern Cloud sync; set URL and trigger refresh if not configured.
- **Step 4**: Create first Content Cycle in Notion for the current month.
- **Step 5**: Ask user for content volume/keywords, create initial Content items in Notion.
- **Step 6**: Display full onboarding summary. Report failures clearly for any step that didn't complete.
- Never create duplicate Notion records — always search before creating.
