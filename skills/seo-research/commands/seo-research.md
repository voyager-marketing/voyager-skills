---
description: Research SEO data for a domain or topic using Ahrefs
argument-hint: "<domain or topic> [keyword research | competitor gap | backlinks | audit]"
---

# /seo-research

Run SEO research using Ahrefs MCP tools. Context: $ARGUMENTS

## Steps

1. **Parse input** -- Extract domain, topic, or research type from $ARGUMENTS
2. **Check credits** -- Run `subscription-info-limits-and-usage` to see remaining Ahrefs API credits
3. **Determine research type**:
   - If a domain is given with no qualifier: run Quick Domain Health Check
   - If "keyword" or topic keywords: run Keyword Research workflow
   - If "competitor" or "gap": run Competitor Gap Analysis
   - If "backlink": run Backlink Opportunities workflow
   - If "audit": run all four workflows
4. **Execute** -- Follow the matching workflow from SKILL.md
5. **Output** -- Structured report with data tables and recommendations
6. **Credit check** -- Note approximate API credits consumed

## Research Type Detection

- `seo-research example.com` -- Quick Domain Health Check
- `seo-research "best crm for agencies"` -- Keyword Research
- `seo-research example.com competitors` -- Competitor Gap Analysis
- `seo-research example.com backlinks` -- Backlink Opportunities
- `seo-research example.com audit` -- Full audit (all workflows)

## If Ahrefs MCP not connected

Report that Ahrefs tools are needed and suggest connecting the Ahrefs MCP server. In the meantime, suggest manual research steps.
