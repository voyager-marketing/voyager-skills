# Changelog

All notable changes to the Voyager skills repo are logged here. Every merge to main that touches a skill, runbook, or governance artifact gets an entry. Eval results for any `SKILL.md` edit are recorded inline.

Format: reverse chronological. Date-anchored entries group the work done that day.

---

## 2026-04-21 — Session 6: voyager-build-kickoff skill (Draft)

New infra-provisioning skill that fires after `voyager-client-intake` and before anything else in the Path A lifecycle. Chains off intake's Clients row, stands up a complete Voyager-standard dev environment, hands back a ready-to-design site.

**Added:** `skills/voyager-build-kickoff/SKILL.md` + `commands/voyager-build-kickoff.md` + `intake-edits.md`. Five-phase pipeline: schema check + server resolve → gate + confirm → SpinupWP site on shared Voyager Dev server + Cloudflare DNS → 7-plugin stack + block theme → wait for Orbit self-registration → flip Clients flags + CLIENT.md handoff.

**Architecture decisions locked this session:**
- Path A inferred from Clients state (`WP Publish Enabled = YES` + empty `Websites` relation + `Voyager Orbit Installed` unchecked). No new Path property on Clients DB — Path is an onboarding state, not a client identity attribute.
- All dev sites reuse the shared Voyager Dev server (Notion ID `22893507-c65f-431c-a4e3-a08e8ceffab6`, IP `159.65.174.126`, 6 sites already attached). No per-client server provisioning.
- Portal registration is Orbit-initiated on plugin activation, not skill-initiated. Skill polls `voyager_registration_status` option until `active`, then reads `voyager_site_secret` and writes it to the Websites row's `Orbit Secret` field.
- Orbit token/secret generation is automatic in `TokenManager::generateSecret()`. No WP-CLI command exists; skill reads the option after activation.
- Websites DB has no `Provisioning` or `Failed` status values. Skill uses `In Progress` during runs and `Needs Review` on failure.
- Uses the existing "New voyager.website site" template (`5e7cf74e-6103-45eb-a12b-26c50305e9cb`) to create Websites rows.

**Scope intentionally narrow.** Dev environment only. Launch activities (domain delegation, GA4, GSC, kickoff email, Stripe care plan upsell) deferred to a future `voyager-site-launch` skill. ACF explicitly excluded — the ecosystem uses native Block Bindings API + post meta instead.

**Verified against live code:**
- Orbit `TokenManager.php`, `RegistrationService.php`, `Abilities.php` at `f:\dev\voyager\wordpress\voyager-orbit`.
- Portal `app/api/wp-manager/sites/register/route.ts` in voyager-report.
- SpinupWP plan format (`s-XvcpuXgb`) in `tests/e2e/agents/spinupwp-provisioning.spec.ts`.
- Websites DB + Servers DB + Voyager Dev server row via Notion MCP.

**Intake handoff.** Two small text additions to `voyager-client-intake` required for the handoff. Drafted at `skills/voyager-build-kickoff/intake-edits.md` rather than applied directly because intake currently lives in `.claude/worktrees/eloquent-hypatia-f7524b/skills/voyager-client-intake/` and has not been promoted to main.

**Lifecycle: Draft.** Cannot move to Live until skill-creator eval passes (CLAUDE.md rule 4). Eval blocked on test fixture (sandbox SpinupWP server + Cloudflare test zone). Plan: dry-run against a real Path A candidate first, then formal eval.

**Owner: Ben.**

---

## 2026-04-21 — Session 5: content-image-library wrapper

Companion to `content-hero-image`. Searches the Voyager R2 image library via `image_library_list` before paying for a new generation — saves the ~$0.04-$0.24 generation cost when reuse is an option.

**Added:** `skills/content-image-library/SKILL.md`. When-to-use and when-NOT-to-use both documented; procedure covers listing, filtering by intent, user-picks-or-punts, and three reuse paths (URL only, save to Drive, upload to WP + optional featured).

**Skills DB row created.** Lifecycle=Live on first commit. MCP tools used wired: `image_library_list`, `image_save_to_drive`, `wp_upload_media`, `wp_set_featured_image`. Surface=Code.

**Skills DB state after this session.**
- **Live: 37** (36 + content-image-library)
- **Draft: 0**
- **Deprecated: 4** (the panel-only legacy skills; unchanged)

Eval: PASS 2026-04-21.

---

## 2026-04-21 — Session 4: Exported the 4 panel-only legacy skills to the repo

Closes the Rule 1 governance break from session 1. The 4 skills that were only in the Claude.ai Teams Org panel now have `SKILL.md` files committed to `skills/`. This unblocks retirement — they can't formally move from Deprecated to Retired without source in the repo.

**Committed (commits 7bbcbfc, c6cd1d1, aa04c15, and this one):**

- `skills/voyager-wp-manager/SKILL.md` — WordPress ops skill for Chat. Corrected three stale MCP tool names in the reference table to match the current `voyager-mcp-server` on main (`wp_plugins` → `wp_plugins_list`, `wp_security` → `wp_security_scan`, `wp_fleet_site_status` → `wp_fleet_status`). Wired 13 MCP tools into `MCP tools used` on the Skills DB row.
- `skills/voyager-prep-for-client/SKILL.md` — Full client briefing across Notion CRM + Gmail + Calendar + Slack + Stripe + Ahrefs. No tool name drift. No Voyager MCP tools (Chat connectors only).
- `skills/voyager-client-onboarding/SKILL.md` — Process/checklist skill for new-client setup. No Voyager MCP tools.
- `skills/voyager-client-context-check/SKILL.md` — Prerequisite context check before drafting any client-facing message. No Voyager MCP tools.

**All 4 pass skill-creator eval.** Added Voyager frontmatter to each (`owner: Ben`, `last_reviewed: 2026-04-21`, `allowed-tools` for the Chat connectors each uses). Added a Deprecated-with-replacement-named lifecycle note at the top of each.

**Skills DB updated.** All 4 rows: Surface changed from `Chat Org` to `Chat Org + Code`, Repo path set to the GitHub URL, Last eval set to `Pass 2026-04-21`. Lifecycle stays Deprecated per the run-parallel rule. The replacements (`fleet-health` + `pattern-cloud`, `client-prep`, `onboard-client`) need two weeks of verification in Live before any of these can retire.

**What's ready after this session:**
- The repo is now Rule 1-clean. Every Live or Deprecated skill in the Org panel has source in GitHub.
- The retirement path is unblocked. Once the replacements prove out, the 4 legacy skills can move Deprecated → Retired + `archive/`.
- Next manual step for Ben: the 24 Tier 3 Live skills + `content-hero-image` can be uploaded to the Org panel per `docs/sync-to-claude-teams.md`.

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
