---
name: voyager-seo-approach
description: "Use when planning or reviewing SEO work — keyword targeting, on-page standards, reporting cadence, and tool usage."
argument-hint: "[topic or task to apply SEO approach to]"
allowed-tools: [Bash, Read, Grep, Glob, Agent, TodoWrite]
user-invocable: true
---

# Voyager SEO Approach

Voyager's SEO methodology. Apply consistently across all client sites.

## Keyword targeting criteria

| Signal | Target |
|--------|--------|
| Volume | >100/mo (local: >50/mo is fine) |
| KD | <40 for new sites, <60 for established |
| Intent | Commercial or informational — avoid navigational |
| Relevance | Must match a real service or topic the client owns |

Use Ahrefs for research. Cross-reference GSC for existing impressions before targeting new keywords.

## Content standards

- **Length:** 1,200–2,500 words for blog posts; 600–1,000 for service pages
- **Primary keyword:** in title tag, H1, first 100 words, meta description
- **Secondary keywords (2-3):** in H2s and naturally in body
- **Internal links:** 2-3 to related pages on the same site
- **Schema:** Always add — Article for blogs, LocalBusiness for service pages, FAQPage if FAQs present

## On-page checklist

- [ ] Title tag: primary KW first, under 60 chars, includes location for local
- [ ] Meta description: under 155 chars, includes KW + CTA
- [ ] H1: matches search intent (not just keyword-stuffed)
- [ ] Images: descriptive alt text, compressed, next-gen format (WebP)
- [ ] URL slug: short, KW-only, no stop words
- [ ] Schema markup added
- [ ] 2-3 internal links added
- [ ] Mobile renders correctly

## Tools

| Tool | Purpose |
|------|---------|
| Ahrefs | Keyword research, competitor gaps, backlink analysis |
| Rank Math / Yoast | On-page implementation in WordPress |
| GSC | Impressions, clicks, position tracking |
| GA4 | Traffic, conversions, user behaviour |
| PageSpeed Insights | Core Web Vitals |

## Reporting cadence

- **Monthly:** GSC position changes, traffic vs prior month, top 5 KW movers
- **Quarterly:** full audit — freshness, gaps, competitor comparison
- **Annually:** strategy reset — are we targeting the right keywords?

## pSEO for local clients

Service area pages for every location the client serves. Each page needs:
- Unique local data (population, nearby landmarks, local stats)
- Location in title, H1, and URL
- LocalBusiness schema with address
- Internal link from main service page
