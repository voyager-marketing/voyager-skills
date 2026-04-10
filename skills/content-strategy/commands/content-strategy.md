---
description: Plan a data-driven content strategy for a client
argument-hint: "<client name> <topic or campaign>"
---

# /content-strategy

Build a content strategy for a Voyager Marketing client. Context: $ARGUMENTS

## Steps

1. **Parse input** -- Extract client name, topic/campaign, and any constraints from $ARGUMENTS
2. **Pull data** -- If a client domain is known, use Ahrefs MCP tools:
   - `keywords-explorer-overview` for seed keyword metrics
   - `keywords-explorer-matching-terms` and `related-terms` for expansion
   - `gsc-keywords` for existing rankings (quick wins)
   - `site-explorer-organic-competitors` for competitive landscape
3. **Research** -- Read any relevant Notion records for this client (campaigns, existing briefs)
4. **Strategize** -- Follow the workflow in the SKILL.md
5. **Output** -- Produce the structured strategy document with keyword table, brief, distribution plan
6. **Flag** -- Surface any open questions that need client or team input

## If no Ahrefs data available

Still produce the strategy but note where data would strengthen recommendations. Suggest specific Ahrefs queries the team could run later.

## If no client specified

Ask which client and topic before proceeding. Don't guess.
