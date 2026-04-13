---
description: Run a branded SEO audit on a prospect's website
argument-hint: "<domain> [--deep] [--pages /about,/services]"
---

# /prospect-audit

Audit a prospect's website and generate a branded Voyager Marketing report. Arguments: $ARGUMENTS

Follow the SKILL.md pipeline:

- Fetch homepage (and inner pages if `--deep` or `--pages` provided) via WebFetch.
- Extract on-page SEO signals: title, meta, H1, heading hierarchy, links, images, schema, OG tags, word count.
- Check technical signals: HTTPS, mobile viewport, robots.txt, sitemap.xml.
- Fetch Google PageSpeed Insights (mobile + desktop) for Core Web Vitals.
- If `--deep`, use WebSearch for competitive context.
- Score each category (On-Page 30%, Technical 25%, Speed 25%, Content 20%) and compute weighted overall score.
- Generate branded markdown report with Executive Summary, Scores, per-category findings, Quick Wins, and Voyager CTA.
- Save full report to `prospect-audits/{domain}-audit.md`.
- Display Executive Summary + Scores at a Glance in terminal. Report where the file was saved.
- Pause 2 seconds between WebFetch calls. Only report what was actually measured.
