# Skills vs MCP — refactor roadmap

Output of the audit prompt at `docs/audit-skills-vs-mcp.md`. Architecture rule: thin skills, thick MCP. Threshold: any skill body over ~100 lines of "do this, then this, then this" workflow logic is a refactor candidate. Brand-voice and thinking-framework skills are never candidates.

Generated: 2026-04-30. Skills DB scoped to `Lifecycle = Live` (4 Deprecated parallel-run skills excluded). Project-bound skills (voyager-blocks, voyagermark, etc.) out of scope.

---

## Summary

| Bucket | Count | Notes |
|---|---|---|
| THIN-by-design (carved out) | 8 | Brand-voice + thinking frameworks. Body IS the value. |
| THIN (dev reference / under-threshold) | 22 | Includes 4 long-but-reference dev skills (voyager-orbit-dev, voyager-abilities, voyager-ai-integration, wp-lab) and 18 sub-100-line skills. |
| Deprecated (parallel-run) | 4 | Skip. Will retire when replacement is proven. |
| **HYBRID** (partial refactor) | **9** | Workflow logic moves to MCP, brand voice + intent stays. |
| **REFACTOR** (full move) | **4** | Workflow logic > ~100 lines, brand voice ≈ 0. |
| **Total Live** | **47** | |

**Total refactor budget across all REFACTOR + HYBRID candidates: ~110–130 hours** (MCP server + skill rewrite + testing combined).

---

## Ranked roadmap (highest leverage first)

Priority is set by Alex frequency × user-visible improvement. Alex is Voyager's content + ops person and works almost exclusively in Chat, where the manual-upload bottleneck hurts most. Skills she runs daily → top of list. Skills Ben runs weekly → bottom.

---

### #1 — `report` (REFACTOR, ~9h)

**Why first.** Alex literally cannot run monthly client reports from Chat today. The skill calls `wp --path=$WP_ROOT --user=1 eval` with raw `$wpdb->prepare()` SQL, which requires shell access on Ben's machine. This is the architecture asymmetry made acute: the workflow lives in skill-body-as-shell-script, so it propagates to Code only. Refactoring unblocks Alex from depending on Ben for any client report.

**a. Composite MCP tool.** Existing `report_generate` already exists in the catalog — extend rather than build new.
```
report_generate(
  client: string,
  month: string,
  format?: "markdown" | "table",
  publish_to_notion?: boolean
) -> {
  markdown: string,
  leads: LeadStats,
  content: ContentItems[],
  activities: number,
  mom_change: number,
  notion_url?: string
}
```
Verify the existing primitive returns this shape. If not (likely missing the MoM comparison and the Notion-publish path), extend it server-side. Drop the SSH+wp-eval+raw-SQL pattern entirely.

**b. Skill body shrinks to ~50 lines.** Frontmatter + intent matching + fuzzy client resolution + one MCP call with month/format/notion flags + output template + guardrails.

**c. Effort.** MCP 4–6h (verify shape, add ability-load-order resilience, Notion publish flag) + skill rewrite 2h + testing 2h.

**d. User-visible improvement.** "Monthly report for Built Right Homes — March 2026 — push to Notion" runs from Chat in ~10s. Today Alex can't run it from Chat at all.

---

### #2 — `publish` (REFACTOR, ~10h)

**Why second.** Architecture doc explicitly names this as a known REFACTOR candidate. Two HARD BLOCK gates — client-isolation (Notion `Client` page ID vs site `sync_filter_value`) and content-quality (800-word min, SEO meta, links, CTA, OG) — are data-integrity-critical. They cannot be allowed to drift between an Alex-uploaded skill copy and Ben's. Server enforcement is the only safe place.

**a. Composite MCP tool.** Net-new — no existing primitive matches the gate logic.
```
content_publish_with_gates(
  notion_page_id: string,
  dry_run?: boolean,
  force?: boolean
) -> {
  status: "scheduled" | "blocked" | "error",
  gate_results: { client_isolation, word_count, seo_meta, internal_links, cta, og_meta },
  wp_post_id?: number,
  permalink?: string,
  scheduled_for?: string,
  errors: string[]
}
```
Internally orchestrates `wp_get_post` + sync-filter lookup + `wp_upsert_content` (status=future, hardcoded server-side) + `wp_set_seo_meta` + Notion writeback. The skill never sees `status=publish` because the tool never exposes it. Gate failures return structured envelopes the skill can render as a table.

