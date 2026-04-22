# Changelog

All notable changes to the Voyager skills repo are logged here. Every merge to main that touches a skill, runbook, or governance artifact gets an entry. Eval results for any `SKILL.md` edit are recorded inline.

Format: reverse chronological. Date-anchored entries group the work done that day.

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
