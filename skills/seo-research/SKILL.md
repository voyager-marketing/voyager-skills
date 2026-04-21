---
name: seo-research
description: >
  Research SEO data for a client domain or topic using Ahrefs MCP. Keyword analysis,
  backlink profiles, competitor gaps, ranking trends, site audit issues.
  Triggers on: "SEO research for", "keyword research", "check rankings for",
  "backlink analysis", "competitor SEO", "content gap analysis", "what keywords should
  we target", "SEO audit", "how is [domain] doing in search", "ranking report".
owner: Ben
last_reviewed: 2026-04-21
---

# SEO Research

Data-driven SEO analysis using Ahrefs MCP tools for Voyager Marketing clients.

## Available Ahrefs Tools

### Keyword Research
| Tool | Use For |
|------|---------|
| `keywords-explorer-overview` | Volume, difficulty, CPC for specific keywords |
| `keywords-explorer-matching-terms` | Find keywords containing a term |
| `keywords-explorer-related-terms` | Semantically related keywords |
| `keywords-explorer-search-suggestions` | Autocomplete / long-tail ideas |
| `keywords-explorer-volume-history` | Is this keyword trending up or down? |
| `keywords-explorer-volume-by-country` | Volume breakdown by geography |

### Site Analysis
| Tool | Use For |
|------|---------|
| `site-explorer-metrics` | Domain rating, organic traffic, backlinks overview |
| `site-explorer-organic-keywords` | What the site currently ranks for |
| `site-explorer-top-pages` | Pages driving the most organic traffic |
| `site-explorer-organic-competitors` | Who competes in SERPs |
| `site-explorer-domain-rating` | DR score |
| `site-explorer-domain-rating-history` | DR trend over time |
| `site-explorer-pages-by-traffic` | Traffic estimates per page |

### Backlinks
| Tool | Use For |
|------|---------|
| `site-explorer-referring-domains` | Who links to this site |
| `site-explorer-all-backlinks` | Full backlink list |
| `site-explorer-broken-backlinks` | Broken link opportunities |
| `site-explorer-anchors` | Anchor text distribution |
| `site-explorer-backlinks-stats` | Backlink summary |

### Google Search Console (if connected)
| Tool | Use For |
|------|---------|
| `gsc-keywords` | GSC keyword performance |
| `gsc-pages` | GSC page performance |
| `gsc-performance-history` | Traffic trends |
| `gsc-keyword-history` | Ranking history for specific keywords |

### Rank Tracking
| Tool | Use For |
|------|---------|
| `rank-tracker-overview` | Tracked keyword rankings |
| `rank-tracker-competitors-overview` | Competitor ranking comparison |

## Research Workflows

### Quick Domain Health Check
1. `site-explorer-metrics` -- DR, traffic, backlinks
2. `site-explorer-organic-keywords` (top 20 by traffic) -- what's working
3. `gsc-performance-history` -- recent trend

### Keyword Research for Content
1. Seed keywords from client niche
2. `keywords-explorer-overview` -- volume + difficulty
3. `matching-terms` + `related-terms` -- expansion
4. `search-suggestions` -- long-tail
5. `gsc-keywords` -- existing rankings to improve
6. Prioritize: high volume + low KD + business relevance

### Competitor Gap Analysis
1. `site-explorer-organic-competitors` -- identify top 3-5 competitors
2. For each: `organic-keywords` sorted by traffic
3. Compare with client's `organic-keywords`
4. Find keywords where competitors rank but client doesn't

### Backlink Opportunities
1. `site-explorer-referring-domains` for client
2. `site-explorer-referring-domains` for top competitor
3. Diff: who links to competitor but not client?
4. `broken-backlinks` for easy reclaim opportunities

## Output Format

```
## SEO Research: [Client/Domain]

### Domain Health
- DR: X | Organic Traffic: X/mo | Backlinks: X | Referring Domains: X

### Key Findings
1. [Finding with data]
2. [Finding with data]

### Keyword Opportunities
| Keyword | Volume | KD | Current Rank | Action |
|---------|--------|-----|-------------|--------|

### Competitor Landscape
| Domain | DR | Organic Traffic | Overlap |
|--------|-----|----------------|---------|

### Recommendations
1. [Priority action with expected impact]
2. [Secondary action]

### Data Sources
- Tools used: [list]
- Date range: [dates]
- API credits used: ~[estimate]
```

## Rules

- Always include data with every recommendation (volume, DR, traffic)
- Note the date of all data pulls
- Check `subscription-info-limits-and-usage` before large queries
- Don't make claims without data. Say "data unavailable" if a tool fails.
- Be conservative with API credits -- batch queries, skip redundant pulls
- Tailor recommendations to client's business (not generic SEO advice)
