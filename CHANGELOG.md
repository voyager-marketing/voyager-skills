# Changelog

All notable changes to the Voyager skills repo are logged here. Every merge to main that touches a skill, runbook, or governance artifact gets an entry. Eval results for any `SKILL.md` edit are recorded inline.

Format: reverse chronological. Date-anchored entries group the work done that day.

---

## 2026-04-21 — Session 3: Tier 3 eval backfill + content-hero-image

**Tier 3 eval backfill — all 24 Draft skills → Live.**
Read and evaluated every Draft skill against the skill-creator checklist (valid YAML frontmatter, use-trigger in description, clear procedure, allowed-tools declared where needed, under 500 lines, no hallucinated tools). Every one passed. Flipped all 24 to `Lifecycle: Live` in the Skills DB and set `Last eval: Pass 2026-04-21`.

- client-prep — **PASS**. Multi-source context builder with structured briefing output.
- content-audit — **PASS**. Four audit modes (freshness, images, gaps, performance) with clear WP-CLI patterns.
- content-brief — **PASS**. Two-phase (research + brief) with Ahrefs budgeting rules.
- content-production — **PASS**. Orchestrator with explicit sub-skill dispatch.
- content-strategy — **PASS**. Data-backed, Ahrefs credit-conservative.
- content-tracker — **PASS**. Lifecycle classification + benchmarks + refresh/expand/archive logic.
- editorial-qa — **PASS**. Six review dimensions + grade + structured output.
- fleet-health — **PASS**. Single-site and fleet modes, health grading.
- link-builder — **PASS**. Single-post, site-wide, orphan detection with rate limits.
- onboard-client — **PASS**. Comprehensive six-step pipeline with verification checklist.
- pattern-cloud — **PASS**. Status, sync, export commands.
- prospect-audit — **PASS**. Branded sales-ready report template.
- pseo — **PASS**. Batch creation with duplicate checks + rate limits.
- pseo-manage — **PASS**. Audit, enrich, stats, FAQ, suggest, bulk modes.
- publish — **PASS**. Hard policy (never status=publish) + gate checks + Notion writeback.
- report — **PASS**. Ability call + DB-query fallback.
- seo-report — **PASS**. Four commands (report, cluster, schema, ab).
- seo-research — **PASS**. Tool tables + four workflow patterns.
- ship-session — **PASS**. End-of-session checklist with commit hygiene rules.
- social-repurpose — **PASS**. Three modes (from blog, from URL, topic ideas).
- voyager-abilities — **PASS**. PHP registration pattern, categories list, verification.
- voyager-ai-integration — **PASS**. AI Client patterns, structured output, Chat orchestration.
- voyager-orbit-dev — **PASS**. Module architecture, DB conventions, REST conventions.
- wp-lab — **PASS**. Ephemeral + continuous modes with presets.

Tier 3 result: **24/24 pass**. All Code-only skills now meet Rule 4 (hard eval gate) and are eligible for Org panel upload.

**New skill: content-hero-image (Live on first commit).**
Wrapper that orchestrates the Voyager MCP image pipeline into one handoff: `image_generate` → (optional `image_save_to_drive`) → `wp_upload_media` → `wp_set_featured_image`. Added because session 2 exposed that image generation worked in Chat via MCP but had no skill documenting when to invoke it, how to write prompts, or when to bump flash → pro.

- File: `skills/content-hero-image/SKILL.md`
- Eval: **PASS** 2026-04-21. Valid frontmatter, clear trigger, guardrails include cost control + accessibility alt-text requirement + no-auto-commit to live posts.
- Skills DB row created with Lifecycle=Live, MCP tools used wired to all 6 image-related tools (`image_generate`, `image_edit`, `image_library_list`, `image_save_to_drive`, `wp_upload_media`, `wp_set_featured_image`).