**b. Skill body shrinks to ~45 lines.** Frontmatter + trigger phrases + one tool call + dry-run mode flag + user confirmation prompt + 3-line guardrails ("never override --force without explicit OK; always show gate report; refuse cross-client").

**c. Effort.** MCP 6h (gate logic + SQL replacement via existing site-option lookup + dry-run + error envelope) + skill 1h + testing 3h.

**d. User-visible improvement.** Cross-client violations become structurally impossible. Server-enforced gates can never be bypassed by a stale skill copy.

---

### #3 — `content-audit` (HYBRID, ~3–4h)

**Why third.** Smallest effort in the catalog and removes a shell dependency Alex has every week. Skill is 81 lines but 90% is `wp eval` invocations of four `voyager-content/*` abilities; the equivalent MCP tools (`content_audit`, `seo_audit_freshness`, `seo_audit_images`, `content_analyze_gaps`, `seo_predict_performance`) all already exist.

**a. Composite MCP tool.** Existing `content_audit` may already cover this; extend if needed.
```
content_audit(
  client_site: string,
  mode: "freshness" | "images" | "gaps" | "performance" | "full",
  options?: { months?, keyword?, post_id?, post_type?, limit? }
) -> { findings: Finding[], summary: string, prioritized_actions: Action[] }
```
For "full audit mode" the server runs the 3–4 modes in parallel and merges. Verify shape against the existing primitive first.

**b. Skill body shrinks to ~40 lines.** Frontmatter + trigger phrases + one mode-switch + one or two MCP calls + prioritized markdown template + guardrails.

**c. Effort.** MCP 1–2h (verify modes, possibly add `mode: "full"`) + skill 1h + testing 1h.

**d. User-visible improvement.** "Run a full content audit on rangeresidential.com" returns in ~15s from Chat. Alex no longer needs Ben's terminal for weekly audits.

---

### #4 — `prospect-audit` (HYBRID, ~5h)

**Why fourth.** Daily-ish sales motion. The composite already exists (`content_prospect_audit`); the skill is currently re-implementing gather-score-report logic in 109 lines of body. Branded report shape and "Voyager Marketing" framing stay — that's brand IP — but data gathering and scoring math become one MCP call.

**a. Composite MCP tool.** Existing — extend if shape doesn't match.
```
content_prospect_audit(
  domain: string,
  deep?: boolean,
  pages?: string[]
) -> {
  scores: { on_page, technical, page_speed, content_quality, overall, grade },
  findings: Finding[],
  pagespeed: { mobile, desktop },
  recommendations: Recommendation[]
}
```
Verify the existing tool returns this shape. If it returns less (e.g., no PageSpeed CWV breakdown), extend rather than build new.

**b. Skill body shrinks to ~50 lines.** Frontmatter + trigger phrases + one MCP call + branded markdown template (the "Prepared by Voyager Marketing" report shape stays) + honesty/specificity guardrails.

**c. Effort.** MCP 2–4h (verify/extend existing tool) + skill 1h + testing 1h.

**d. User-visible improvement.** Audit results in seconds with deterministic scoring. Today the math is in-prompt and occasionally drifts; WebFetch chains take 30–60s.

---

### #5 — `fleet-health` (HYBRID, ~6h)

**Why fifth.** Alex-runnable ad-hoc ("how's the fleet?") AND it's the skill behind two scheduled agents (Monday 9am infra, Wednesday 10am bindings). Already mostly thin at 151 lines, but moving the fan-out (per-site loop) server-side means scheduled jobs become one MCP call instead of orchestrating N abilities × M sites in chat context.

**a. Composite MCP tool.** Extend existing `wp_fleet_status`.
```
wp_fleet_health(
  mode: "infra" | "bindings" | "both",
  site_filter?,
  threshold_overrides?: { empty_field_critical_pct?, fallback_critical_pct? }
) -> {
  sites: [{ domain, grade, infra: {...}, bindings?: {...} }],
  summary: { total, healthy, warning, critical, fleet_fallback_rate_30d }
}
```
Fans out the relevant abilities across every fleet site via the existing AbilityBridge, grades each per published thresholds, returns one structured fleet view.

