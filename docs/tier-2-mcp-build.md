# Tier 2 — MCP composite build prompt

Self-contained starter prompt for a fresh Claude Code session. Tier 2 of the skills-vs-mcp roadmap: build the seven composite MCP tools that the corresponding skills need before they can be refactored to thin orchestrators. After each tool ships, refactor the matching skill in the `voyager-skills` repo.

Pre-read the architecture rule in `voyager-skills/CLAUDE.md` ("Architecture — Skills and MCP, two layers") and the per-composite signatures in `voyager-skills/docs/skills-vs-mcp-roadmap.md`. The Tier 1 batch already shipped (commit 85b4c1d on `voyager-skills/main`) so you can read those refactored skills as reference for the thin-orchestrator shape.

---

## Paste this into a fresh Claude Code session targeting `voyager-mcp-server`

```
Build the seven Tier 2 MCP composite tools that unlock the skills-vs-mcp
refactor of the Voyager skills repo. Working directory: voyager-mcp-server.

Read first:
- voyager-skills/CLAUDE.md — "Architecture — Skills and MCP, two layers"
  section explains why these are composites instead of leaving the
  workflow in the skill body.
- voyager-skills/docs/skills-vs-mcp-roadmap.md — per-composite tool
  signatures, return shapes, effort estimates, and the audit notes for
  each (Why-This-Matters / User-Visible-Improvement). Treat as the spec.
- voyager-skills/CHANGELOG.md (entry "2026-04-30 — Tier 1 thin-skill
  refactor batch") — context on what already shipped on the skills side
  and the TODOs the Tier 1 refactors flagged for server-side
  verification. Several of those TODOs are addressable inside this
  scope.
- voyager-mcp-server/CLAUDE.md and voyager-mcp-server/README.md for
  this repo's conventions: tool registration pattern, schema helpers,
  HMAC auth, Cloudflare Worker deploy flow, test harness.
- voyager-mcp-server/src/tools-*.ts — the existing tool files. The new
  composites should live in the file that matches their domain
  (tools-content.ts, tools-fleet.ts, tools-reporting.ts, etc.). DO NOT
  create new files unless a domain genuinely doesn't have one yet.

Build sequence (priority order, smallest validation-of-pattern first
to highest scope last):

  1. wp_fleet_health (extends existing wp_fleet_status, ~3h MCP)
  2. content_publish_with_gates (net-new, ~6h MCP)
  3. content_track_portfolio (net-new, ~4h MCP)
  4. content_generate_hero_image (net-new, ~4h MCP)
  5. content_research_keywords (net-new, ~5h MCP)
  6. social_create_session (net-new, ~8h MCP)
  7. wp_provision_site (net-new + new SSH executor primitive, ~14-18h MCP)

For each composite, the per-PR cycle is:

  a. Build the tool on a feature branch in voyager-mcp-server.
     - Add to the appropriate tools-*.ts file with full input/output
       Zod schemas (or whatever schema lib this repo uses — match
       what's already there).
     - If it orchestrates existing primitives, call the in-repo
       implementations directly rather than HTTP-bouncing through
       its own MCP endpoint.
     - Server-enforce any data-integrity gates the spec calls out
       (publish: never expose status=publish; image_generate_and_attach
       proposed in roadmap #10: mandatory site param with no fallback;
       wp_provision_site: idempotent via Websites row state).
     - Surface structured error envelopes — gate failures should be
       parseable by the calling skill, not free-form text.

  b. Test against staging Worker. Add tests to whatever harness this
     repo uses. Cover: happy path, each gate-failure mode, idempotency
     where applicable.

  c. Deploy to production Worker via wrangler.

  d. Switch to voyager-skills repo. Refactor the matching skill on a
     branch:
     - Strip the workflow logic that the new composite now owns.
     - Skill body shrinks to ~50 lines (per-skill targets in the
       roadmap doc).
     - Preserve all brand-voice content, output templates, hard
       guardrails. The Tier 1 refactors (skills/content-audit,
       skills/onboard-client, etc.) are the reference shape.
     - Update last_reviewed: YYYY-MM-DD in frontmatter.
     - Resolve any TODO comments left by Tier 1 if this composite
       addresses them (e.g., the report_generate mom_change TODO).

  e. Run skill-creator eval against the refactored skill (hard gate
     per voyager-skills/CLAUDE.md). Eval result goes in CHANGELOG.

  f. Write CHANGELOG entry on voyager-skills. Format matches the
     2026-04-30 entry: skill name, before/after line count, MCP tool
     called, what was preserved, what was dropped.

  g. Commit on each repo and open the PRs.

  h. Update Alex's Chat panel per voyager-skills/docs/
     sync-to-claude-teams.md (manual upload for now). Note in the
     CHANGELOG entry whether sync happened or is pending.

Do NOT bundle multiple composites into one PR. Each composite is its
own MCP-server PR plus its own voyager-skills skill-rewrite PR. Two
PRs per composite, seven composites, fourteen PRs total. Sequential,
not parallel — let each one validate before starting the next.

Constraints:

- DO NOT change existing tool signatures. The Tier 1 refactors call
  several existing tools (report_generate, content_prospect_audit,
  wp_verify_setup, etc.) and assumed their current shapes. Breaking
  them silently breaks Tier 1.
- DO add fields to existing tool returns where the Tier 1 TODOs flag
  them (report_generate.mom_change, content_prospect_audit.cwv,
  wp_execute_ability arg shape for voyager-orbit/provision-site-data).
  Additive changes are fine.
- The wp_provision_site composite needs an SSH executor primitive
  that does not exist on the server today. Building that primitive is
  inside the wp_provision_site scope. It must NOT be exposed as a
  public MCP tool — only callable internally by other composites that
  need WP-CLI over SSH. Treat as plumbing, not a tool.
- Cost-conscious: any composite that orchestrates Ahrefs (e.g.
  content_research_keywords) must track credit usage and return it
  in the response so the calling skill can warn before re-running.
- Preserve idempotency where the existing tool has it. wp_fleet_status
  in particular gets called by scheduled agents — the extension to
  wp_fleet_health must not break existing schedule wiring.

Time budget: this is a multi-session build, NOT a single session.
~60-80h total. Plan per-session scope realistically. The first session
should land #1 (wp_fleet_health) end-to-end as proof-of-pattern, then
stop and review with Ben before continuing.

Deliverables per composite:
- voyager-mcp-server PR (tool implementation + tests + deploy)
- voyager-skills PR (skill rewrite + CHANGELOG + eval result)
- Brief Slack post in #dev-agents (channel C0AFC9W3UGH) summarizing
  the change

Final deliverable across all seven: every Live skill the audit flagged
REFACTOR or HYBRID is now a thin orchestrator. Alex's Chat panel
upload weight drops by another ~1700 lines. Data-integrity gates
(publish, fleet-health) are server-enforced and cannot be bypassed by
a stale skill copy.
```

