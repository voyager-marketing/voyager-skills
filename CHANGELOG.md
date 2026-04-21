# Changelog

All notable changes to the Voyager skills repo are logged here. Every merge to main that touches a skill, runbook, or governance artifact gets an entry. Eval results for any `SKILL.md` edit are recorded inline.

Format: reverse chronological. Date-anchored entries group the work done that day.

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
