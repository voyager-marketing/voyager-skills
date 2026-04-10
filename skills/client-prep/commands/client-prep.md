---
description: Build a briefing before a client call or meeting
argument-hint: "<client name> [meeting context]"
---

# /client-prep

Prepare a briefing for a client touchpoint. Context: $ARGUMENTS

## Steps

1. **Parse input** -- Extract client name and meeting context from $ARGUMENTS
2. **Pull client record** -- Search Notion for the client. Get service tier, contacts, active projects.
3. **Check calendar** -- If a meeting is referenced, pull event details and attendees from Google Calendar
4. **Scan recent activity** -- Search Gmail for recent threads, Slack for mentions, check for open support tickets
5. **Check financials** -- Pull Stripe subscription and invoice status
6. **Check health** -- If client has a website, pull Ahrefs metrics or GSC trends
7. **Synthesize** -- Build the briefing following the SKILL.md format
8. **Add talking points** -- Suggest proactive topics based on what you found

## If client not found in Notion

Ask for clarification. Don't guess which client they mean.

## If meeting is today

Prioritize speed. Skip deep research, focus on: open items, anything overdue, last communication, and one proactive talking point.