---

## Per-composite spec summary

These are condensed signatures from `docs/skills-vs-mcp-roadmap.md`. Use the roadmap doc for the full spec. This table is for quick reference during the build.

### 1. `wp_fleet_health` (extend `wp_fleet_status`)

```ts
wp_fleet_health(
  mode: "infra" | "bindings" | "both",
  site_filter?: string,
  threshold_overrides?: { empty_field_critical_pct?: number, fallback_critical_pct?: number }
) -> {
  sites: { domain: string, grade: "healthy" | "warning" | "critical", infra: object, bindings?: object }[],
  summary: { total: number, healthy: number, warning: number, critical: number, fleet_fallback_rate_30d: number }
}
```

Fans out across the fleet via the existing AbilityBridge. Keeps `wp_fleet_status` working — `wp_fleet_health` is the extended version that also handles the bindings-mode + threshold logic the skill currently does client-side.

**File:** `src/tools-fleet.ts`. **Skill to refactor:** `voyager-skills/skills/fleet-health/SKILL.md`.

---

### 2. `content_publish_with_gates`

```ts
content_publish_with_gates(
  notion_page_id: string,
  dry_run?: boolean,
  force?: boolean
) -> {
  status: "scheduled" | "blocked" | "error",
  gate_results: {
    client_isolation: { passed: boolean, expected: string, actual: string },
    word_count: { passed: boolean, count: number, minimum: 800 },
    seo_meta: { passed: boolean, missing_fields: string[] },
    internal_links: { passed: boolean, count: number },
    cta: { passed: boolean, found: boolean },
    og_meta: { passed: boolean, missing_fields: string[] }
  },
  wp_post_id?: number,
  permalink?: string,
  scheduled_for?: string,
  errors: string[]
}
```