**b. Skill body shrinks to ~50 lines.** Frontmatter + trigger phrases + arg parsing (`--bindings`, `--threshold`, `--site`, `--notify`) + one tool call + output table formatting + Slack post on `--notify` + scheduled-agent guidance.

**c. Effort.** MCP 3h (extend `wp_fleet_status` + threshold logic) + skill 1h + testing 2h.

**d. User-visible improvement.** "Run fleet health" returns one consolidated table in 3–5s instead of streaming per-site progress for 30s+. Scheduled jobs become bulletproof.

---

### #6 — `social` (REFACTOR, ~14h)

**Why sixth.** Architecture doc names `social_create_session(client, intent, topic)` as the canonical example. Skill is a 5-mode router with workflow per mode (resolve client + voice + platform → calendar check → research → drafts → batch create). Most mode logic belongs server-side; the platform-playbook brand-voice rules and approval flow stay in skill. Daily for Alex, but bigger effort than the higher-priority items above and lower data-integrity stakes than `publish`.

**a. Composite MCP tool.** Net-new — existing `social_*` primitives are atomic.
```
social_create_session(
  client: string,
  intent: "create" | "calendar" | "repurpose" | "quick" | "analytics",
  topic?: string,
  source_url?: string,
  platforms?: string[],
  timeframe_days?: number
) -> {
  session_id: string,
  mode: string,
  client_context: { brand_voice, timezone, primary_platforms },
  calendar_conflicts: Conflict[],
  drafts: Draft[],
  research_topics?: TopicSuggestion[],
  analytics?: AnalyticsSummary
}
```
Wraps existing `social_get_calendar` + `social_research_topics` + `social_repurpose_url` + `social_trigger_from_blog` + `social_get_analytics`. Returns drafts ready for review — does NOT call `social_create_post` until skill confirms approval.

**b. Skill body shrinks to ~50 lines.** Frontmatter + trigger phrases + intent picker (5 modes one-line each) + one tool call + show drafts → approve → call `social_create_post` (existing) + retain `references/platform-playbook.md` pointer + 10 hard guardrails kept verbatim (those are voice/policy, not workflow).

**c. Effort.** MCP 8h (5 mode branches, calendar dedup, return-not-create semantics) + skill 2h + testing 4h.

**d. User-visible improvement.** "Fill [client]'s social calendar this week" gives one server round-trip with full plan returned, not 5 chained calls visible in chat.

---

### #7 — `content-brief` (HYBRID, ~9h)

**Why seventh.** Weekly cadence. Mixes Ahrefs research workflow (Phase 1: 6 Ahrefs MCP calls + gap analysis + target volume/KD profile) with brief-quality rules and client config checklist (Phase 2: thinking framework). Phase 1 is workflow; Phase 2 stays. Centralizes Ahrefs credit tracking server-side instead of duplicating it across every skill that hits Ahrefs.

**a. Composite MCP tool.** Net-new research orchestrator.
```
content_research_keywords(
  client_id: string,
  seed_keywords?: string[],
  competitor_domains?: string[],
  min_volume?: number,    // default 100
  max_kd?: number          // default 40
) -> {
  opportunities: { keyword, volume, kd, client_rank, gap, intent }[],
  existing_briefs: Brief[],   // wraps content_get_briefs internally for dedup
  ahrefs_credits_used: number
}
```
Wraps the 6 Ahrefs MCP calls + `content_get_briefs` for dedup. Returns the canonical research table the skill currently builds by hand.

**b. Skill body shrinks to ~60 lines.** Frontmatter + trigger phrases + one MCP call + Phase 2 brief quality rules (kept) + brief field list + client config checklist + `content_trigger_brief` handoff (existing primitive) + constraints. The 6-tool Ahrefs procedure disappears.

**c. Effort.** MCP 5h (Ahrefs orchestration + credit tracking + dedup join) + skill 2h + testing 2h.

