# Audit prompt — skills vs MCP

Self-contained starter prompt for a new Claude Code session. The audit identifies which Live skills have workflow logic that should move into composite MCP tools on `voyager-mcp-server`, leaving thin orchestrator skills behind.

Pre-read the architecture section in `voyager-skills/CLAUDE.md` ("Architecture — Skills and MCP, two layers") before running this. The threshold rule is: any skill body over ~100 lines of workflow logic is a refactor candidate. Brand-voice and thinking-framework skills are never candidates.

---

## Paste this into a fresh Claude Code session

```
Audit voyager-skills for the "thin skills, thick MCP" refactor pattern.

Goal: identify which Live skills have workflow logic that should move into
composite MCP tools on voyager-mcp-server, with a thin skill remaining as
the intent-matcher.

Read first:
- voyager-skills/CLAUDE.md — the "Architecture — Skills and MCP, two layers"
  section explains the design principle and the ~100-line threshold for
  refactor candidates.
- Memory entry: feedback_skills_vs_mcp.md — quick reference for the rule.
- Memory entries reference_mcp_server.md, project_mcp_expansion_april16.md,
  project_mcp_image_tools.md — current voyager-mcp-server tool catalog
  (~117 tools, 16 domains). Use these to check whether a proposed
  composite tool name conflicts with something existing.

Process:

1. List all Live skills in voyager-skills/skills/. Skip skills with
   Lifecycle != Live (check the Skills DB at
   https://app.notion.com/p/d511e6fc01a342f5869d79eb51e3c0b0 or just ls
   the directory and skip Deprecated/Retired).

2. Classify each skill into one of three buckets:
   - **THIN** — already a thin orchestrator, OR a brand-voice/thinking
     skill that should stay thick (voyager-voice, voyager-team-context,
     mission, voyager-feature-spec, voyager-operating-principles,
     voyager-seo-approach, voyager-cold-email, voyager-client-message
     are all THIN-by-design — leave alone).
   - **REFACTOR** — workflow logic > ~100 lines that should move into
     a composite MCP tool. Skill body should shrink to ~50 lines.
   - **HYBRID** — partial refactor. Some logic moves to MCP, brand
     voice + intent matching + glue stays in the skill.

3. For each REFACTOR or HYBRID candidate, propose:

   a. **Composite MCP tool name + signature.** Include the inputs and
      a brief description of what it returns. Example:

      `social_create_session(
         client: string,
         intent: "create" | "calendar" | "repurpose" | "quick" | "analytics",
         topic?: string,
         platforms?: string[]
       ) -> {
         drafts: Draft[],
         calendar_conflicts: Conflict[],
         session_id: string
       }`

      Cross-check the proposed tool name against the existing
      voyager-mcp-server catalog (per the memory references above).
      If a similar primitive already exists, propose orchestrating
      existing primitives rather than a brand-new composite.

   b. **What the skill body shrinks to** after refactor. Target ~50
      lines tops. Should include:
      - Frontmatter (name, description, owner, last_reviewed)
      - One-paragraph "what this skill does"
      - Trigger phrase list
      - One or two MCP tool calls
      - User-facing review/approval flow
      - Hard guardrails (typically one short list)

   c. **Effort estimate.** Hours of MCP server work + hours of skill
      rewrite + hours of testing.

   d. **Priority.** Which delivers the most leverage to Alex (i.e.,
      which workflow does she hit most often in Chat where the
      manual-upload bottleneck hurts most)?

   e. **Why this matters** — one line on the user-visible improvement.

4. Output a single ranked roadmap document and commit it to:
   voyager-skills/docs/skills-vs-mcp-roadmap.md

   Structure:
   - Summary table: count of THIN / REFACTOR / HYBRID
   - Ranked list of REFACTOR + HYBRID candidates (highest priority first)
     with the five items above (a-e) for each
   - Bottom: one-line note for each THIN skill confirming why it stays
     thin (so the audit is documented as complete, not just selective)

Constraints:

- DO NOT actually refactor any skill in this session. This is an audit.
- DO NOT invent MCP tool names that already exist. Cross-check.
- Skip brand-voice/thinking skills entirely (per the THIN-by-design list
  above) — they're prompt content, not workflow logic.
- Project-bound skills (in voyager-blocks/.claude/skills/ and
  voyagermark/.claude/skills/) are out of scope. Audit only the
  voyager-skills repo.
- If you find a skill that's neither workflow-heavy nor brand-voice
  (edge case), default to THIN and note it.

Time budget: ~45-60 min focused work.

Deliverable: PR'd commit to voyager-skills/docs/skills-vs-mcp-roadmap.md.
```

---

## Why this audit comes before any actual refactor

We don't refactor blind. The audit produces a ranked list with effort estimates so the actual refactor work is sized and prioritized before any code moves. The architecture section in `CLAUDE.md` is the principle; this roadmap is the execution plan.

After the roadmap exists, individual refactor PRs follow the ordinary skill-edit flow (edit on branch, eval pass, CHANGELOG entry, merge). Each refactor is its own PR scoped to one skill + its corresponding new/extended MCP tool.

## How this connects to the upload-automation question

If `POST /v1/skills` ends up bridging to the Teams Org panel (the open question from the previous session), Alex's manual upload bottleneck dies and a thick skill is no longer painful. But thin skills are still better for other reasons (versioning, type safety, faster iteration), so the roadmap is worth doing either way. If the API path doesn't bridge, the audit becomes higher priority because every line of skill body removed is one fewer line to re-upload manually.