Internally orchestrates `wp_get_post` + sync-filter lookup + `wp_upsert_content` (status=future, hardcoded server-side, never exposed to caller) + `wp_set_seo_meta` + Notion writeback. Gate failures are structured envelopes the skill renders as a table.

**File:** `src/tools-content.ts`. **Skill to refactor:** `voyager-skills/skills/publish/SKILL.md`. **Critical:** the skill must never see `status=publish` — that value never leaves the server.

---

### 3. `content_track_portfolio`

```ts
content_track_portfolio(
  client_id: string,
  month?: string  // YYYY-MM, default current month
) -> {
  pipeline_status: { briefs: number, drafts: number, in_review: number, scheduled: number, published: number },
  posts: {
    title: string, published_date: string, days_since: number, lifecycle_stage: string,
    impressions: number, ctr: number, position: number, pageviews: number,
    classification: "fresh" | "performing" | "evergreen" | "needs_refresh" | "archived",
    recommendation?: { action: "refresh" | "expand" | "archive", reason: string }
  }[]
}
```

Internally calls `content_get_briefs(status="published")` + `content_pipeline_status` and applies the threshold logic server-side (CTR drop 30%+, position slip 5+, < 100 imp/mo after 180d).

**File:** `src/tools-content.ts`. **Skill to refactor:** `voyager-skills/skills/content-tracker/SKILL.md`.

---

### 4. `content_generate_hero_image`

```ts
content_generate_hero_image(
  prompt: string,
  alt_text: string,                                        // required
  aspect_ratio?: "16:9" | "1:1" | "9:16" | "4:3" | "3:4",
  model?: "flash" | "pro",
  post_id?: number,
  site?: string,                                            // required if post_id present
  save_to_drive?: boolean,
  r2_key?: string                                           // optional: reuse existing R2 image
) -> {
  signed_r2_url: string,
  expires_at: string,
  cost_estimate: number,
  drive_file?: { id: string, url: string },
  wp_attachment?: { id: number, media_url: string, featured_on_post_id?: number, permalink?: string }
}
```

Conditional chain: stops after `image_generate` if no `post_id`; adds Drive step if `save_to_drive`; runs full chain when `post_id` + `alt_text` provided. The `r2_key` input lets the existing `content-image-library` skill route through the same composite for reuse.

**File:** `src/tools-content.ts` (or wherever image_* lives — check first). **Skill to refactor:** `voyager-skills/skills/content-hero-image/SKILL.md`. Bonus: this also collapses the manual chain in `voyager-skills/skills/voyager-image-editor/SKILL.md` for the upload-after-generate path (Tier 1 left that as a multi-call chain).

---

### 5. `content_research_keywords`

```ts
content_research_keywords(
  client_id: string,
  seed_keywords?: string[],
  competitor_domains?: string[],
  min_volume?: number,    // default 100
  max_kd?: number          // default 40
) -> {
  opportunities: { keyword: string, volume: number, kd: number, client_rank?: number, gap: string, intent: string }[],
  existing_briefs: { id: string, title: string, status: string }[],
  ahrefs_credits_used: number
}
```

Wraps the 6 Ahrefs MCP calls + `content_get_briefs` for dedup. Returns the canonical research table. Credit tracking is centralized server-side.

**File:** `src/tools-content.ts`. **Skill to refactor:** `voyager-skills/skills/content-brief/SKILL.md`. Note: Ahrefs is on a separate MCP server — the composite calls the Ahrefs server's tools internally.

---

### 6. `social_create_session`

```ts
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
  client_context: { brand_voice: string, timezone: string, primary_platforms: string[] },
  calendar_conflicts: { date: string, platform: string, existing_post_id: string }[],
  drafts: { platform: string, content: string, scheduled_for?: string }[],
  research_topics?: { topic: string, rationale: string }[],
  analytics?: object  // mode-specific summary
}
```

Wraps existing `social_get_calendar` + `social_research_topics` + `social_repurpose_url` + `social_trigger_from_blog` + `social_get_analytics`. Returns drafts ready for review — does NOT call `social_create_post` until the skill confirms approval.

**File:** wherever social_* lives (probably `src/tools-content.ts` or a dedicated `tools-social.ts` if it exists; grep first). **Skill to refactor:** `voyager-skills/skills/social/SKILL.md`.

