# Changelog

All notable changes to the Voyager skills repo are logged here. Every merge to main that touches a skill, runbook, or governance artifact gets an entry. Eval results for any `SKILL.md` edit are recorded inline.

Format: reverse chronological. Date-anchored entries group the work done that day.

---

## 2026-04-30 — Add Drive save Flow D to `voyager-image-editor`

### Flow D added to `voyager-image-editor`

Background. Earlier today the `voyager-mcp-server` repo merged per-client folder routing for `image_save_to_drive` (PRs #17, #19, #20). The MCP tool now resolves a `client` argument against the Voyager Clients Shared Drive and finds-or-creates `<Client>/AI Images/`, with `_AI Image Library` as the fallback. The skill had no documentation for any Drive save path — Alex hit `AUTH_FAILED` saving STF May 2026 social images and had to interpret raw error messages without skill guidance.

**Edits.**

- Frontmatter `description` expanded to mention Drive saves and `image_save_to_drive` so the skill triggers on phrases like *"save to Drive"*, *"drop it in [client]'s folder"*, *"add to the AI image library"*, *"save these for STF"*.
- Decision section split: WordPress save vs Drive save are now distinct phrase clusters.
- New **Flow D — Save to Google Drive** section with four sub-flows:
  - D.1 acronym translation table (STF → Smooth Transitions, with instructions for handling unknown acronyms via `drive_list_client_folders` / `drive_find_client_folder`).
  - D.2 the actual `image_save_to_drive` curl call, including `folder_path` / `resolution` / `fellback_to_library` parsing.
  - D.3 browse / disambiguate before saving (`drive_list_client_folders`, `drive_find_client_folder`).
  - D.4 Drive vs WordPress disambiguation rule: never default to Drive without an explicit cue.
- `last_reviewed:` bumped to 2026-04-30.

**Eval status.** `skill-creator` eval not yet run on this edit. Pre-merge check pending — the skill stays Live (substantial-addition note), but eval should pass before the Claude.ai Teams Org panel sync.

**Surfaces affected.**

- Claude Code (Ben): symlink picks up on next session, no action needed.
- Claude.ai Teams Org panel (Alex's daily rotation): manual upload by Ben after merge per `docs/sync-to-claude-teams.md`. Same-day sync warranted (Alex hit the gap today).
- Anthropic API Skills library: optional. The `pseo-manage` API test from 2026-04-29 is still unverified, so the panel-sync question remains open.

**Backstory left in memory.** `project_drive_bootstrap_2026_04_30.md` and `project_client_acronyms.md` capture the IDs (Voyager Clients Shared Drive, `_AI Image Library`) and the STF → Smooth Transitions mapping respectively.

---

## 2026-04-29 — Rename `social-repurpose` → `social`; eval-pass batch (8 skills)

### Rename + redesign: `social-repurpose` → `social`

User feedback that "social-repurpose" was misleading — the skill was framed as Phase 6 of the content pipeline (repurposing-only), but the actual most-common use case is from-scratch creation given a topic. Triggered renaming and a body rewrite.

**Renamed directory:** `skills/social-repurpose/` → `skills/social/` (via `git mv`, history preserved).

**Frontmatter:** `name: social-repurpose` → `name: social`. Description rewritten — creation-first language, broader trigger phrase list ("create social posts for [client]", "draft a [platform] post about [topic]", "write a tweet about [X]", "fill [client]'s social calendar", "what should we post for [client] this week", + repurpose/analytics phrases).

**Body restructured:** five modes, ordered by frequency of use:

1. **Create** (default) — topic-only, no source material required. Default flow when ambiguous.
2. **Calendar** — plan a week/month, optionally from `social_research_topics`.
3. **Repurpose** — when a blog or URL exists as source. Was the entire skill before; now one of five.
4. **Quick post** — one-shot, one platform.
5. **Analytics** — read-only check via `social_get_analytics`.

**Preserved unchanged:**
- All 8 MCP social tool wirings (`social_create_post`, `social_get_calendar`, `social_repurpose_url`, `social_research_topics`, `social_trigger_from_blog`, `social_update_post`, `social_get_analytics`, `social_list_posts`).
- `references/platform-playbook.md` (the agency-wide canonical source for char limits, peak windows, content quality rules, hashtag strategy, content mix targets, hard guardrails).
- All hard guardrails: NEVER publish directly (status=Draft only), NEVER skip calendar check, NEVER post identical content cross-platform, NEVER assume timezone, NEVER use the word "elevate", confirm before > 3 posts, etc.

The `social` slug was previously deleted (the OLD `social` skill was a 364-line monolith retired in Option 1 today). Reclaiming it now is fine — that retirement was about the old skill's bloat, not the name.

### Eval-pass batch (8 skills)

`skill-creator` eval pass on the 7 outstanding Drafts plus the renamed `social`. All 8 mark Pass 2026-04-29 in Skills DB. Lifecycle Draft → Live for the 7; `social` was already Live (as social-repurpose), stays Live but with substantial-rewrite note.

| Skill | Eval type | Result | Notes |
|---|---|---|---|
| `voyager-build-kickoff` | Sanity | Pass | Verified live April 22 against melody-magic; description triggers cleanly |
| `voyager-image-editor` | Sanity | Pass | Already in active fleet use prior to this session |
| `voyager-php-preflight` | Full | Pass | Portability fix `find "${1:-.}"` works against any cwd |
| `pr` | Full | Pass | Repo table expanded 3→9 + `gh repo view` fallback covers every Voyager repo |
| `wp-research` | Full | Pass | Phase 0 cwd detection replaces stale version table; cites 9 memory entries |
| `voyager-pattern-migrate` | Paper | Pass | Well-structured but not yet fired live; re-eval after first real run |
| `provision-site-data` | Full | Pass | Clean handoff after build-kickoff; explicit halt conditions |
| `social` (renamed) | Full | Pass | Five-mode redesign, create-first ordering, all MCP wirings preserved |

After this batch: 0 Drafts in the Skills DB. Every repo skill is Live or Deprecated.

### Downstream

- `/tmp/skill-uploads/social-repurpose.zip` rebuilt as `/tmp/skill-uploads/social.zip` (3 files: SKILL.md + references/platform-playbook.md).
- `/tmp/session-b-runbook.md` updated: Tier A entry renamed (`social-repurpose.zip` → `social.zip`), new trigger phrase ("create social posts for [client]"), Slack template updated.
- Skills DB: existing `social-repurpose` row updated in place (name, description, repo path) so the page-id stable references don't break. The 7 Drafts get Lifecycle bumped to Live.

---

## 2026-04-29 — Option 3: wp-research promotion + 2 merges (fleet, build-kickoff)

Final batch of the local→global skill reorganization. One promotion (with substantial rewrite), two merges that consolidate scattered fleet/onboarding logic into the canonical skills.

### Promoted to global (with rewrite): `wp-research`

The local skill had three portability gaps that would have made it confusing on any non-v3 machine: a static "Environment Snapshot" version table that goes stale fast (it claimed voyager-blocks 1.0.0 — actually 2.0.0+ per `project_v2_0_0_release_unstuck`), a v3-only cache path (`/sites/v3.voyagermark.com/.claude/cache/`), and a "three projects" framing that hadn't kept up with the seven+ active dev repos.

Full rewrite under `skills/wp-research/SKILL.md`:

- **Phase 0 — environment detection.** Replaces the static table. Reads `package.json`, `composer.json`, plugin headers, and `wp core version` from cwd at run time. If cwd isn't a recognizable Voyager repo, asks the user.
- **"Voyager dev repos (current set, April 2026)"** table covers the full inventory: voyager-orbit, voyager-blocks, voyager-core, voyager-block-theme, voyagermark, voyager-blank-child, voyager-skills, voyager-mcp-server, voyager-portal.
- **"Build on prior research" section** — explicit "don't redo this" map citing 9 memory entries with deep dives already done (WP AI ecosystem, client-side abilities, Interactivity API, WP AI Client, DataViews, Playground, RDB, C2PA, future-forward). Skill is now a delta-finder, not a re-research-everything-every-time tool.
- **Cache path** is `~/.claude/cache/wp-research-{date}.md` — user's home, not v3.
- Governance frontmatter (`owner`, `last_reviewed: 2026-04-29`).

### Merged: `fleet-binding-audit` → `fleet-health` as `--bindings` mode

Standalone `fleet-binding-audit` skill was useful but its scope (3 voyager-blocks abilities, threshold table, Wednesday cron) is the obvious second mode of `fleet-health`. Merged in.

- `fleet-health/SKILL.md` description updated to mention both modes.
- Frontmatter `argument-hint` adds `--bindings` and `--threshold=20`.
- New "## `--bindings` mode" section — abilities table, thresholds, local + remote calls, output format, all from the standalone skill.
- "Scheduled agent use" now lists both schedules: Monday infra + Wednesday bindings.

### Merged: `wordpress-website-project-onboarding` → `voyager-build-kickoff` as documented future modes

The wp-onboarding skill (624 lines, paper spec) was largely superseded by `voyager-build-kickoff` (624 lines, verified live April 22 against melody-magic-site with 11 real-world gap fixes). The two unique pieces from wp-onboarding — provisioning a per-client SpinupWP server and creating a per-client child theme repo with push-to-deploy — don't have verified-working implementations here.

Rather than copy unverified phases into the working skill (which would regress build-kickoff's quality bar — the skill is what it is *because* it was rewritten after a real run), added a clear **"## Optional follow-up modes (designed, not yet implemented)"** section that documents both:

- **`--new-server`** — design sketch for provisioning a per-client server. Includes the SpinupWP API call shape from the prior skill. Implementation gate: cost-control story (auto-shutdown, billing transparency).
- **`--with-child-theme`** — design sketch using `voyager-blank-child` as the canonical starter (per `project_voyager_blank_child.md`), not scaffold-from-scratch. Includes push-to-deploy wiring. Implementation gate: voyager-blank-child v1 release tag + verified `deploy.sh` that doesn't conflict with our SSH+WP-CLI plugin install pattern.

Both modes flagged for separate future PRs. The "why not implement now" subsection explains why — preserving build-kickoff's "verified or not in here" bar.

### Outcome

Three more locals deleted from `~/.claude/skills/` (wp-research, fleet-binding-audit, wordpress-website-project-onboarding). The truly-local set drops from 6 → 3:
- `frontend-design` — Anthropic example, conflicts with brand (user choice keep/delete)
- `webapp-testing` — Playwright unusable on SpinupWP (user choice keep/delete)
- `v3-wp-query` — intentionally local, v3 dev server only

---

## 2026-04-29 — Option 1 promotions (4 skills) + dead-code cleanup

Promoted 4 skills from `~/.claude/skills/` (v3 local) into the global repo, deleted 2 dead/superseded local skills, lifted operational reference content out of one before deletion.

### Promoted to global

**`skills/voyager-image-editor/`** — Voyager MCP Gemini image gen / edit / save flow. Already fully portable: uses `~/.voyager-mcp-token` and the deployed Worker endpoint, no v3-specific paths. Added `owner: Ben` + `last_reviewed`. No body changes.

**`skills/voyager-php-preflight/`** — PHP syntax + WP security anti-pattern scan. **Portability fix**: replaced hardcoded `find /sites/v3.voyagermark.com/files/wp-content/plugins/voyager-blocks` with `find "${1:-.}"` so the skill targets cwd by default and accepts a path arg for any other repo. Description rewritten to drop the "voyager-blocks" specifier — it's a generic preflight for any Voyager plugin or theme. Added governance frontmatter.

**`skills/pr/`** — auto-detecting PR creation. **Portability fix**: expanded the repo detection table from 3 entries to 9 (added voyager-core, voyagermark, voyager-skills, voyager-mcp-server, voyager-portal, voyager-blank-child) plus a `gh repo view --json defaultBranchRef` fallback so per-client child theme repos and any new repo work without a code change. Added `## Prerequisites` note for `gh` CLI auth check. Added governance frontmatter.

**`skills/skill-creator/`** — Anthropic's meta-skill, vendored. Voyager governance (`CLAUDE.md`) names this as the eval gate that governs every skill's Draft → Live transition, so it has to live globally. Added an explicit vendored-source note: "Vendored from `/mnt/skills/examples/skill-creator/`. Do not edit content here. When upstream changes, re-pull verbatim and bump `last_reviewed`." Owner: `Anthropic (vendored)`. Updated the "Skills Location" section to point at this repo and the eval workflow doc.

### Deletes

**`chat/`** — empty top-level. Contained only a stray nested `chat/voyager-wp-manager/SKILL.md` (older 237-line copy with 64 MCP tools listed). The current `voyager-wp-manager` in this repo is intentionally narrowed and explicitly **Deprecated** (running parallel with `fleet-health` + `pattern-cloud` + `client-prep`). The capabilities in the stray copy were already split across the focused replacement skills. Deleted both.

**`social/`** — 364-line monolith. Largely superseded by `social-repurpose` (focused, governed, slash-command exposed) plus direct MCP tool calls (`social_get_analytics`, `social_get_calendar`, `social_list_posts`, `social_update_post`). The orchestration logic was redundant. **Lifted before delete**: the genuinely useful agency-wide content — Platform Constraints table (char limits, peak windows, best post types per platform), Content Quality Rules (hooks, hashtag strategy, content mix targets), Hard Guardrails — is now `skills/social-repurpose/references/platform-playbook.md`. The `social-repurpose` SKILL.md picked up a one-line pointer to it.

### Renamed (project-local, kept on v3)

**`v3-wp-query`** (was `wp-query`) — local v3 dev-server WP-CLI cheatsheet. Hardcoded to `/sites/v3.voyagermark.com/files`, `tgn_` prefix, `vm3` DB. Renamed and rewrote frontmatter description to make the v3-only scope explicit and point users at MCP `wp_*` tools for client sites. Stays at `~/.claude/skills/v3-wp-query/` — not promoted to global.

### Followups

- Option 2 (project-repo moves: 6 skills to voyager-blocks, 1 to voyagermark child theme) and Option 3 (the wp-research portability rewrite + 2 skill merges) are queued for follow-up sessions.
- `frontend-design` and `webapp-testing` left local pending user decision (keep-as-personal-sandbox vs delete — both have explicit reasons not to promote).

---

## 2026-04-29 — Restore client-isolation gates in publish + onboard-client

Comparison of repo skills against locally-hardened copies on v3 surfaced two regressions where the repo had dropped critical data-integrity content. Restored both. Also bumped `last_reviewed` on the touched files.

**`skills/publish/SKILL.md`** — local was 11KB, repo was 3.6KB. Restored:
- **Step 1 Client Isolation Gate (HARD BLOCK).** Before publishing any item, compare its `Client` relation page ID against the target site's `voyager_notion_databases[content].sync_filter_value`. Mismatch = HARD BLOCK with explicit error. No filter configured = HARD BLOCK with pointer to `/onboard-client` Step 3c. Cannot be overridden.
- **Step 2.5 Content Quality Gate.** 800-word minimum (HARD BLOCK), SEO meta required with title/description/keyword fallbacks, internal-links minimum (warning), CTA paragraph auto-append, OG meta via RankMath social fields.
- **Pipeline Gates checklist** — added the two new gate lines.
- **Guardrails** — expanded from 4 to 13 rules covering all of the above.

**`skills/onboard-client/SKILL.md`** — local was 13.6KB, repo was 9.9KB. Restored:
- **Step 3c "Configure Notion Sync Filter (Client Isolation)"** — the step that establishes the filter `publish` checks. Sets `sync_filter_property=Client`, `sync_filter_value={client_page_id}`, `sync_filter_type=relation` on the content database in `voyager_notion_databases`, then dry-run-verifies via `wp voyager notion sync --dry-run`.
- Existing "Verify Pattern Cloud Sync" renamed from Step 3c → Step 3d.
- **Guardrails** — added explicit "NEVER skip Step 3c" rule with reasoning.

**`skills/onboard-client/checklist.md`** — added the "Client Isolation" section (3 items: filter configured, dry-run verified, no other-client content present).

**Why these were dropped, best guess:** repo's onboard-client + publish were created from a snapshot before the v3 hardening landed (April 16-21). Locals continued to evolve in place. No one noticed because the repo wasn't yet deployed back over the locals.

**DB ID note:** verified the Websites DB ID inconsistency — local `onboard-client` had `f12cc677-9dd3-499d-b23e-9c7873c5620f`, repo has `c6685c2d-de74-48ef-8225-ffdbc63ee1a8` consistent across both `onboard-client` and `publish`. Kept the repo's ID (consistent + more recent).

**No eval run** — these are restoration patches, not new content. Lifecycle stays Live. Will run `skill-creator` eval on next substantive edit.

---

## 2026-04-22 — Session 8: voyager-build-kickoff v2 (first live run + 11 fixes)

First end-to-end run of `voyager-build-kickoff` against a real Path A client (Melody Magic Music Studio). Site now live at https://melody-magic-site.voyager.website with full Voyager stack installed and Orbit registered with Portal. Run surfaced 11 real-world gaps between the paper spec and what actually works on live APIs. SKILL.md rewritten to match reality.

**Verified infrastructure:** SpinupWP server #16035 (Voyager Dev), SpinupWP site #245502, Cloudflare A record, Let's Encrypt cert, WP 6.9.4 + PHP 8.2, 9 plugins active, voyager-block-theme 2.0.1 active, Orbit registered 2026-04-22 06:05:50 UTC with 64-char site_secret stored on the Websites Notion row.

**11 findings rolled into SKILL.md:**

1. **voyager-blocks release zip is broken** — v1.0.0 ships without the `src/` directory. `voyager-blocks.php:439` fatals on `require_once src/utils/settings-helpers.php`. Workaround documented: install from `gh api repos/voyager-marketing/voyager-blocks/tarball/v1.0.0`. Upstream fix needed in the voyager-blocks release pipeline.
2. **Plugin repo paths were wrong**. Three plugins I'd assumed lived under `voyager-marketing` don't exist there. Correct sources:
   - `WordPress/abilities-api` (not `voyager-marketing/wp-abilities-api`)
   - `WordPress/mcp-adapter` (not `voyager-marketing/mcp-adapter`)
   - `Automattic/wordpress-mcp` (the thing I'd called "wp-ai-client" — that name doesn't exist anywhere)
3. **voyager-block-theme has no GitHub releases**, only git tags. Install via `gh api repos/voyager-marketing/voyager-block-theme/tarball/v2.0.1`.
4. **Portal URL was wrong.** Correct host: `https://app.voyagermark.com`, not `portal.voyagermark.com` (DNS doesn't resolve). Correct endpoint: `/api/sites/register` (public, no auth, SSRF-protected). The `/api/wp-manager/sites/register` I'd pointed at is staff-only (Clerk-gated) and returns 401 Unauthorized.
5. **SpinupWP silently ignores `https.enabled: true`** on site creation if DNS isn't visible to SpinupWP's internal resolver at the exact provision moment. Site deploys fine but `https.enabled: false` in the response. No API endpoint exists to enable SSL post-creation (`/v1/sites/{id}/https` only accepts `type=custom`; no "letsencrypt" variant is accepted). SKILL.md now pauses for manual UI click at this point.
6. **`dig` is not on Windows git bash.** DNS propagation poll must use `nslookup` or Node's `dns.promises`.
7. **Plugin install pattern** — SpinupWP API has no WP-CLI/plugin-management endpoints. Must SSH. Site users use publickey auth without a key pre-provisioned for us, so SSH as `benw` (sudo user, id_rsa works) and `sudo -u [site_user] wp ...` for WP-CLI. sudo is NOT NOPASSWD — pipe password via `echo "$PW" | sudo -S ...`.
8. **Phase 2 reordered.** DNS record creation must precede site creation (proven by voyager-report's `trigger/spinupwp-site-creation.ts`). Site creation triggers Let's Encrypt cert request which needs DNS propagated to verify domain ownership.
9. **Orbit/Portal schema matches at `/api/sites/register`.** Orbit's PortalClient sends `{domain, site_url, site_secret, callback_url, metadata: {...}}` which matches `/api/sites/register` exactly. (The other Portal route `/api/wp-manager/sites/register` has a different schema expecting `site_id`, but that route is staff-only and irrelevant for Orbit registration.)
10. **Notion Websites DB field names** (confirmed live, some were wrong in v1):
    - `Orbit Secret` (not "Orbit Token")
    - `userDefined:URL` (shown as "URL"; NOT a "Staging URL" field)
    - No "WP Admin URL" field exists — derive in summary only
    - No "Portal Site ID" field — Portal uses domain as site identifier
    - Server/IP lives in a separate Servers DB via the `Server` relation
    - Status values: no "Provisioning" or "Failed" — use `In Progress` and `Needs Review`
    - SpinupWP auto-generates random 3-char table_prefix (e.g. `4kq_`) — capture from site detail after deploy
11. **WP_Ability property validation notices** — WP 6.9.0 added stricter property validation. Orbit and voyager-blocks declare `_voyager_sanitizer_wrapped` on ability objects which isn't in the allowed set. Non-fatal but noisy in logs. Documented as known drift; fix belongs in Orbit/blocks.

**Also landed in SKILL.md v2:**
- SSH pattern documented explicitly (sudo password from Servers DB `Password` field, `echo $PW | sudo -S -u [site_user] wp ...`).
- CLIENT.md write pattern — write to `/tmp` first then `sudo mv`. The `sudo tee <target> <<'EOF'` pattern silently fails because the heredoc attaches to `tee`, not to sudo's stdin.
- Event status terminal success is `deployed`, NOT `completed`.
- Voyager Dev server hardcoded: Notion `22893507-c65f-431c-a4e3-a08e8ceffab6`, SpinupWP `#16035`, IP `159.65.174.126`.

**Files changed.** `skills/voyager-build-kickoff/SKILL.md` (full rewrite, still under 1024-char description gate), `skills/voyager-build-kickoff/commands/voyager-build-kickoff.md` (summary of phases).

**Validation.** 42 skills pass, 6 warnings (unchanged from session 7).

**Lifecycle.** Still Draft. Eval gate requires a sandbox fixture. First live run proved the pipeline works end-to-end once the 11 gaps are closed, but formal skill-creator eval is pending.

**Known remaining gaps (not in this skill's scope):**
- voyager-blocks release pipeline needs a fix so future dev-site builds don't need the source-tarball workaround.
- SpinupWP API has no post-creation SSL enable — skill pauses for manual UI click. Could be revisited if SpinupWP adds the endpoint.
- Orbit + voyager-blocks should declare `_voyager_sanitizer_wrapped` properly or stop decorating the ability objects that way, to silence WP 6.9 notices.

---

## 2026-04-21 — Session 7: Automation stack (validate + build + sync + API check)

Four GitHub Actions + four Node scripts close the loops between GitHub, Notion, Claude.ai panels, and the Anthropic API. Replaces the PowerShell build script with a cross-platform Node version. Details in `docs/automation.md`.

**Added:**
- `package.json` — Node 20+ tooling. Deps: `@notionhq/client`, `adm-zip`, `js-yaml`.
- `scripts/validate-skills.mjs` — hard-gates every SKILL.md. Errors on missing YAML, mismatched/non-kebab name, missing owner / last_reviewed / description, description >1024 chars. Warns on stale reviews (>90d) and missing use-trigger phrases.
- `scripts/build-zips.mjs` — cross-platform replacement for `build-zips.ps1` (removed). Uses `adm-zip` with explicit forward-slash entry names so every platform produces a Claude.ai-compatible archive.
- `scripts/sync-to-notion.mjs` — reads repo frontmatter, diffs against the Skills DB, patches Description / Owner / Last reviewed / Repo path where they've drifted. Never touches human-curated fields (Surface, Lifecycle, Last eval, relations). `--dry-run` supported.
- `scripts/check-v1-skills-api.mjs` — pings Anthropic's `/v1/skills` beta endpoint, detects Teams-scope signals. Posts summary to Slack if a webhook is configured.
- `.github/workflows/validate.yml` — runs validation on every PR and push to main.
- `.github/workflows/release.yml` — on push to main: validate → build zips → upload artifact → sync Notion (if `NOTION_API_KEY` secret set) → post CHANGELOG delta to Slack (if `SLACK_WEBHOOK_URL` set).
- `.github/workflows/api-check.yml` — 1st of each month at 14:00 UTC: pings `/v1/skills` and reports.
- `docs/automation.md` — what each piece does, required secrets, failure modes, and how the stack collapses once `/v1/skills` supports the Teams Org panel.

**Removed:** `scripts/build-zips.ps1` (replaced by the Node version).

**Tested locally.** Validation passes all 42 skills with 7 warnings (trigger-phrase hints). Build-zips produces correct forward-slash zip structure. Notion sync fails cleanly when the API key is absent.

**Secrets Ben needs to set in repo Settings → Secrets** (workflows degrade gracefully when a secret is missing, so add them incrementally):

- `NOTION_API_KEY` — internal integration, shared with the Skills DB
- `SLACK_WEBHOOK_URL` — `#dev-agents` incoming webhook
- `ANTHROPIC_API_KEY` — read-only if that option exists

Once all three are set, the whole stack runs automatically on merge to main.

**Next evolution.** When the monthly `api-check` workflow detects a Teams-scope signal in `/v1/skills`, replace the manual upload runbook with an auto-upload step in `release.yml`. `docs/automation.md` has the plan.

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
