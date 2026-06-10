---
name: build-gate-check
description: "Use when asked to check a build pipeline gate, verify a site is ready for launch, run a gate check, confirm scaffold/baseline/design/launch readiness, or before declaring any Client Build Pipeline module complete. Runs the gate's MCP predicates read-only and returns GREEN/RED with evidence."
argument-hint: "<site_id> [--gate=scaffold-complete|baseline-complete|design-approved|pre-publish|live|in-fleet] [--post=ID]"
allowed-tools: [mcp__claude_ai_Voyager_MCP__wp_site_health, mcp__claude_ai_Voyager_MCP__wp_verify_setup, mcp__claude_ai_Voyager_MCP__wp_plugins_list, mcp__claude_ai_Voyager_MCP__wp_get_theme_details, mcp__claude_ai_Voyager_MCP__site_get_dna, mcp__claude_ai_Voyager_MCP__wp_render_check, mcp__claude_ai_Voyager_MCP__site_accessibility_check, mcp__claude_ai_Voyager_MCP__blocks_audit_binding_health, mcp__claude_ai_Voyager_MCP__site_pre_publish_gate, mcp__claude_ai_Voyager_MCP__wp_score_seo, mcp__claude_ai_Voyager_MCP__wp_validate_content, mcp__claude_ai_Voyager_MCP__wp_uptime_status, mcp__claude_ai_Voyager_MCP__seo_domain_health, mcp__claude_ai_Voyager_MCP__cloudflare_zone_get_by_name, mcp__claude_ai_Voyager_MCP__client_list, mcp__claude_ai_Voyager_MCP__report_status, mcp__claude_ai_Voyager_MCP__leads_stats, mcp__claude_ai_Voyager_MCP__wp_fleet_health, mcp__claude_ai_Voyager_MCP__client_get_profile, mcp__claude_ai_Voyager_MCP__client_get_integrations, mcp__claude_ai_Voyager_MCP__wp_site_performance, mcp__claude_ai_Notion__notion-search, mcp__claude_ai_Notion__notion-fetch, mcp__claude_ai_Notion__notion-create-comment]
user-invocable: true
owner: Ben
last_reviewed: 2026-06-10
distribution: internal
origin: voyager
mcp_requirement: required
logic_type: workflow
surface: all
---

# Build Gate Check

Thin orchestrator. The predicate definitions live in the Notion KB:
**[Reference] Infra: Build Gate Verification — MCP Predicate Map**
(https://www.notion.so/37b47c03778b81ef9cf7d71e155e250f). This skill runs
them; it does not redefine them. If this file and that page disagree, the
page wins. Then update this skill.

## Inputs

- `site_id` (domain): required
- `--gate`: one of scaffold-complete, baseline-complete, design-approved,
  pre-publish (requires `--post=ID`), live, in-fleet. Default: infer from
  the project's pipeline position in Notion.

## Procedure

1. Resolve client + project: `client_get_profile`, Projects DB row.
2. Run the MCP calls listed for that gate in the Predicate Map. Read-only
   only. This skill never mutates the site.
3. Assemble a gate report: each predicate → ✅/❌/⚠️ + one-line evidence
   (scores, versions, counts). Mark 🧠 rows as "human sign-off required".
   Never auto-green them.
4. Post the report as a comment on the project's Notion page with date.
5. Verdict: GREEN only if every tool predicate passes AND no 🧠 row is
   unconfirmed. Otherwise RED with the blocking list.

## Hard rules

- A gate is a predicate, not a vibe. No partial credit.
- Known gap: `wp_site_performance` may return null (PageSpeed unwired).
  Report it as ⚠️ manual-check-required, never as pass.
- Never mark design-approved or live green without explicit human
  confirmation in the conversation.