**d. User-visible improvement.** "Plan content for [client]" returns the opportunities table in one round-trip. Brief generation reasoning stays in chat where Alex can iterate.

---

### #8 — `content-tracker` (HYBRID, ~7h)

**Why eighth.** Monthly cadence. Lifecycle classification logic (5 stages with date + metric thresholds), benchmark targets, and refresh/expand/archive recommendation rules are workflow that should be deterministic server-side (numeric threshold logic is exactly what types catch). The output table format and handoff phrases stay in skill.

**a. Composite MCP tool.** Net-new — existing `content_pipeline_status` is stage-totals only, not per-post lifecycle.
```
content_track_portfolio(
  client_id: string,
  month?: string
) -> {
  pipeline_status: { briefs, drafts, in_review, scheduled, published },
  posts: {
    title, published_date, days_since, lifecycle_stage,
    impressions, ctr, position, pageviews,
    classification: "fresh" | "performing" | "evergreen" | "needs_refresh" | "archived",
    recommendation?: { action: "refresh" | "expand" | "archive", reason: string }
  }[]
}
```
Internally calls `content_get_briefs(status="published")` + `content_pipeline_status` and applies threshold logic (CTR drop 30%+, position slip 5+, < 100 imp/mo after 180d) server-side.

**b. Skill body shrinks to ~50 lines.** Frontmatter + trigger phrases + one tool call + output table format + handoff phrases ("post needs refresh → /content-production"). Threshold tables move to MCP.

**c. Effort.** MCP 4h (classification + recommendation logic + JSON parsing) + skill 1h + testing 2h.

**d. User-visible improvement.** "Which posts need refreshing for [client]" returns sorted recommendations in one call. Refresh thresholds versioned in code, not drift between Alex's panel copy and Ben's.

---

### #9 — `content-hero-image` (HYBRID, ~7h)

**Why ninth.** Per-post frequency. Mixes a 4-tool chain (`image_generate` → `image_save_to_drive` → `wp_upload_media` → `wp_set_featured_image`) — pure orchestration — with prompt-writing guidelines, model-choice rules, and aspect-ratio guidance which are thinking-framework content. Chain becomes composite; prompt craft stays.

**a. Composite MCP tool.** Net-new — atomic primitives exist but no orchestrator.
```
content_generate_hero_image(
  prompt: string,
  aspect_ratio?: "16:9" | "1:1" | "9:16" | "4:3" | "3:4",
  model?: "flash" | "pro",
  post_id?: number,
  site?: string,
  save_to_drive?: boolean,
  alt_text: string,
  r2_key?: string  // optional: reuse existing R2 image
) -> {
  signed_r2_url: string,
  expires_at: string,
  cost_estimate: number,
  drive_file?: { id, url },
  wp_attachment?: { id, media_url, featured_on_post_id, permalink }
}
```
Conditional chain: stops after `image_generate` if no `post_id`; adds Drive step if `save_to_drive`; runs full 4-step chain when `post_id` + `alt_text` provided. The optional `r2_key` allows `content-image-library` to reuse existing images via the same composite (no separate refactor needed).

**b. Skill body shrinks to ~60 lines.** Frontmatter + when-to-use / when-not-to-use + 7 prompt-writing rules (kept — thinking framework) + good/bad prompt examples (kept) + one tool call + guardrails (pro-cost confirmation, 3-attempt cap).

**c. Effort.** MCP 4h (conditional chain + alt-text validation + pro-cost guard + r2_key reuse path) + skill 1h + testing 2h.

**d. User-visible improvement.** "Generate hero for post 123" runs the chain in one call. Skill keeps its prompt-craft value.

---

### #10 — `voyager-image-editor` (HYBRID, ~7–8h)

**Why tenth.** Medium frequency for Alex, but closes a real client-isolation safety gap. 306 lines today, but only ~60 are intent/decision logic. The other ~240 lines are hand-rolled JSON-RPC envelopes, base64, `/tmp` files, and curl against the Worker — workflow that exists ONLY because the skill predates first-class MCP exposure of `image_*` and `wp_*` tools. Now that those primitives are in the catalog, the skill should call them directly.

