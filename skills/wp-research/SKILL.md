---
name: wp-research
description: "Use this skill when the user asks to check for WordPress updates, research WP changes, check what's new in Gutenberg, review dependency updates, audit outdated packages, or wants recommendations for project improvements based on the WordPress ecosystem."
argument-hint: "[focus area: core|gutenberg|blocks-api|dependencies|security|ai|all]"
allowed-tools: [WebSearch, WebFetch, Bash, Read, Grep, Glob]
user-invocable: true
owner: Ben
last_reviewed: 2026-04-29
---

# WordPress Ecosystem Research Agent

Research the latest WordPress ecosystem changes and produce actionable recommendations for the active Voyager dev repos. Designed to run from any Voyager repo cwd — auto-detects what's installed and what versions are pinned, then researches deltas against current upstream.

Skip ground that prior memory entries already cover (the WP AI ecosystem deep dive, Voyager's WPAI integration, future-forward areas like client-side abilities / interactivity API / DataViews / Playground / RDB / C2PA — see "Build on prior research" below). The point of this skill is to surface what's *new since the last pass*, not to re-run the canonical research.

## Phase 0 — Detect environment

Before researching anything, capture the current state from cwd. Don't assume v3 paths or hardcoded versions.

### Repo identification

```bash
# Which repo is this?
basename "$(git rev-parse --show-toplevel 2>/dev/null || echo "$PWD")"

# Pinned versions, by language
[ -f package.json ] && jq -r '.name + " " + .version' package.json
[ -f composer.json ] && jq -r '.name + " " + (.version // "no-version")' composer.json
[ -f style.css ] && grep -i "^Version:" style.css | head -1

# WordPress plugin header version (run from a plugin repo)
ls *.php 2>/dev/null | xargs -I{} grep -l "Plugin Name:" {} 2>/dev/null | head -1 | xargs -I{} grep -i "^Version:\|^ \* Version:" {} 2>/dev/null | head -1
```

### Active dependency versions

```bash
[ -f package.json ] && jq -r '.dependencies, .devDependencies | to_entries[] | "\(.key)@\(.value)"' package.json | grep -E "wordpress|gsap|three|ogl|sass|typescript|@anthropic|@modelcontextprotocol" | sort
```

### WordPress install context (only if relevant — i.e. the user is asking about a deployed site, not a plugin/theme repo)

If `$WP_ROOT` is in scope (resolve from project CLAUDE.md, or skip):

```bash
wp --path="$WP_ROOT" core version
wp --path="$WP_ROOT" plugin list --format=csv | head -20
wp --path="$WP_ROOT" theme list --format=csv
```

If cwd isn't a recognizable Voyager repo and there's no `$WP_ROOT` available, ask the user which repo they want researched.

## Voyager dev repos (current set, April 2026)

The full active inventory — research can target any of these:

| Repo | Where it lives | What it ships |
|---|---|---|
| `voyager-orbit` | plugins/voyager-orbit | Lead tracking, AI abilities, Portal bridge |
| `voyager-blocks` | plugins/voyager-blocks | 28+ blocks, 100+ patterns, bindings, Pattern Cloud |
| `voyager-core` | plugins/voyager-core | CPTs, animations, mega menu |
| `voyager-block-theme` | themes/voyager-block-theme | Parent block theme — structural canvas |
| `voyagermark` | themes/voyagermark | Voyager's child theme — brand paint |
| `voyager-blank-child` | repo only | Starter child theme (per memory `project_voyager_blank_child.md`) |
| `voyager-skills` | repo only | This repo — agency-wide skills |
| `voyager-mcp-server` | repo only | Cloudflare Worker, 117+ MCP tools |
| `voyager-portal` | repo only | Next.js + Clerk + Supabase + Trigger.dev |

When the user says "check for updates" without naming a repo, default to whichever repo cwd resolves to. When they say "the fleet" or "all our repos", iterate.

## Build on prior research (don't re-run)

Memory entries that already covered specific areas. Reference + update; don't redo the deep dive.

| Area | Memory file | Status |
|---|---|---|
| WP AI canonical plugin (27 hooks, 8 PRs, 0.8.0 roadmap) | `research_wp_ai_ecosystem_deep_dive.md` | Done — track 0.8.0 release |
| Client-Side Abilities API + WebMCP | `research_client_side_abilities_deep_dive.md` | Done — track @wordpress/abilities releases |
| Interactivity API (28 blocks classified, GSAP integration) | `research_interactivity_api_deep_dive.md` | Done — track migration roadmap progress |
| WP AI Client (full API + AI Transform extension) | `research_wp_ai_client_deep_dive.md` | Done |
| DataViews/DataForm (13 field types, 22 operators, Command Center) | `research_dataviews_deep_dive.md` | Done |
| Playground + Studio + @wordpress/build (AI Demo Generator) | `research_playground_ephemeral_wp.md` | Done |
| Remote Data Blocks (Automattic plugin + AI Data Source Generator) | `research_remote_data_blocks_deep_dive.md` | Done |
| C2PA cryptographic provenance (EU AI Act trigger, Q3 2026) | `research_c2pa_content_provenance.md` | Deferred |
| 10 future-forward WP areas (master roadmap) | `research_wp_future_forward_2026.md` | Done |
| Voyager WPAI integration (Phase 1 done, 7 hooks live) | `project_wpai_integration.md` | Active |

If asked about one of these areas, **read the memory first**, then research only the delta since the memory was written.

## Research targets

### 1. WordPress core

Current WP version is captured in Phase 0. Research:
- Latest stable + dev release
- Security patches since the captured version
- Deprecated APIs that any Voyager repo depends on
- PHP compatibility changes (we run PHP 8.3)

Sources:
- `wordpress.org/news/`
- `make.wordpress.org/core/`
- `developer.wordpress.org/news/`

### 2. Gutenberg / Block Editor

Compare the captured `@wordpress/scripts` version against latest stable. Research:
- New block APIs / block supports
- Interactivity API additions (cross-reference `research_interactivity_api_deep_dive.md`)
- Deprecated block APIs we use
- block.json schema additions (we use apiVersion 3)

Sources:
- `make.wordpress.org/core/tag/gutenberg-new/`
- `github.com/WordPress/gutenberg/releases`

### 3. @wordpress/scripts

```bash
npm view @wordpress/scripts version
npm view @wordpress/scripts versions --json | python3 -c "import sys,json; v=json.load(sys.stdin); print('\n'.join(v[-5:]))"
```

Compare against the version in the cwd repo's `package.json` (captured in Phase 0). Flag breaking changes between current and latest.

### 4. Key dependencies

For whichever of these the cwd repo uses (from Phase 0 detection):

```bash
for pkg in gsap three ogl typescript sass shadcn @anthropic-ai/sdk @modelcontextprotocol/sdk; do
  echo "== $pkg =="
  npm view "$pkg" version 2>/dev/null
done
```

Flag major version bumps (breaking changes likely) and security advisories.

### 5. WordPress AI Building Blocks

Active upstream area — track the canonical plugin and its dependencies. Last deep dive was in `research_wp_ai_ecosystem_deep_dive.md`; check for what shipped since.

```bash
gh release list --repo wordpress/ai --limit 5
gh release list --repo wordpress/php-ai-client --limit 5
gh release list --repo wordpress/abilities-api --limit 5
gh release list --repo Automattic/wordpress-mcp --limit 5
```

Cross-reference against what voyager-orbit's WpaiIntegration module currently hooks into (`project_wpai_integration.md`).

### 6. Client-side abilities + Interactivity API

```bash
gh release list --repo WordPress/gutenberg --limit 10
npm view @wordpress/abilities version
npm view @wordpress/interactivity version
```

Cross-reference `research_client_side_abilities_deep_dive.md` and `research_interactivity_api_deep_dive.md`. Flag any new directives, store APIs, or ability-registration changes.

### 7. Security advisories

Last 30 days, WordPress core + plugins we ship:

Search:
- "WordPress security advisory {current month} {current year}"
- "WordPress plugin vulnerability {current month} {current year}"
- WPVulnDB / Wordfence threat intel feeds

Cross-reference `reference_wp7_security.md` for the WP 6.9 security baseline.

### 8. PHP 8.3 (and 8.4 prep)

- Newly available 8.3 features the codebase doesn't yet use
- Deprecations on PHP 8.4 (production target soon — track upstream)
- Performance wins available

## Output format

Save the report to `~/.claude/cache/wp-research-{date}.md` (the user's home Claude cache, not a project-specific path).

```markdown
# WordPress Ecosystem Report — {date}
**Cwd repo:** {detected repo or "all"}
**Versions captured:** WP {x}, PHP {x}, @wordpress/scripts {x}

## Critical (action needed now)
- {security patches, breaking changes affecting the captured versions}

## Important (plan for soon)
- {major updates, deprecations on hot code paths}

## Opportunities (nice to have)
- {new APIs, performance improvements, ergonomic wins}

## Dependency status
| Package | Current (cwd) | Latest | Major bump? | Action |
|---|---|---|---|---|
| ... | ... | ... | y/n | update/hold/investigate |

## Recommended actions
1. {Specific, scoped — "bump @wordpress/scripts in voyager-blocks from 27.x to latest minor"}
2. {Tied to a specific repo, with rough effort estimate}

## Memory hygiene
- {Findings significant enough to update a memory entry — name the file}
- {Findings significant enough to add to a project's CLAUDE.md}
```

## After research

If any finding meaningfully changes a memory entry's truth, suggest updating it (don't update silently). If a finding is repo-specific and load-bearing, suggest updating that repo's CLAUDE.md.

For findings that warrant separate work (e.g. "bump @wordpress/scripts and fix breaking changes"), suggest a Notion task with scope estimate — don't just append to a generic backlog.
