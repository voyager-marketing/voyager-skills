---
name: site-sync-local
description: "Use when asked to sync staging to local, refresh a local Laragon database, pull a client site down, or reproduce a staging issue locally. Pulls the staging DB into the local Laragon env (code flows up, data flows down). Never pushes data upstream."
argument-hint: "<slug> [--include-uploads]"
allowed-tools: [Bash, Read]
user-invocable: true
owner: Ben
last_reviewed: 2026-06-10
distribution: internal
origin: voyager
mcp_requirement: none
logic_type: workflow
surface: claude-code
---

# Site Sync (Staging → Local)

Thin orchestrator over the canonical procedure in the Notion KB:
**[How-To] Infra: Deploy, Sync & Rollback (Local ↔ Staging ↔ Production)**
(https://www.notion.so/37b47c03778b81dcbef7e55c2e92ac07). If this file and
that page disagree, the page wins.

## Inputs

- `slug`: client slug (matches `F:\laragon\www\<slug>` and
  `<slug>.voyager.website`)
- `--include-uploads`: default off; only when reproducing media issues

## Procedure

1. Preflight: local env exists (`F:\laragon\www\<slug>`), wp-cli works,
   SSH alias for the SpinupWP site user is configured. If the local env is
   missing, stop and point at the Laragon SOP. Do not improvise setup.
2. Export on staging over SSH (`wp db export`), gzip, download.
3. Import locally, then `wp search-replace` staging URL →
   `http://<slug>.test` with `--all-tables`.
4. Local hygiene (always, in this order): `blog_public 0`, reset admin
   password to local default, deactivate `spinupwp` and
   `limit-login-attempts-reloaded`, confirm Orbit points at dev Portal,
   never production credentials.
5. Optional uploads pull if `--include-uploads`.
6. Verify: front page renders at `http://<slug>.test`, wp-admin login
   works, `wp theme list` shows child + voyager-block-theme parent.

## Hard rules

- Data flows DOWN only. This skill must never push a local DB to staging
  or production under any phrasing.
- Never store or echo production credentials into the local wp-config.
- If the export contains another client's tables (shared-server mistake),
  abort and report.