**a. Composite MCP tool.** New optional composite + drop curl/base64/JSON-RPC from skill.
```
image_generate_and_attach(
  prompt: string,
  aspect_ratio?,
  model?,
  site: string,             // MANDATORY — no alphabetical fallback
  post_id?: number,
  set_as_featured?: boolean,
  alt_text?: string
) -> { r2_url, attachment_id?, wp_url?, featured_set?, cost_estimate }
```
Three calls (`image_generate` → `wp_upload_media` → `wp_set_featured_image`) collapsed into one with mandatory `site` enforced server-side.

**b. Skill body shrinks to ~60 lines.** Frontmatter (tighter description) + generate-vs-edit-vs-save decision tree (intent matching) + aspect-ratio inference hints + client-isolation guardrail + one or two MCP calls + response presentation. Drop ALL curl, base64, JSON-RPC envelope, /tmp management.

**c. Effort.** MCP 3–4h (composite + mandatory `site` enforcement) + skill 2h + testing 2h.

**d. User-visible improvement.** "Generate hero for solar landing page on Pristine Powerwash, set as featured" becomes one command. Today it's 3–4 manual curl calls with cross-client contamination risk.

---

### #11 — `onboard-client` (HYBRID, ~8–10h)

**Why eleventh.** Ben-driven primarily, but `--verify-only` mode is something Alex could plausibly run ad-hoc on a client she's about to work on. Sync-filter step (3c) is data-integrity-critical — composite hardens it (no chance of skipping the dry-run). Most primitives already exist (`wp_verify_setup`, `wp_execute_ability`); this is mostly composing existing tools.

**a. Composite MCP tool.** Mostly thin composite over existing primitives.
```
client_onboard_wp_layer(
  site: string,
  client_notion_page_id: string
) -> {
  verification: {
    orbit_active, blocks_active, rankmath_active, abilities_count,
    portal_id, theme, cpts: [...], binding_sources: [...]
  },
  site_data_provisioned: bool,
  sync_filter_set: bool,
  pattern_cloud_url: string,
  patterns_synced: number
}
```
Runs `wp_verify_setup` + Orbit `provision-site-data` ability + Notion sync filter set + dry-run + Pattern Cloud sync verify, all on one call. Returns structured pass/fail per check.

**b. Skill body shrinks to ~80 lines.** Frontmatter + intent + Step 0 scaffold (kept) + Steps 1–2 Notion search + ask-confirm-create (kept — UX gate) + one `client_onboard_wp_layer` call replacing Steps 3/3b/3c/3d + Steps 4–5 Notion content cycle (kept — also need confirm gates) + summary + guardrails (NEVER skip 3c kept verbatim).

**c. Effort.** MCP 4–6h (compose existing primitives) + skill 2h + testing 2h.

**d. User-visible improvement.** "Onboard Acme Plumbing" runs WP verification + bindings + sync filter + Pattern Cloud as one parallelized call (~30s vs ~2min of serial PHP-eval roundtrips).

---

### #12 — `provision-site-data` (HYBRID, ~4.5–5.5h)

**Why twelfth.** Ben-driven, run once per client right after build-kickoff. Low frequency, but the SSH+escaped-eval-file pattern is a known pain point ("escaping is fiddly"). Refactor pays off in reliability not frequency.

**a. Composite MCP tool.** Mostly compose existing primitives — possibly no new tool needed.
```
wp_provision_site_data(
  site: string,
  phone, email, street, city, state, zip,
  hours,
  social: { facebook?, instagram?, linkedin? }
) -> {
  status,
  options_written: { voyager_site_phone, voyager_site_email, ... },
  options_verified: bool,
  errors?: [...]
}
```
Runs `voyager-orbit/provision-site-data` ability via existing `wp_execute_ability`, then reads back each `voyager_site_*` option for verification via existing `wp_get_options`. Possibly no new tool — convenience wrapper over two existing primitives.

**b. Skill body shrinks to ~50 lines.** Frontmatter + intent + Notion Clients lookup + address parser + prompt for hours/social + confirm payload + single tool call + report formatting.

**c. Effort.** MCP 2–3h (compose existing) + skill 1.5h + testing 1h.

**d. User-visible improvement.** "Provision site data for Acme" succeeds first try. No escape-char debugging.

---

