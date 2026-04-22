---
name: voyager-client-context-check
description: "Prerequisite context check that must run before drafting any message to or about a named Voyager client or prospect. Looks up the client in Notion (status, retainer), pulls their quirks, scans Gmail for the last 30 days of threads, surfaces any attachments exchanged, and reports what it found before a single word of the draft is written. ALWAYS run this before drafting — do not skip for short messages, quick replies, or 'just a one-liner.' Fires as a prerequisite to voyager-client-message and voyager-cold-email. If a user names a client or prospect and is about to write to them, this skill runs first, every time."
allowed-tools: [mcp__claude_ai_Notion__notion-search, mcp__claude_ai_Notion__notion-fetch]
user-invocable: true
owner: Ben
last_reviewed: 2026-04-21
---

# Voyager Client Context Check

**The rule:** Don't start drafting until you've told the user what you found. If the user is about to respond to a thread, they need to know what's in it — not be handed a draft built on assumptions.

> **Lifecycle note.** This skill is **Deprecated** and being run in parallel with its replacement: `client-prep` (Code-side). Do not retire until `client-prep` has two weeks of verification in Live status on the Org panel. See the Voyager Skills Hub for the replacement map.

This skill is a prerequisite step. It gathers context, surfaces it clearly, and only then hands off to the relevant drafting skill. It does not draft.

---

## When this fires

Any time the user asks to draft, reply, write, or respond to or about a specific named client or prospect. This includes:

- "Draft an email to [client]"
- "Reply to [client] about..."
- "Write a follow-up for [name]"
- "What should I say to [client]?"
- Any message where a specific person or company name is the intended recipient

**It does NOT fire for:**
- Internal Voyager messages (no client named)
- Generic writing tasks with no named recipient
- Situations where client context was already surfaced earlier in the same conversation

---

## The workflow

### Step 1: Extract the client name

Identify the client or prospect from the user's request. If it's ambiguous ("the Jen client"), clarify before doing anything:

> "Just to confirm — which Jen? WonderLodge / Luna Rio, or someone else?"

Don't proceed to lookups until the name is clear.

---

### Step 2: Look up the client in Notion

Use the Notion connector to search the Clients database for the client by name.

Pull:
- **Status** — Active, Late, Cancel, Prospect, New, On Hold
- **Retainer amount** (if visible)
- **Primary contact name and email**

**If the client is NOT found in Notion:**
> "I couldn't find [name] in the Notion Clients database. They may be a prospect, or stored under a different name. Should I proceed without Notion context, or search under a different name?"

**If status is Late or Cancel, lead with it — before the summary block, before anything:**
> ⚠️ **Status flag: [Client] is currently marked as [Late / Cancel] in Notion.** Do you want to factor this into the message, or proceed as if current?

Don't bury this. It's the most important thing on the page.

---

### Step 3: Check Client Quirks

Check the `client-quirks.md` knowledge file in the Voyager Project first. Then, if available, check the Notion Client Quirks page for this client.

Surface only what's relevant to this specific message. Don't dump the full quirks file.

Examples of what to surface:
- Communication preferences ("prefers Slack over email")
- Terminology landmines ("when Jen says 'link' she means backlinks, not 301s or internal links")
- Relationship dynamics ("this is a referral from X — be warm")
- Known sensitivities ("gets anxious when timeline isn't explicit")
- Routing rules ("Firekite: route everything through Zach or Alexander, never directly to Mason")

If nothing applies to this message, one line: "No relevant quirks for this message."

---

### Step 4: Search Gmail (last 30 days)

Use the Gmail connector to search for recent threads with this client.

**Search strategy:**
1. Search by their email domain: `from:@clientdomain.com OR to:@clientdomain.com`
2. If that returns nothing useful, search by the contact's name
3. Filter to the last 30 days
4. Read the 2–3 most recent threads in enough depth to summarize them

**For each relevant thread, capture:**
- Date of most recent message in the thread
- Who sent the last message (client or Voyager — i.e., is the ball in our court or theirs?)
- What the thread was about in one sentence
- Any open ask — something the client is waiting on, or something Voyager is waiting on
- **Attachments** — if any files were sent or received, list filename(s) and date(s) explicitly

**If Gmail returns nothing in 30 days:** Note it. Don't silently move on. The user may not realize how long it's been since contact.

---

### Step 5: Surface the context summary

Output this block before writing a single word of any draft:

---

**Context Check: [Client Name]**

**Notion Status:** [Active / Late / Cancel / Prospect / Not found]
*(If Late or Cancel, this was already flagged above — don't repeat, just reference it)*

**Quirks:** [Relevant ones only, or "None relevant to this message."]

**Recent Gmail (last 30 days):**
- [Date] — [Subject or topic] — [1-sentence summary. Ball in whose court? Any open ask?]
- [Date] — [Subject or topic] — [Same format]
- *(If nothing: "No threads found in the last 30 days.")*

**Attachments exchanged:**
- [Filename — Date — Sent by whom]
- *(If none: "No attachments found in recent threads.")*

**Flags before drafting:**
- [Open items client or Voyager is waiting on]
- [Status concerns]
- [Anything that should shape the message's tone or content]
- *(Or: "None — looks straightforward.")*

---

After the summary, ask: **"Ready to draft. Want me to proceed with the [email / reply / update]?"**

Wait for confirmation, or proceed if the user's intent is unambiguous.

---

## Output principles

**Be brief, not shallow.** The summary should take 30 seconds to read. If a thread had 40 messages, summarize it in 2 sentences — but don't miss the key fact buried in message 38.

**Attachments always get their own explicit line.** "None found" and "3 attachments found" are both valid outputs. What's not valid is skipping the check. The missed-attachments pattern is a known failure mode. Name it or name the absence of it.

**Status flags go first.** Late or cancelling clients change everything about how a message should be framed. Surface it first, loudly, not as a footnote.

**Flag what you couldn't access.** If Notion returned no results, say so. If Gmail access wasn't available, say so. Don't quietly omit a step and present a partial summary as complete.

**Don't invent.** If you couldn't find the thread, say so. Don't speculate about what was discussed.

---

## What this skill does NOT cover

- Writing the actual message: `voyager-client-message` (existing clients) or `voyager-cold-email` (prospects)
- Voice and style rules: `voyager-voice`
- Team authority: `voyager-team-context`
- SEO context for a client: `voyager-seo-approach`
- Email signatures: handled by the Voyager Project knowledge file
