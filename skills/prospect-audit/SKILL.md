---
name: prospect-audit
description: "Use when asked to audit a prospect's website, run an SEO audit on a domain, generate a prospect report, analyze a competitor site, check this domain for [name], or create a branded SEO audit for a potential client."
argument-hint: "<domain> [--deep] [--pages /about,/services]"
allowed-tools: [Read, Write, mcp__claude_ai_Voyager_MCP__content_prospect_audit]
user-invocable: true
owner: Ben
last_reviewed: 2026-04-30
---

# Prospect SEO Audit — Branded Sales Tool

Generate a branded Voyager Marketing SEO audit for a prospect's website. One MCP call returns scores, findings, PageSpeed, and recommendations. You wrap them in the report template below.

## Input

- **domain** (required): The prospect's domain (e.g., `dentistdenver.com`)
- **--deep**: Audit 2-3 inner pages (auto-detected from nav)
- **--pages /about,/services**: Specify which inner pages to audit

## Run the audit

Call `content_prospect_audit(domain, deep?, pages?)`. It returns:

- `scores`: on_page, technical, page_speed, content_quality, overall, grade
- `findings`: per-category observations with specifics
- `pagespeed`: mobile + desktop Core Web Vitals
- `recommendations`: prioritized actions

<!-- TODO: extend content_prospect_audit if PageSpeed CWV breakdown (FCP/LCP/TBT/CLS/SI) isn't in pagespeed payload -->

## Report

Save to `prospect-audits/{domain}-audit.md` using this exact template. The "Prepared by Voyager Marketing" framing is brand IP. Do not restructure.

```markdown
# SEO Audit: {Domain}
**Prepared by Voyager Marketing** | {Date}
**Overall Score: {scores.overall}/100 ({scores.grade})**

---

## Executive Summary
{2-3 sentences: biggest finding, biggest opportunity, recommended next step}

## Scores at a Glance

| Category | Score | Grade |
|----------|-------|-------|
| On-Page SEO | {scores.on_page}/100 | |
| Technical SEO | {scores.technical}/100 | |
| Page Speed | {scores.page_speed}/100 | |
| Content Quality | {scores.content_quality}/100 | |
| **Overall** | **{scores.overall}/100** | |

## On-Page SEO
### What We Found
### Recommendations

## Technical SEO
### What We Found
### Recommendations

## Page Speed
### Mobile / Desktop (Core Web Vitals with specific numbers)
### Recommendations

## Content Quality
### What We Found
### Recommendations

## Quick Wins
Top 5 highest-impact, lowest-effort changes from `recommendations`

## How Voyager Marketing Can Help
{Services tied to their specific issues}
**Ready to discuss?** Contact us at hello@voyagermark.com
```

## Guardrails

- Be honest. If the site is strong, say so. Don't manufacture problems.
- Be specific. "Title tag is 72 characters, exceeding the 60-char limit" beats "could be better."
- Be actionable. Every finding needs a concrete recommendation.
- Don't guess. Only report what the tool measured. Skip a section if its data is missing.
- No jargon dumps, no fear tactics. This represents Voyager Marketing.
- Don't inflate the grade. The score from the tool is the score in the report.