### #13 — `voyager-build-kickoff` (REFACTOR, ~20–24h)

**Why thirteenth.** Largest body in the catalog (687 lines), but Ben-only and run roughly weekly per new client. Not Alex-facing. Bottom of the priority list because the cost is high and the user-leverage is low — but the skill IS brittle (11 verified gaps logged on rewrite). Refactoring is more about reliability + future-mode unlock (`--new-server`, `--with-child-theme`) than chat ergonomics.

**a. Composite MCP tool.** Net-new, and the biggest single tool of the roadmap.
```
wp_provision_site(
  business_name: string,
  clients_db_url?: string,
  slug?: string,
  server_notion_id?: string,
  php_version?: string,
  resume_from_phase?: number
) -> {
  status,
  website_db_url, staging_url, wp_admin_url,
  spinupwp_site_id, cloudflare_record_id,
  orbit_registration_status, orbit_registered_at,
  failed_phase?, error?
}
```
Internally orchestrates Cloudflare DNS create + propagation poll, SpinupWP site create + event poll + HTTPS verify, plugin/theme install via SSH+WP-CLI, Orbit registration poll, Notion writes (Websites row + Clients flag flip), CLIENT.md placement. Idempotent via Websites row state. Resumable from any phase.

The hard part is the SSH+WP-CLI subprocessing — needs a server-side SSH executor primitive that doesn't exist today.

**b. Skill body shrinks to ~60 lines.** Frontmatter + intent matching + gate checks (Path A inference, Websites relation empty) + pre-flight confirm prompt + single `wp_provision_site` call + post-run summary formatting + handoff phrases (provision-site-data, voyager-client-message) + HTTPS-manual-enable resume guard.

**c. Effort.** MCP 14–18h (highest of any tool — SSH+WP-CLI subprocessing is the hard part) + skill 2h + testing 4h (one live run end-to-end + two resume scenarios).

**d. User-visible improvement.** "Provision dev site for Acme Plumbing" returns a single Done/URLs summary in 12 minutes instead of a 7-phase narration with per-step output.

---

## THIN-by-design (carved out — never refactor)

These are prompt content. Body IS the value. Refactoring them would destroy what makes them work.

| Skill | Why thin |
|---|---|
| `voyager-voice` | Brand voice rules. Pure prompt content. |
| `voyager-team-context` | Background context shim, auto-loads. |
| `mission` | Thinking framework — operating principles for sessions. |
| `voyager-feature-spec` | Thinking framework — spec-writing scaffolding. |
| `voyager-operating-principles` | Decision-making framework. |
| `voyager-seo-approach` | Strategy framework / brand voice for SEO work. |
| `voyager-cold-email` | Brand voice + cold outreach playbook. |
| `voyager-client-message` | Brand voice for client-facing messages. |

---

## THIN (audited, no refactor)

### Long-but-reference dev skills

| Skill | Lines | Why thin |
|---|---|---|
| `voyager-orbit-dev` | 167 | Engineering reference for Orbit plugin module pattern. Body IS the value (PHP coding context). Zero workflow. |
| `voyager-abilities` | 189 | Engineering reference for `wp_register_ability` schema + AbilityBridge. Refactoring would be circular (this skill documents how to build the tools that would replace it). |
| `voyager-ai-integration` | 269 | Engineering reference for `wp_ai_client_prompt`, strict-schema helper, Chat pipeline diagram. Documents code that already runs server-side inside Orbit. |
| `wp-lab` | 109 | Local dev-env launcher. Real logic is in `scripts/wp-lab.sh`. MCP is remote, wp-lab is local-by-definition — architecturally unrefactorable. |

### Other audited THIN skills

