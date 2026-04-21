---
name: project-knowledge-audit
description: "Use when auditing a client's knowledge state in Notion — checks profile completeness, integration docs, content cycle setup, and knowledge gaps."
argument-hint: "[--client name] [--all]"
allowed-tools: [Bash, Read, Grep, Glob, Agent, TodoWrite, mcp__claude_ai_Notion__notion-search, mcp__claude_ai_Notion__notion-fetch]
user-invocable: true
owner: Ben
last_reviewed: 2026-04-21
---

# Project Knowledge Audit

Check how complete and current a client's knowledge state is in Notion. Find gaps before they cause problems.

## Audit checklist (per client)

### Notion profile
- [ ] Client profile page exists in Clients DB
- [ ] Website URL, industry, location filled in
- [ ] Key contacts named (owner name, email, phone)
- [ ] Retainer type and monthly budget documented
- [ ] Integrations list complete (GA4 property ID, GSC site, WP URL, Stripe customer)

### Content
- [ ] Content Cycles DB has an active cycle for this client
- [ ] Content pillars defined (3-5 topics)
- [ ] Brand voice notes present
- [ ] At least one approved brief in queue or in production

### Active work
- [ ] Open projects or deliverables listed with owner + due date
- [ ] Last deliverable sent within last 30 days (or explained)
- [ ] Any blockers documented (waiting on client, access needed, etc.)

### Knowledge gaps (flag these)
- Missing integration credentials (GA4 ID, GSC verified, WP admin access)
- No content pillars defined
- No contact info beyond company name
- No record of last communication

## Procedure

### Single client (`--client [name]`)
1. Search Notion for the client's profile page
2. Fetch the page and check against the checklist
3. Output: green (complete), amber (partial), red (missing) for each section
4. List top 3 gaps to fix first

### All clients (`--all`)
1. Fetch the Clients DB
2. Run a lightweight check on each (profile completeness, last content, open work)
3. Output a summary table: Client | Profile | Content | Active Work | Top Gap
4. Sort by most gaps first (highest-risk clients at top)

## Output format

```
## Knowledge Audit — [Client Name] — [Date]

| Section | Status | Notes |
|---------|--------|-------|
| Notion profile | ✅ Complete | |
| Integrations | ⚠️ Partial | Missing GSC property ID |
| Content cycle | ✅ Active | Next piece: [title] |
| Active work | ⚠️ Partial | No open projects logged |
| Last comms | ✅ Recent | Email sent 2026-04-10 |

**Top gaps to fix:**
1. Add GSC property ID to profile
2. Log current project in Active Work
```
