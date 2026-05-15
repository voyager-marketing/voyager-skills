# Future MCP Expansion Backlog

Status: backlog, not current execution  
Last updated: 2026-05-15

This backlog captures the Operating Audit, Browser Reality, and Fleet Intelligence task set from the May 2026 planning notes. These are future expansion modules. They do not replace the active Phase 4 roadmap in `docs/voyager-ai-os-roadmap.md`, where the next work remains `content_publish_with_gates`.

## Placement

Recommended order:

1. Finish the active thin-skill/thick-MCP refactor sequence, starting with `content_publish_with_gates`.
2. Build Browser Reality as an infrastructure spike after the publish/fleet safety work. The browser runtime design must be proven before higher-level audit products depend on it.
3. Build Operating Audit after Browser Reality and the existing SEO/reporting composites are stable.
4. Keep Fleet Intelligence blocked until Sentry ingestion is available and `wp_fleet_health` has shipped.

## Already Completed Or Superseded

- Bridge Mode scaffold and tools are already implemented and merged in `voyager-mcp-server`: `bridge_engage`, `bridge_disengage`, `bridge_starmap`, `bridge_logbook`.
- Old Wave 1 dispatch instructions that create Bridge Mode branches are superseded. Do not recreate those branches.
- Skills governance, community intake, MCP contract checks, `content-audit`, and `report_generate` compatibility are already complete in the current roadmap.

## Module 1: Browser Reality

Priority: medium  
Status: backlog  
Prerequisite: decide and prove the browser execution runtime. Full Playwright is not a normal Cloudflare Worker primitive.

- [ ] Scaffold Browser Reality module, Playwright-capable worker/runtime boundary, and five tool stubs.
- [ ] Build `wp_visual_check`: foundation render check with screenshots, console error capture, DOM assertions, and PHP warning detection.
- [ ] Build `wp_visual_diff`: baseline storage, pixel diff, and overlay output.
- [ ] Build `wp_form_test`: autofill, submit, and success/failure validation for common form patterns.
- [ ] Build `wp_render_smoke_fleet`: parallel `wp_visual_check` across fleet or filtered subset.
- [ ] Build `wp_competitor_snapshot`: render competitor pages, extract copy/pricing/sections, and capture screenshots.
- [ ] Add smoke tests, deploy verification, and skill/MCP catalog updates.

Suggested sequence:

1. Scaffold.
2. `wp_visual_check` first, because other browser tools reuse its capture pipeline.
3. `wp_visual_diff`, `wp_form_test`, `wp_render_smoke_fleet`, and `wp_competitor_snapshot` after the foundation is stable.
4. Integration and catalog update last.

## Module 2: Voyager Operating Audit

Priority: high business value, but depends on foundations  
Status: backlog  
Prerequisite: Browser Reality runtime decision plus existing SEO/content/report composites.

- [ ] Scaffold Operating Audit module, audit data model, and Playground/prospect snapshot path.
- [ ] Build `audit_section_seo`: compose existing SEO tools into a scored SEO section.
- [ ] Build `audit_section_local`: GBP, local pack, citations, and local visibility section.
- [ ] Build `audit_section_tech`: stack, plugin, Core Web Vitals, security, and technical health section.
- [ ] Build `audit_section_brand`: brand voice, UX, accessibility, and trust signals section.
- [ ] Build `audit_section_competitor`: competitor gap, backlinks, ad presence, and messaging comparison section.
- [ ] Build `audit_run_full`: orchestrator that runs section tools, aggregates scores, and produces a unified audit object.
- [ ] Build `audit_render_deliverable`: Notion/PDF/Portal-ready report output from a completed audit.
- [ ] Add smoke tests, deploy verification, free-preview gating, and skill/MCP catalog updates.

Suggested sequence:

1. Scaffold and data model.
2. Section tools in parallel after scaffold.
3. `audit_run_full` only after section contracts are stable.
4. `audit_render_deliverable` only after the orchestrator output is stable.
5. Integration and packaging last.

## Module 3: Fleet Intelligence

Priority: medium  
Status: blocked  
Blocker: Sentry ingestion / Phase 3 observability pipeline.

- [ ] Scaffold Fleet Intelligence module and Sentry ingestion service.
- [ ] Build `fleet_pulse`: state-of-fleet snapshot for a configurable time window.
- [ ] Build `error_correlate`: cross-site error signature matching.
- [ ] Build `error_propose_outreach`: proactive client message draft from confirmed error context.
- [ ] Build `fleet_anomaly_scan`: statistical 24-hour anomaly detection.
- [ ] Build `fleet_deploy_safety_check`: pre-deploy risk simulation.
- [ ] Build `client_renewal_signal`: green/yellow/red retention or renewal risk signal.
- [ ] Add smoke tests, deploy verification, and skill/MCP catalog updates.

Do not dispatch Fleet Intelligence until Sentry ingestion exists. If this becomes urgent before Sentry is ready, build `wp_fleet_health` first from the active roadmap and use that as the non-Sentry fleet foundation.

## Dispatch Guidance

Do not dispatch per-tool tasks before the module scaffold exists. For these modules, the safe dispatch model is:

- Scaffold first.
- Parallelize only tools that depend solely on the scaffold.
- Run orchestrator/integration tasks after per-tool contracts are merged.
- Keep one module per branch/PR chain unless the write scopes are fully disjoint.

Current active dispatch recommendation:

- Do not dispatch these backlog modules yet.
- Start with `content_publish_with_gates` from the active Phase 4 roadmap.
