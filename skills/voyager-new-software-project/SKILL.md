---
name: voyager-new-software-project
description: "Use when scaffolding a new Voyager software project — repo structure, AGENTS.md, CI/CD, branch strategy, stack wiring."
argument-hint: "[project name] [type: portal-feature|orbit-module|theme|worker|tool]"
allowed-tools: [Bash, Read, Grep, Glob, Agent, TodoWrite]
user-invocable: true
owner: Ben
last_reviewed: 2026-05-22
distribution: internal
origin: voyager
mcp_requirement: none
logic_type: workflow
surface: claude-code
---

# New Voyager Software Project

Scaffold a new project with the right structure for its type.

## Project types and stacks

| Type | Stack | Repo pattern |
|------|-------|-------------|
| `portal-feature` | Next.js 15, Clerk, Supabase, Trigger.dev v4 | Feature branch in voyager-portal |
| `orbit-module` | PHP 8.1+, WordPress 6.9+, PSR-4 | Module in voyager-orbit/src/Modules/ |
| `theme` | WordPress FSE, theme.json, vb-* block naming | voyager-block-theme repo |
| `worker` | Cloudflare Workers, Hono, TypeScript | New repo, wrangler.toml |
| `tool` | Node/TypeScript or Python | New standalone repo |

## Scaffold checklist

### All projects
- [ ] `AGENTS.md` — agent contract (purpose, stack, conventions, verification commands)
- [ ] `CLAUDE.md` → points to AGENTS.md
- [ ] `.agents/rules/` — path-specific rules
- [ ] `.agents/context/` — shared context docs
- [ ] `.gitignore` with secrets patterns
- [ ] Branch strategy: `main` (prod), `dev` (staging), feature branches
- [ ] Notion brain references: Projects `collection://76ac613c-1b50-4d2e-a65e-891fac9c0879`, Tasks `collection://dab85f68-382b-49ef-853c-ea5a4e0e4805`, Knowledge Base `collection://77425406-1225-44d2-8bff-51f4b40de6a3`, Delta Log `collection://308117ab66f04e73aa143fbfef8df275`
- [ ] Meeting Notes convention for kickoff and recurring sync notes
- [ ] Notion MCP convention: use the Notion MCP tool layer for agent reads/writes, prefer full-page Markdown operations over block-by-block JSON when working with page content

### Portal feature
- [ ] Feature directory: `app/(auth)/[feature]/`
- [ ] `page.tsx` (RSC), `actions/`, `components/`
- [ ] Supabase migration if new tables
- [ ] API route if needed: `app/api/[feature]/route.ts`
- [ ] Entry in nav if user-facing

### Orbit module
- [ ] `src/Modules/{Name}/Module.php` (singleton pattern)
- [ ] Register in `src/Plugin.php`
- [ ] Database: Schema.php + Repository.php if needed
- [ ] REST: RestApi.php if needed
- [ ] Version bump (patch only: 1.30.x → 1.30.x+1)

### Cloudflare Worker
- [ ] `wrangler.toml` with env bindings
- [ ] `src/index.ts` with Hono router
- [ ] Secrets in Cloudflare dashboard (not wrangler.toml)
- [ ] Deploy: `wrangler deploy`

## Generated AGENTS.md / CLAUDE.md conventions

For new repos, generate `AGENTS.md` as the canonical agent contract and keep `CLAUDE.md` as a short shim that points at it.

`AGENTS.md` must include:

- **Notion as brain.** Plans and dispatch tasks live in Notion first. Code executes from tasks and writes durable session context back to the related task or project.
- **Canonical Notion DBs.** Projects `collection://76ac613c-1b50-4d2e-a65e-891fac9c0879`, Tasks `collection://dab85f68-382b-49ef-853c-ea5a4e0e4805`, Knowledge Base `collection://77425406-1225-44d2-8bff-51f4b40de6a3`, Delta Log `collection://308117ab66f04e73aa143fbfef8df275`.
- **Notion MCP first.** Agents should use Notion MCP for Notion context and writes. Do not add direct Notion REST/API client usage to agent workflows unless the project is implementing product code that explicitly owns a Notion integration.
- **Markdown page operations.** Prefer full-page Markdown reads and writes for page bodies, specs, ADRs, and handoffs. Use database/query tools to locate records and inspect schemas.
- **Meeting Notes.** Kickoff notes, recurring syncs, and meeting artifacts belong in Meeting Notes or the relevant project/task, not free-floating pages.
- **Session markers.** Prefer Notion task/page comments or discussions for "working on this" and closeout notes. Use properties for state, not chronological logs.

## Output

Provide the scaffold as a file tree with content for each file. Offer to create them via Bash.
