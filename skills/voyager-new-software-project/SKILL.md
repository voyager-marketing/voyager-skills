---
name: voyager-new-software-project
description: "Use when scaffolding a new Voyager software project — repo structure, AGENTS.md, CI/CD, branch strategy, stack wiring."
argument-hint: "[project name] [type: portal-feature|orbit-module|theme|worker|tool]"
allowed-tools: [Bash, Read, Grep, Glob, Agent, TodoWrite]
user-invocable: true
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

## Output

Provide the scaffold as a file tree with content for each file. Offer to create them via Bash.