| Skill | Lines | Why thin |
|---|---|---|
| `voyager-pattern-migrate` | 363 | Thinking framework / decision rule for migrating Claude Design patterns. Bulk is classification logic, v1→v2 token rename map (table data), gating policy. There is no MCP tool for "translate JSX to serialized Gutenberg block" and there shouldn't be — that's reasoning, not service composition. Sibling of voyager-voice. |
| `wp-research` | 216 | Delta-finder skill. Body is memory-citation map (defers to 9 prior research entries) + Phase 0 cwd detection + research-target taxonomy. WebSearch/WebFetch + npm/gh CLI is intentionally outside MCP scope. |
| `seo-research` | 127 | Pure intent-matcher over the external Ahrefs MCP catalog (~25 Ahrefs tools). Teaches the model which Ahrefs primitives to combine for which intent — exact definition of intent-matching. |
| `content-image-library` | 112 | When-to-use guidance + filter heuristics + 1–2 atomic tool calls per branch. The reuse-an-existing-R2-image path is best handled by adding `r2_key?: string` to the proposed `content_generate_hero_image` composite (covered in #9). No standalone refactor. |
| `content-production` | 121 | Dispatch skill — overview of phases 1–7 + sub-skill router (`/content-brief`, `/social`, `/editorial-qa`, etc.) + MCP tool index + Notion DB IDs. The "workflow" is "decide which sub-skill to call." Refactoring breaks the dispatch pattern. |

### Under-threshold THIN (not deeply read; default-to-thin per audit rules)

These are all under ~100 lines and were not opened during the audit. Per the audit rules, default to THIN unless workflow-heavy (which their length already rules out). Should one of these grow past the threshold in a future edit, it joins the audit pool.

`pseo` (97), `pr` (95), `editorial-qa` (94), `content-strategy` (93), `pseo-manage` (91), `pattern-cloud` (85), `voyager-php-preflight` (82), `seo-report` (80), `client-prep` (78), `link-builder` (75), `ship-session` (74), `project-knowledge-audit` (71), `voyager-new-software-project` (57), `skill-creator` (53, vendored from Anthropic), `project-splitter` (51).

---

## Deprecated (parallel-run, skip)

These are running parallel with replacements per CLAUDE.md ("two-week verification, then retire the old one"). Do NOT refactor — they're scheduled for retirement once the replacement proves stable.

| Skill | Replacement |
|---|---|
| `voyager-wp-manager` | `fleet-health` + `pattern-cloud` |
| `voyager-prep-for-client` | `client-prep` |
| `voyager-client-onboarding` | `onboard-client` |
| `voyager-client-context-check` | `client-prep` |

---

## Total effort (REFACTOR + HYBRID)

| Skill | Class | Effort |
|---|---|---|
| #1 report | REFACTOR | 9h |
| #2 publish | REFACTOR | 10h |
| #3 content-audit | HYBRID | 3–4h |
| #4 prospect-audit | HYBRID | 5h |
| #5 fleet-health | HYBRID | 6h |
| #6 social | REFACTOR | 14h |
| #7 content-brief | HYBRID | 9h |
| #8 content-tracker | HYBRID | 7h |
| #9 content-hero-image | HYBRID | 7h |
| #10 voyager-image-editor | HYBRID | 7–8h |
| #11 onboard-client | HYBRID | 8–10h |
| #12 provision-site-data | HYBRID | 4.5–5.5h |
| #13 voyager-build-kickoff | REFACTOR | 20–24h |
| **Total** | | **~110–130h** |

Quick wins (under 6h) at the top: `content-audit`, `prospect-audit`, `fleet-health`. These three together (~14–15h) deliver outsized leverage for Alex and validate the architecture pattern before committing to the bigger refactors.

---

## Connection to upload automation

If `POST /v1/skills` ends up bridging to the Teams Org panel (the open question from the previous session), Alex's manual upload bottleneck dies and a thick skill is no longer painful. But thin skills are still better for other reasons (versioning, type safety, faster iteration), so the roadmap is worth doing either way.

If the API path doesn't bridge, the audit becomes higher priority because every line of skill body removed is one fewer line to re-upload manually. The four full REFACTORs (`report`, `publish`, `social`, `voyager-build-kickoff`) shrink ~1380 lines of skill body to ~205 — a 6.7× reduction in upload weight.

---

## Next steps

After this roadmap exists, individual refactor PRs follow the ordinary skill-edit flow per CLAUDE.md (edit on branch → eval pass → CHANGELOG entry → merge). Each refactor is its own PR scoped to one skill + its corresponding new/extended MCP tool.

Suggested first PR: `content-audit` (smallest effort, removes Alex's shell dependency, validates the pattern).
