---
description: Run a branded SEO audit on a prospect's website
argument-hint: "<domain> [--deep] [--pages /about,/services]"
---

# /prospect-audit

Audit a prospect's website and generate a branded Voyager Marketing report. Arguments: $ARGUMENTS

Follow the SKILL.md pipeline:

- Parse the domain plus optional `--deep` and `--pages /about,/services` arguments.
- Call `content_prospect_audit(domain, deep?, pages?)` once.
- Use the returned `scores`, `findings`, `pagespeed`, and `recommendations`.
- Do not manually fetch pages, call PageSpeed, or recalculate scores in the command.
- Generate branded markdown report with Executive Summary, Scores, per-category findings, Quick Wins, and Voyager CTA.
- Save full report to `prospect-audits/{domain}-audit.md`.
- Display Executive Summary + Scores at a Glance in terminal. Report where the file was saved.
- Only report what the MCP measured. Skip missing sections instead of guessing.
