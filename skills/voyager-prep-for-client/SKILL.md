---
name: voyager-prep-for-client
description: "Full client briefing that preps Ben or Alex for a call, meeting, or touchpoint with a specific client. Pulls from 7 sources in sequence: Notion CRM (profile, services, status), Gmail (recent threads), Google Calendar (upcoming meetings), Slack (recent mentions), Stripe (payment health), Ahrefs (SEO snapshot for their domain), and Notion tasks (active projects). Synthesizes into a single briefing with talking points, concerns, wins, and upsell opportunities. Use when someone says 'prep me for [client]', 'brief me on [client]', 'what's the status on [client]', 'I have a call with [client]', or 'catch me up on [client]'. Do NOT use for drafting messages — hand off to voyager-client-message after the briefing."
allowed-tools: [mcp__claude_ai_Notion__notion-search, mcp__claude_ai_Notion__notion-fetch, mcp__claude_ai_Notion__notion-query-database-view]
user-invocable: true
owner: Ben
last_reviewed: 2026-04-21
---

# Prep for Client — Full Briefing

The power skill for client-facing work. One request, seven data sources, one briefing that would take 30–45 minutes to compile manually.

> **Lifecycle note.** This skill is **Deprecated** and being run in parallel with its replacement: `client-prep` (Code-side). Do not retire until `client-prep` has two weeks of verification in Live status on the Org panel. See the Voyager Skills Hub for the replacement map.

---

## When this fires

- "Prep me for [client]"
- "Brief me on [client]"
- "I have a call with [client] — catch me up"
- "What's the status on [client]?"
- "Catch me up on [client]"
- "Give me a full rundown on [client]"
- Any request for a comprehensive client status check before a touchpoint

