---
name: prospect-audit
description: "Use this skill when the user asks to audit a prospect's website, run an SEO audit on a domain, generate a prospect report, analyze a competitor site, or create a sales audit for a potential client."
argument-hint: "<domain> [--deep] [--pages /about,/services]"
allowed-tools: [WebFetch, WebSearch, Bash, Read, Write, Agent, TodoWrite]
user-invocable: true
---

# Prospect SEO Audit — Branded Sales Tool

Generate a professional SEO audit for a prospect's website. Fetches real data, analyzes with AI, and produces a branded Voyager Marketing report ready to share.

## Input

- **domain** (required): The prospect's domain (e.g., `dentistdenver.com`)
- **--deep**: Also audit 2-3 inner pages (auto-detected from nav)
- **--pages /about,/services**: Specify which inner pages to audit

## Execution Flow

### Phase 1: Gather Data

For the homepage (and inner pages if `--deep`), fetch and extract:

**1. On-Page SEO Signals**
Use WebFetch for each page. Extract via prompt:
- Title tag (length, keyword presence)
- Meta description (length, compelling?)
- H1 tag (exists? unique? keyword-rich?)
- Heading hierarchy (H1→H2→H3 structure)
- Internal link count
- External link count
- Image count + how many have alt text
- Schema markup presence (JSON-LD)
- Canonical tag
- Open Graph / Twitter Card meta
- Word count estimate
- Content quality signals (thin? duplicate-feeling? keyword-stuffed?)

**2. Technical Signals**
Use WebFetch to check:
- HTTPS (is the URL secure?)
- Mobile viewport meta tag present
- robots.txt (fetch /robots.txt — check for disallow issues)
- sitemap.xml (fetch /sitemap.xml — exists? how many URLs?)

**3. Page Speed**
Fetch Google PageSpeed Insights (public API, no key needed for basic):
```
https://www.googleapis.com/pagespeedonline/v5/runPagespeedTest?url=https://{domain}&strategy=mobile
```
Extract via WebFetch prompt:
- Performance score (0-100)
- First Contentful Paint
- Largest Contentful Paint
- Total Blocking Time
- Cumulative Layout Shift
- Speed Index

Also fetch desktop:
```
https://www.googleapis.com/pagespeedonline/v5/runPagespeedTest?url=https://{domain}&strategy=desktop
```

**4. Competitive Context (optional, if --deep)**
Use WebSearch to find:
- What keywords the domain might rank for
- Who their local competitors are
- Any obvious SEO opportunities

### Phase 2: Score & Analyze

Score each category out of 100:

| Category | Weight | What to score |
|----------|--------|--------------|
| **On-Page SEO** | 30% | Title, meta, headings, content quality |
| **Technical SEO** | 25% | HTTPS, mobile, robots, sitemap, schema |
| **Page Speed** | 25% | Core Web Vitals, mobile + desktop scores |
| **Content Quality** | 20% | Word count, structure, readability, uniqueness |

**Overall Score** = weighted average (0-100)

Grade scale:
- 90-100: A+ (Excellent — rare)
- 80-89: A (Strong foundation)
- 70-79: B (Good with clear opportunities)
- 60-69: C (Needs work — common)
- 40-59: D (Significant issues)
- 0-39: F (Critical problems)

### Phase 3: Generate Report

Output a branded markdown report. Save location: determine from CLAUDE.md or use current working directory. Suggested path: `prospect-audits/{domain}-audit.md` relative to the project root.

Create the directory if it doesn't exist.

## Report Structure

```markdown
# SEO Audit: {Domain}
**Prepared by Voyager Marketing** | {Date}
**Overall Score: {Score}/100 ({Grade})**

---

## Executive Summary
{2-3 sentences: biggest finding, biggest opportunity, recommended next step}

---

## Scores at a Glance

| Category | Score | Grade |
|----------|-------|-------|
| On-Page SEO | {X}/100 | {Grade} |
| Technical SEO | {X}/100 | {Grade} |
| Page Speed | {X}/100 | {Grade} |
| Content Quality | {X}/100 | {Grade} |
| **Overall** | **{X}/100** | **{Grade}** |

---

## On-Page SEO

### What We Found
{Findings as bullet points with specific data}

### Recommendations
{Numbered list of specific, actionable fixes}

---

## Technical SEO

### What We Found
{Findings}

### Recommendations
{Fixes}

---

## Page Speed

### Mobile Performance
- Score: {X}/100
- First Contentful Paint: {X}s
- Largest Contentful Paint: {X}s
- Total Blocking Time: {X}ms
- Cumulative Layout Shift: {X}

### Desktop Performance
- Score: {X}/100

### Recommendations
{Specific speed optimizations}

---

## Content Quality

### What We Found
{Content analysis}

### Recommendations
{Content strategy suggestions}

---

## Quick Wins
{Top 5 highest-impact, lowest-effort changes they can make}

---

## How Voyager Marketing Can Help

We specialize in turning these insights into results. Here's what we'd tackle first:

1. {Specific fix tied to their biggest issue}
2. {Second priority}
3. {Third priority}

**Ready to discuss?** Contact us at hello@voyagermark.com or call (XXX) XXX-XXXX.
```

## Guardrails

1. **Be honest** — don't manufacture problems. If the site is good, say so and focus on opportunities
2. **Be specific** — "Your title tag is 72 characters, exceeding the recommended 60" not "Your title could be better"
3. **Be actionable** — every finding needs a concrete recommendation
4. **Don't guess** — only report what you actually measured. If PageSpeed fails, skip that section
5. **Stay professional** — this represents Voyager Marketing. No jargon-dumping, no fear tactics
6. **Rate limit** — pause 2 seconds between WebFetch calls to be respectful of target servers

## Output

After generating the report:
1. Save the full report to `prospect-audits/{domain}-audit.md`
2. Display the Executive Summary + Scores at a Glance in the terminal
3. Tell the user where the full report was saved
