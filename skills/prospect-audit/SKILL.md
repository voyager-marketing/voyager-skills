---
name: prospect-audit
description: "Use when asked to audit a prospect's website, run an SEO audit on a domain, generate a prospect report, analyze a competitor site, or create a sales audit for a potential client."
argument-hint: "<domain> [--deep] [--pages /about,/services]"
allowed-tools: [WebFetch, WebSearch, Bash, Read, Write, Agent]
user-invocable: true
---

# Prospect SEO Audit — Branded Sales Tool

Generate a professional SEO audit for a prospect's website. Fetches real data and produces a branded Voyager Marketing report ready to share.

## Input

- **domain** (required): The prospect's domain (e.g., `dentistdenver.com`)
- **--deep**: Also audit 2-3 inner pages (auto-detected from nav)
- **--pages /about,/services**: Specify which inner pages to audit

## Phase 1: Gather Data

**On-Page SEO** (via WebFetch per page):
- Title tag (length, keyword presence)
- Meta description (length, compelling?)
- H1 (exists? unique? keyword-rich?), heading hierarchy
- Internal/external link counts, image alt text coverage
- Schema markup (JSON-LD), canonical tag, Open Graph/Twitter Card
- Word count estimate, content quality signals (thin? keyword-stuffed?)

**Technical** (via WebFetch):
- HTTPS, mobile viewport meta tag
- robots.txt (`/robots.txt` — check disallow issues)
- sitemap.xml (`/sitemap.xml` — exists? URL count?)

**Page Speed** (Google PageSpeed Insights — no API key needed):
```
https://www.googleapis.com/pagespeedonline/v5/runPagespeedTest?url=https://{domain}&strategy=mobile
https://www.googleapis.com/pagespeedonline/v5/runPagespeedTest?url=https://{domain}&strategy=desktop
```
Extract: performance score, FCP, LCP, TBT, CLS, Speed Index.

## Phase 2: Score

| Category | Weight |
|----------|--------|
| On-Page SEO | 30% |
| Technical SEO | 25% |
| Page Speed | 25% |
| Content Quality | 20% |

Grade: 90-100 = A+, 80-89 = A, 70-79 = B, 60-69 = C, 40-59 = D, 0-39 = F

## Phase 3: Report

Save to `prospect-audits/{domain}-audit.md`. Structure:

```markdown
# SEO Audit: {Domain}
**Prepared by Voyager Marketing** | {Date}
**Overall Score: {Score}/100 ({Grade})**

---

## Executive Summary
{2-3 sentences: biggest finding, biggest opportunity, recommended next step}

## Scores at a Glance

| Category | Score | Grade |
|----------|-------|-------|
| On-Page SEO | X/100 | |
| Technical SEO | X/100 | |
| Page Speed | X/100 | |
| Content Quality | X/100 | |
| **Overall** | **X/100** | |

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
Top 5 highest-impact, lowest-effort changes

## How Voyager Marketing Can Help
{Services tied to their specific issues}
**Ready to discuss?** Contact us at hello@voyagermark.com
```

## Guardrails

- Be honest — don't manufacture problems. If the site is strong, say so.
- Be specific — "Your title tag is 72 characters, exceeding the 60-char limit" not "could be better"
- Be actionable — every finding needs a concrete recommendation
- Don't guess — only report what you measured. Skip sections if data unavailable.
- Rate limit — pause 2 seconds between WebFetch calls
- This represents Voyager Marketing — no jargon dumps, no fear tactics
