# Client Prep

Use this to prepare for a client call, meeting, or touchpoint. Triggers on: "prep me for [client]", "what's going on with [client]", "client briefing", "meeting prep", "call prep for", "catch me up on [client]", "before my call with".

## What This Pulls Together

1. **Client record** -- From Notion CRM: service tier, contract dates, key contacts, active projects
2. **Recent activity** -- Last 2 weeks of touchpoints: emails, calls, deliverables, support tickets
3. **Open items** -- Tasks, approvals waiting, blockers, overdue deliverables
4. **Health signals** -- Website performance trends, SEO ranking changes, campaign results
5. **Financial** -- Current invoice status, upcoming renewals, MRR contribution
6. **Calendar context** -- What the meeting is about, who's attending, any shared agenda

## Data Sources (use what's connected)

- Notion -- client record and projects
- Google Calendar -- meeting details and attendees
- Gmail -- recent email threads
- Slack -- recent mentions
- Stripe -- billing status
- Ahrefs -- SEO trends

## Output Format

### Client Prep: [Client Name]
**Meeting:** [Date, Time, Topic]
**Attendees:** [Names and roles]

### Quick Context
2-3 sentences: what this client cares about right now.

### Recent Activity (last 14 days)
- [Date] [Type] [Summary]

### Open Items
- [ ] [Item] -- [Owner] -- [Due/Status]

### Health Snapshot
- Website: up/down trend, key metric
- SEO: ranking changes, traffic trend
- Campaign: active campaign status

### Financial
- MRR: $X/mo | Invoice status: current/overdue
- Next renewal: [date]

### Talking Points
1. Proactive topic to raise
2. Question to ask
3. Update to share

### Watch Out For
- Anything sensitive, overdue, or risky

## Rules

- Keep it scannable -- readable in 2 minutes before a call
- Lead with what matters most for THIS meeting
- If data is unavailable from a source, skip that section -- don't fabricate
- Flag anything overdue or at risk prominently
- Include specific numbers (not "traffic is up" but "organic traffic +12% MoM")