**Does NOT fire for:**
- Drafting messages (that's `voyager-client-message`)
- Quick questions about one specific aspect ("when did we last email [client]?" — just answer it)
- Internal Voyager discussions with no specific client named

---

## The workflow

Run these steps in order. Do all of them — don't skip sources because earlier steps returned enough. The value is the synthesis across ALL sources, not any single one.

### Step 1: Identify the client

Extract the client name from the request. If ambiguous, clarify before proceeding.

Check the `client-quirks.md` knowledge file immediately — load any known quirks, preferences, routing rules, or sensitivities. These shape everything that follows.

### Step 2: Notion CRM lookup

Search the Notion Sales CRM database for the client.

Pull and hold:
- **Name** and **Stage** (Client 💪, Prospect, Lead, etc.)
- **Services** they're paying for (SEO, Website, MWP, etc.)
- **Primary Contact** name and **Primary Email**
- **Last Contact** date
- **Lead Score** and **Priority**
- **Issues Found** (technical issues flagged)
- **Type** (industry: Restaurant, Home Services, Real Estate, etc.)
- **Website** URL
- **Lead Source** (Referral, Cold Outreach, Website, etc.)
- **Manager** (Ben or Alex)

If not found: say so clearly. They may be in a different database or under a different name.

If Stage is NOT "Client 💪" — flag it prominently. Briefings for prospects, leads, or archived clients need a different frame.

### Step 3: Notion tasks and projects

Search Notion for active tasks and projects linked to this client.

Pull:
- Active projects with status (In Progress, Planned, Blocked, Review)
- Tasks due this week or overdue
- Any tasks marked as Blocked — these need to be addressed on the call
- Recent completed milestones (wins to mention)

### Step 4: Gmail scan (last 30 days)

Search Gmail for recent threads with the client's email domain or primary contact.

For each relevant thread:
- Date of last message
- Who sent last (ball in whose court?)
- One-sentence summary
- Any open ask or pending deliverable
- Attachments exchanged

If no threads in 30 days: **Flag this prominently.** A client you haven't emailed in 30 days is a retention risk. This should appear in the concerns section.

### Step 5: Google Calendar check

Search Google Calendar for:
- Upcoming meetings with this client (next 30 days)
- Recent past meetings (last 30 days) — when did you last meet?

Note: if there's a meeting coming up soon (next 7 days), the briefing is likely prep for THAT meeting. Tailor the talking points accordingly.

### Step 6: Slack mentions

Search Slack for recent mentions of the client name in the last 30 days.

Look in:
- voyager-dispatch (task completions, agent work)
- General channels where the client might be discussed

Surface: any notable discussions, decisions, or flags. If the client was recently discussed in Slack for a specific issue, that's context Alex needs.

### Step 7: Stripe payment check

Search Stripe for this client's subscription or payment history.

Pull:
- Current subscription status (active, past_due, canceled)
- Last successful payment date and amount
- Any failed payments in the last 90 days
- Upcoming renewal or invoice

If payment is past_due or there are recent failures: **Flag immediately.** This changes the entire tone of the conversation.

### Step 8: Ahrefs SEO snapshot (if they have a website)

If the client has a website URL in their Notion profile, pull a quick Ahrefs snapshot:

- Domain Rating (DR)
- Organic traffic estimate
- Number of ranking keywords
- Top 3-5 ranking keywords with positions
- Any notable changes (traffic up/down, new keywords, lost keywords)

This gives Alex ammunition for the conversation: "Your organic traffic is up 15% this quarter" or "We're now ranking for 47 keywords, up from 31."

If the client doesn't have SEO services, still pull this — it's an upsell data point.

---

## The briefing output

After ALL steps complete, synthesize into this format:

---

## 📋 Client Briefing: [Client Name]

**Quick status:** [One sentence — are things good, concerning, or on fire?]

### Profile
- **Stage:** [Client 💪 / Prospect / etc.]
- **Services:** [Website, SEO, MWP, etc.]
- **Industry:** [Restaurant, Home Services, etc.]
- **Primary contact:** [Name] — [email]
- **Website:** [URL]
- **Last contact:** [Date — and how many days ago]
- **Quirks:** [Relevant ones from client-quirks.md]

### Relationship health
- **Payment:** [Active / Past due / Amount / Last payment date]
- **Communication:** [Active threads / Ball in whose court / Days since last email]
- **Meetings:** [Last meeting / Next meeting / Meeting gap if concerning]

### Active work
- [Project 1] — [Status] — [Key milestone or blocker]
- [Project 2] — [Status]
- Overdue tasks: [List any, or "None"]
- Blocked items: [List any, or "None"]

### SEO snapshot (if available)
- **Domain Rating:** [DR score]
- **Organic traffic:** [Monthly estimate]
- **Keywords ranking:** [Count]
- **Notable:** [Traffic trend, new rankings, or losses]

### Talking points for this conversation
1. [Win to highlight — something positive to lead with]
2. [Active work update — what's in progress and on track]
3. [Any issue that needs addressing — blocked tasks, overdue items, concerns]
4. [Forward-looking — what's coming next, what they can expect]

### Concerns to raise proactively
- [Anything that's off — payment issues, communication gaps, blocked work, declining metrics]
- [Or: "No concerns — relationship looks healthy."]

### Upsell opportunities
- [Service gaps — e.g., they have Website but not SEO, and their Ahrefs data shows they're leaving traffic on the table]
- [Integration gaps — e.g., no GA4 connected, no GSC access]
- [Growth signals — e.g., traffic is up and they could benefit from more content]
- [Or: "No obvious upsells right now — they're well-served."]

### Suggested follow-up actions
- [ ] [Concrete next step based on everything above]
- [ ] [Another next step if relevant]

---

## Output principles

**Lead with the overall vibe.** Alex needs to know in one second whether this client is happy, at risk, or somewhere in between. The "quick status" sentence does this.

**Payment issues go in concerns, not buried in the profile.** A past-due invoice changes the entire tone of the conversation. Surface it in the concerns section even if it's already in the profile section.

**Ahrefs data is talking-point fuel.** Even a small win ("you're now ranking for 3 new keywords") makes Alex sound informed and proactive. Always translate raw data into a sentence Alex can actually say on a call.

**Don't invent data.** If a source returned nothing, say what you checked and what you didn't find. "No Stripe subscription found" and "Gmail returned no threads in 30 days" are both important signals, not failures.

**The upsell section is optional but powerful.** If there's a genuine gap — they don't have SEO but their domain is ranking for 12 keywords organically — that's a warm upsell. If there's nothing, don't force it.

**Keep it under 2 minutes to read.** This is a briefing, not a report. Alex should be able to scan it while walking to a call.

---

## What this skill does NOT cover

- Drafting the actual message to the client: `voyager-client-message`
- SEO strategy or audit work: `voyager-seo-approach`
- Voice and writing style: `voyager-voice`
- Onboarding a new client: `voyager-client-onboarding`
- Cold outreach to prospects: `voyager-cold-email`

After the briefing, if Alex wants to draft a message, hand off to `voyager-client-message` with all the context already loaded.
