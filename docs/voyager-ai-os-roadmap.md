# Voyager AI OS Roadmap

Status: active direction  
Last updated: 2026-05-14

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

Recommended order:

1. `content-audit`: smallest refactor, validates the pattern.
2. `report`: high business value, makes Chat reporting more reliable.
3. `publish`: highest safety value, moves gates server-side.
4. `prospect-audit`: deterministic scoring in MCP, branded framing in skill.
5. `fleet-health`: server-side fanout across sites.
6. `social`: MCP drafts sessions, skill handles approval and voice.
7. `content-hero-image` and `voyager-image-editor`: one generate/save/attach path.

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

## Decision Rule

When adding or changing a skill, ask:

1. Is this teaching judgment, voice, or intent routing? Keep it in a skill.
2. Is this touching private data, credentials, validation gates, or multiple services? Put it in MCP.
3. Is this useful from the community? Import or fork it first; only publish Voyager's version if there is a specific external goal.