**Skills DB state after this session.**
- **Live: 36** (11 from session 1 + 24 Tier 3 + content-hero-image)
- **Draft: 0** (all Draft skills evaluated)
- **Deprecated: 4** (panel-only legacy, unchanged — still run-parallel until replacements prove out)

**Still pending (next session).**
- Upload newly-Live Code-only skills to Claude.ai Org panel via the `docs/sync-to-claude-teams.md` runbook.
- Wire `MCP tools used` on the ~20 skills that don't yet have MCP relations (most have no Voyager MCP deps — voice/guideline/prep skills — but a few like `project-knowledge-audit` could use `client_get_profile` if that were to be wired).
- Export the 4 panel-only legacy `SKILL.md` files from Claude.ai and commit them.
- Sync local `voyager-mcp-server` checkout (still behind GitHub main).

---

## 2026-04-21 — Session 2: Skills DB + MCP Tools DB

Same day, different scope. Session 1 built a Markdown Catalog on the Hub. That broke the moment we tried to track MCP tools alongside skills, and the Catalog was already unwieldy at 35 rows. Retired the Markdown approach in favor of two purpose-built Notion databases, both children of the Hub.

**Databases created.**
- [Skills DB](https://www.notion.so/d511e6fc01a342f5869d79eb51e3c0b0). 41 rows. Columns: Surface, Owner, Lifecycle, Last reviewed, Last eval, Description, Repo path, MCP tools used (relation), Replaces / Replaced by (self-relation). Seeded from the `skills/` directory plus the 4 panel-only Deprecated Org skills and 2 panel-only Personal skills.
- [MCP Tools DB](https://www.notion.so/ae2cad4639a74f189e3e2d9af3121ecc). 111 rows. Columns: Server, Category, Description, Auth, Cost per call, Status, Source (GitHub URL), Used by skills (relation, inverse of Skills.MCP tools used). Seeded from `voyager-mcp-server/src/tools-*.ts` on main.

**Relations wired (starter set).**
- Run-parallel replacement pairs (Replaces / Replaced by self-relation): `client-prep` replaces `voyager-prep-for-client` + `voyager-client-context-check`; `fleet-health` + `pattern-cloud` replace `voyager-wp-manager`; `onboard-client` replaces `voyager-client-onboarding`.
- MCP tool usage: 20 skills wired to their MCP dependencies. Remaining ~21 skills to be wired opportunistically.

**Rule changes in `CLAUDE.md`.**
- Rule 1 rewritten: GitHub remains canonical for `SKILL.md` content, but metadata now lives in the Skills and MCP Tools DBs. GitHub and Notion each have a narrow, non-overlapping job.
- Old rule "Don't create Notion databases for skills" retired. Replaced with "Don't create more Notion databases for skills or MCP tools" — two exist, that's enough.

**Correction on session 1 claim.**
Session 1 flagged `voyager-mcp-server` as deploy-drift risk because the local clone didn't have image tools. That was wrong. GitHub `main` has the image tools and tests; the local clone was stale. No Worker source-control emergency.

**Trigger for this session.** Ben asked where image generation lives (since it "just works" in Chat). Tracing it exposed that image gen is an MCP tool (`image_generate` on `voyager-mcp-server`, wraps Google Gemini Nano Banana, stores in R2). That tool wasn't cataloged anywhere, which revealed the bigger gap: the Hub tracked skills but not the MCP tools they depend on.

**Commit.** This session's changes are in the repo commit following 8974212 on `main` (CLAUDE.md Rule 1 update, this changelog entry). All other artifacts live in Notion.

---

## 2026-04-21 — Skills consolidation kickoff

Reconciled the Claude.ai Org panel against the repo. Started the governance backfill that the April 14 Install Guide and April 15 Catalog deferred.

**Reconciliation.**
- Org panel today: 12 skills (8 Keep + 4 Run-parallel).
- Personal panel today: 6 skills (5 Keep + 1 duplicate flagged for deletion).
- Repo `skills/` on main: **35 skills**. Wide gap against both panels, mostly because the April 14 Install Guide target skills (content pipeline, fleet ops, client ops) were built and merged but never uploaded to the Org panel.
- See `Hub → Current state & reconciliation` for the full surface-by-surface table.

**Governance artifacts added.**
- `CHANGELOG.md` (this file) — initial migration entry.
- `docs/sync-to-claude-teams.md` — manual upload runbook for the weekly Org panel re-upload.

**Frontmatter backfill.**
- Added `owner: Ben` and `last_reviewed: 2026-04-21` to every `skills/<name>/SKILL.md` on main (35 files).
- `owner` inferred from git blame. All current skills authored by Ben. Alex-authored skills will flip as they ship.

**Eval backfill — Tier 1 (Keep, 8 skills).**
Evaluated against the skill-creator checklist: valid YAML frontmatter, description leads with a use-trigger, procedure is concrete, allowed-tools declared where the skill needs tool use, body under 500 lines. Results below are pass/fail plus the one or two notes that matter.

- `voyager-voice` — **PASS**. Concrete voice rules, rewrite mode documented, frontmatter clean.
- `voyager-client-message` — **PASS**. Clear trigger, structured output, calls `voyager-client-context-check` as a prerequisite.
- `voyager-cold-email` — **PASS**. Trigger is crisp, sequence patterns documented.
- `voyager-operating-principles` — **PASS**. Decision framework is explicit, proceed/modify/hold output codified.
- `voyager-seo-approach` — **PASS**. Covers on-page standards and reporting cadence, referenced as sub-skill by others.
- `voyager-team-context` — **PASS**. Auto-load skill, concise, no tool invocation needed.
- `project-knowledge-audit` — **PASS**. Clear completeness checklist against Notion.
- `project-splitter` — **PASS**. Procedure produces ordered shippable slices with dependency map.

Tier 1 result: **8/8 pass**. No issues opened.

**Eval backfill — Tier 1.5 (Personal panel skills in repo, 3 skills).**
The three Ben-only Personal panel skills that live in this repo (the other two Personal-panel entries — `voyager-mission-write` and `skill-creator` — are not in the repo and stay out of scope this session).

- `mission` — **PASS**. Operating-principles check runs first, mission brief format is explicit, guardrail against starting implementation in the same response.
- `voyager-feature-spec` — **PASS**. Spec template is concrete, stack reminders scoped to the Voyager stack, output offered to Notion.
- `voyager-new-software-project` — **PASS**. Per-type scaffold checklists differentiated cleanly across five project types.

Tier 1.5 result: **3/3 pass**.

**Eval backfill — Tier 2 (Run-parallel, 4 skills).**
The four parallel-run skills in the Org panel — `voyager-wp-manager`, `voyager-prep-for-client`, `voyager-client-onboarding`, `voyager-client-context-check` — **do not exist in this repo on main**. They live only in the Claude.ai Org panel. Cannot run eval against source we do not have.

Flagged in Discoveries and the Hub. Next session must either export the four `SKILL.md` files from Claude.ai and commit them to `skills/` (preferred, matches Rule 1), or formalize them as "panel-only legacy" with a retirement target tied to their replacements (`fleet-health` + `pattern-cloud` for `voyager-wp-manager`; `client-prep` for the other three).

Tier 2 result: **deferred, 0/4 runnable**.

**Tasks DB schema.**
Added `voyager-skills` to the Notion Tasks DB `Repo` select. Applied via MCP data-source update — no manual action needed. Future Tasks tagged to this repo can now use the Repo filter.

**`/v1/skills` API test.**
Not run this session. Deferred to next session alongside the GitHub Action work in Phase 2.

**Flag for Ben.**
`voyager-prep-for-client` appears in **both** the Personal panel and the Org panel in Claude.ai. Delete the Personal copy. The Org copy is canonical until the `client-prep` replacement is proven (two-week parallel run, then retire).

**Commit.** See the repo commit log for this date.