---

### 7. `wp_provision_site` (largest scope, leave for last)

```ts
wp_provision_site(
  business_name: string,
  clients_db_url?: string,
  slug?: string,
  server_notion_id?: string,
  php_version?: string,
  resume_from_phase?: number  // 1-7
) -> {
  status: "complete" | "partial" | "failed",
  website_db_url: string,
  staging_url: string,
  wp_admin_url: string,
  spinupwp_site_id: string,
  cloudflare_record_id: string,
  orbit_registration_status: string,
  orbit_registered_at?: string,
  failed_phase?: number,
  error?: string
}
```

End-to-end Path A site provisioning: Cloudflare DNS create + propagation poll, SpinupWP site create + event poll + HTTPS verify, plugin/theme install via SSH+WP-CLI, Orbit registration poll, Notion writes. Idempotent via Websites row state. Resumable from any phase.

**Internal SSH executor primitive needed** — this is the part that doesn't exist on the server today. Build it as a non-public utility (not registered as an MCP tool — only callable by other composites that need WP-CLI over SSH). Treat as plumbing.

**File:** `src/tools-fleet.ts` for the public composite, `src/ssh-executor.ts` (new) for the internal primitive. **Skill to refactor:** `voyager-skills/skills/voyager-build-kickoff/SKILL.md`. The skill drops from 687 → ~60 lines.

---

## Why this is its own session, not a continuation of the Tier 1 work

Tier 1 was a coordinated skill rewrite that shipped six refactors in parallel within `voyager-skills`. That's possible because the target MCP tools already existed — only skill bodies needed editing.

Tier 2 is a multi-repo, multi-PR build. Each composite is:
- A TypeScript implementation on `voyager-mcp-server`
- A staging deploy + production deploy via Cloudflare Worker
- A skill rewrite on `voyager-skills` that depends on the deploy
- A skill-creator eval pass per CLAUDE.md
- Two PRs merged in dependency order (server first, skill second)

Parallelizing is possible after the first composite validates the pattern, but the first one (wp_fleet_health) should ship end-to-end before scaling out — that's where you discover the test harness gaps, the deploy lag, and the schema-mismatch surprises.

## Connection to Alex's manual-upload bottleneck

Each Tier 2 composite that ships shrinks the matching skill body. Cumulative Chat-panel upload weight reduction:

| Skill | Body before | Body after | Reduction |
|---|---|---|---|
| publish | 165 | ~45 | -120 |
| social | 309 | ~50 | -259 |
| content-brief | 165 | ~60 | -105 |
| content-tracker | 121 | ~50 | -71 |
| content-hero-image | 176 | ~60 | -116 |
| fleet-health | 151 | ~50 | -101 |
| voyager-build-kickoff | 687 | ~60 | -627 |
| **Total Tier 2 reduction** | **1774** | **~375** | **-1399** |

Plus Tier 1's already-shipped 758-line reduction. Combined: ~2150 lines off Alex's panel once Tier 2 lands.

If `POST /v1/skills` ends up bridging to the Teams Org panel (the open infrastructure question), the upload bottleneck dies entirely. If it doesn't, Tier 2 is what makes the manual upload sustainable.

---

## Ground rules (read before starting)

- **Server before skill, every time.** Never refactor a skill body to call a composite that hasn't been deployed and tested. Tier 1 already left TODOs documenting the gaps; resolving them is part of this scope, not a separate cleanup.
- **One composite, two PRs, two repos.** No bundled "did the whole tier" PR. The reviewer can't reasonably verify seven composites in one read.
- **Eval is non-negotiable.** Every refactored skill runs through `skill-creator` before merging on the skills side. Tier 1 deferred eval as a one-time exception; Tier 2 doesn't get that pass.
- **Don't break existing tools.** Tier 1 calls `report_generate`, `content_prospect_audit`, `wp_verify_setup`, `wp_execute_ability`, `wp_get_options`, `pattern_sync_to_site`, and the image tools. Their signatures and return shapes are load-bearing now. Additive changes (new optional fields) are fine; renames or required-field additions are not.
- **Slack at session end.** Post a session summary to `#dev-agents` (channel `C0AFC9W3UGH`) per the CLAUDE.md "Session fitness metric." Mention which composites shipped, which TODOs got resolved, what's left.
