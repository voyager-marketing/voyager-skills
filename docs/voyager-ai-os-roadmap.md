# Voyager AI OS Roadmap

Status: active direction  
Last updated: 2026-05-15

## Core Direction

Voyager should consume open-source skills aggressively, publish selectively, and keep execution private.

Skills are the distribution and thinking layer. MCP is the execution layer. Public skills are optional; they are useful only when Voyager intentionally wants to teach a method, attract ecosystem feedback, or make a reusable practice visible. Internal skills remain the default because most Voyager value depends on private client data, credentials, safety gates, and agency workflows.

## Layer Boundaries

| Layer | Purpose | Examples |
|---|---|---|
| Internal Voyager skills | Route intent, apply judgment, enforce voice, request approval, call MCP tools | `publish`, `report`, `fleet-health`, `content-audit` |
| Imported/forked skills | Bring useful open-source workflows into Voyager after review | Community testing, design, research, docs, debugging skills |
| Public Voyager skills | Teach non-sensitive Voyager methods when there is a clear external reason | Voice, client messaging, SEO philosophy, editorial QA patterns |
| Voyager MCP | Execute typed operations against real systems | WordPress, Notion, reporting, SEO data, image generation, provisioning |

## Governance Taxonomy

Every scanned skill under `skills/`, `wordpress/`, `shared/`, and `diagnostics/` now carries these fields:

```yaml
distribution: internal | imported | forked | public | client
origin: voyager | community | client | vendor
mcp_requirement: none | optional | required
logic_type: voice | router | workflow | tool-wrapper | reference
surface: claude-code | claude-chat | api | all
```

Definitions:

- `distribution` answers who the skill is meant for.
- `origin` answers where the skill came from.
- `mcp_requirement` answers whether the skill depends on an MCP connection.
- `logic_type` answers what kind of reasoning or workflow the skill contains.
- `surface` answers where the skill is expected to run.

Run the inventory at any time:

```bash
npm run inventory
```

Current baseline:

- 66 scanned skills classified.
- 65 internal Voyager skills.
- 1 forked/vendor skill: `skill-creator`.
- 27 skills require MCP.
- 37 skills require no MCP.
- 2 skills have optional MCP.

## Roadmap

### Phase 1: Governance Foundation

Goal: make the architecture visible and enforceable.

Completed:

- Added governance metadata schema.
- Added inventory generation.
- Added validation for bad governance values.
- Populated all root skills with initial classifications.
- Extended inventory coverage to `wordpress/`, `shared/`, and `diagnostics/`.
- Populated non-root skill governance metadata.

Next:

- Decide whether deprecated root `.skill` files should be archived or classified separately.

### Phase 2: Community Skill Intake

Goal: benefit from open-source skills without weakening Voyager's private operating system.

Completed:

- Intake checklist for imported/forked skills.
- Review criteria for safety, quality, licensing, and tool access.
- A clear path from `imported` to `forked` to `internal`.
- `community/intake.json` manifest for candidate tracking.
- `npm run validate:community` manifest validation.

Principle:

- Community skills are input material, not automatically trusted production workflows.

### Phase 3: Cross-Repo Contracts

Goal: stop skill/MCP drift.

Completed:

- MCP tool catalog export from `voyager-mcp-server`.
- Skill-side contract check that verifies referenced MCP tools exist.

Next:

- Optional `used_by_skills` metadata on MCP tools.

Result:

- Renaming or removing an MCP tool becomes visible before a skill breaks.

### Phase 4: Workflow Refactors

Goal: move risky, repeated, or service-heavy workflow logic into MCP.

Completed:

- `report`: `report_generate` now has a skill-facing monthly WordPress report mode (`site`/`client` + `month` + `format`) that returns rendered markdown, lead/activity data, and MoM change while preserving the existing Portal Reports V2 async path for `client_id`/`template_id`/`date_range`.
- `content-audit`: `content_audit` now supports `mode: "full"` as an MCP composite with per-mode partial-failure reporting, while the skill only selects mode and formats the response.
- `publish`: `content_publish_with_gates` now owns client isolation, content quality gates, scheduled WordPress upsert, and SEO metadata writes. The skill stays thin around Notion lookup, approval checks, and Notion writeback.
- `prospect-audit`: `content_prospect_audit` now exposes deep/page controls and normalizes PageSpeed Core Web Vitals. The skill keeps the branded Voyager sales report framing.
- `fleet-health`: `wp_fleet_health` now runs server-side fleet fanout for infra and binding health, applies thresholds, and returns one graded fleet view. The skill keeps formatting, Slack notification, and scheduled-agent guidance.
- `social`: `social_create_session` now gathers client context, calendar conflicts, topic research, repurpose drafts, and analytics without creating posts. The skill keeps platform judgment, approval gates, and draft creation after explicit approval.
- `content-hero-image`: `content_generate_hero_image` now owns image generation/reuse, R2 signing, optional Drive save, WordPress upload, and featured-image attach. The skill keeps prompt craft, model/cost judgment, and live-post safety gates.
- `content-brief`: `content_research_keywords` now owns Ahrefs seed research, competitor gaps, existing-brief dedup, volume/KD filtering, and opportunity ranking. The skill keeps strategy judgment and approved pipeline triggers.
- `content-tracker`: `content_track_portfolio` now owns published-brief lookup, pipeline status, performance summary, lifecycle classification, and refresh/expand/archive recommendations. The skill keeps interpretation and handoffs.

Recommended order:

1. `voyager-image-editor`: finish thinning non-hero edit/save paths if needed.
2. `onboard-client`: move repeated onboarding joins and validation into MCP.

Portal follow-up:

- No `voyager-report` work is required for the current WordPress monthly report path. If we later want `publish_to_notion` to create a Portal/Notion artifact or PDF, add a synchronous Portal endpoint/mode that accepts `{ clientId, month, format, publishToNotion }` and returns `{ markdown, leads, content, activities, mom_change, report_url?, notion_url? }` without breaking existing Reports V2 async jobs.

Rule:

- Keep voice, thinking, and approval in skills.
- Move credentials, data joins, validation gates, and multi-service execution into MCP.

### Phase 5: Packaging

Goal: make the combo installable as a coherent Voyager Agency OS.

Package shape:

```text
Voyager Agency OS
- Voyager MCP connector
- internal skill pack
- optional public/community-compatible skill pack
- slash commands
- prompts and resources
- examples
```

Private package first. Public/community package only after the internal system is stable and there is a clear reason to publish.

### Future Expansion Backlog

Operating Audit, Browser Reality, and Fleet Intelligence are captured in `docs/future-mcp-expansion-backlog.md`. Treat them as future product modules, not the current execution lane. Browser Reality should prove the browser runtime first; Operating Audit should build on that foundation; Fleet Intelligence remains blocked until Sentry ingestion exists.

## Decision Rule

When adding or changing a skill, ask:

1. Is this teaching judgment, voice, or intent routing? Keep it in a skill.
2. Is this touching private data, credentials, validation gates, or multiple services? Put it in MCP.
3. Is this useful from the community? Import or fork it first; only publish Voyager's version if there is a specific external goal.
