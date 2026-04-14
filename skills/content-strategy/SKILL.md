---
name: content-strategy
description: >
  Plan blog, website, landing page, email, or cross-channel content strategy for a client.
  Converts raw research into content angles, briefs, campaign structures, funnels,
  content pillars, and publishing plans. Uses Ahrefs MCP for keyword data when available.
  Triggers on: "content strategy for", "plan content", "content brief", "what should we
  write about", "content calendar", "blog plan", "content pillars", "keyword research for content".
---

# Content Strategy

Build data-driven content strategies for Voyager Marketing clients.

## What This Skill Does

1. Turns scattered notes and research into structured content opportunities
2. Maps topics to client goals, funnel stage, and campaign context
3. Recommends the right deliverable type (blog, page, email, social, etc.)
4. Produces keyword-backed briefs ready for writing or delegation
5. Identifies derivative and repurpose opportunities

## Data Sources

### Ahrefs MCP (when available)
Use these tools to back recommendations with real data:

- `keywords-explorer-overview` — Volume, difficulty, CPC for seed keywords
- `keywords-explorer-matching-terms` — Find all keyword variations
- `keywords-explorer-related-terms` — Semantically related opportunities
- `keywords-explorer-search-suggestions` — Long-tail autocomplete ideas
- `keywords-explorer-volume-history` — Trending vs declining topics
- `site-explorer-organic-competitors` — Who ranks for client's terms
- `site-explorer-organic-keywords` — What competitors rank for
- `site-explorer-top-pages` — Competitor content driving the most traffic
- `gsc-keywords` — Client's existing rankings (quick wins)
- `gsc-pages` — Pages with high impressions but low CTR

Always check `subscription-info-limits-and-usage` before large Ahrefs pulls.

### Notion CRM
- Client records with service tier, goals, active campaigns
- Content database with existing briefs and status

## Workflow

1. **Research** — Pull Ahrefs data if domain/keywords available
2. **Define** — Client, audience, offer, business objective
3. **Format** — Choose deliverable type (blog, page, landing page, email, social, asset)
4. **Angle** — Problem, promise, proof, objection, CTA
5. **Brief** — Title, topic, focus keyword (with volume + KD), secondary keywords, audience, tone, outline, CTA, references, distribution
6. **Derivatives** — Social posts, email teaser, repurpose path, refresh path

## Output Shape

```
## Content Strategy: [Client] — [Topic/Campaign]

### Strategy Summary
[2-3 sentences with data backing]

### Keyword Analysis
| Keyword | Volume | KD | Current Rank | Action |
|---------|--------|-----|-------------|--------|

### Content Brief
- **Title**: ...
- **Focus Keyword**: ... (vol: X, KD: X)
- **Secondary Keywords**: ...
- **Audience**: ...
- **Tone**: ...
- **CTA**: ...
- **Outline**: ...

### Distribution Plan
- Blog publish date
- Social promotion schedule
- Email inclusion
- Repurpose opportunities

### Open Questions
- [Anything needing client input]
```

## Rules

- Ground recommendations in client goals, not abstract brand talk
- Always cite Ahrefs data with date when making traffic/keyword claims
- Favor reuse of existing content/campaign context when present
- If context is incomplete, surface blocking assumptions up front
- Be conservative with Ahrefs API credits — batch related queries, skip redundant pulls
