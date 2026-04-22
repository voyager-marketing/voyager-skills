---
name: voyager-client-onboarding
description: "Workflow for onboarding new Voyager clients — from signed agreement to fully set up in all systems. Use whenever a new client has been signed and needs to be set up, or when drafting a welcome email, kickoff communication, or onboarding checklist. Triggers on: new client, just signed, onboarding, welcome email, kickoff, client setup."
allowed-tools: [mcp__claude_ai_Notion__notion-search, mcp__claude_ai_Notion__notion-fetch, mcp__claude_ai_Notion__notion-create-pages, mcp__claude_ai_Notion__notion-update-page]
user-invocable: true
owner: Ben
last_reviewed: 2026-04-21
---

# Voyager Client Onboarding

The workflow for taking a signed client from zero to fully operational. Composes with `voyager-client-message` (for drafting comms) and `voyager-voice` (for all writing).

> **Lifecycle note.** This skill is **Deprecated** and being run in parallel with its replacement: `onboard-client` (Code-side). The Code version automates the WordPress verification, Tier 1 bindings provisioning, and Pattern Cloud sync steps that this Chat version describes as manual work. Do not retire until `onboard-client` has two weeks of verification in Live status on the Org panel. See the Voyager Skills Hub for the replacement map.

**Document everything as you go. Every step completed goes into Notion — client record, tasks, notes.**

---

## Before you start

Confirm you have:
- Signed agreement (or verbal confirmation with written follow-up)
- Services they've signed up for (hosting, SEO, social, website build, etc.)
- Primary contact name and email
- Pay schedule (monthly vs annual)
- Any client-specific quirks already flagged

If any of these are missing, get them before proceeding.

---

## The onboarding checklist

Run this for every new client. Items marked by service type are conditional.

### Core (every client)

- [ ] **Create Notion client record** — company name, status (Active), services (multi-select), pay schedule, primary contact, primary email, ARR if known
- [ ] **Create QuickBooks client entry** — confirm billing cycle and payment terms match Notion
- [ ] **Set up Stripe subscription** — confirm plan matches services signed; set billing date
- [ ] **Create project in Notion** — link to client record, set status (In Progress), add relevant tasks
- [ ] **Send welcome email** — see template below
- [ ] **Schedule kickoff call** — within 3–5 business days of signing

### For hosting clients (MWP / Basic Hosting)

- [ ] Collect domain registrar credentials (or confirm transfer)
- [ ] Collect current hosting credentials if migrating
- [ ] Provision server on SpinupWP / DigitalOcean
- [ ] Set up site in ManageWP
- [ ] Configure Cloudflare (DNS, SSL, proxy)
- [ ] Set up ManageWP monthly report for the client
- [ ] Install and activate Voyager Orbit plugin (token auth via `VOYAGER_API_TOKEN`)

### For SEO clients

- [ ] Confirm Google Analytics is installed (or install GA4) — get access via Google account delegation
- [ ] Set up or verify Google Search Console — add Voyager as owner
- [ ] Request Google My Business delegation
- [ ] Create Ahrefs project, configure rank tracker with agreed keyword list
- [ ] Request Semrush access if applicable
- [ ] For AdWords clients: confirm Google Ads account access and assign Voyager as manager

### For social media clients

- [ ] Collect Facebook Page admin access
- [ ] LinkedIn Page admin access
- [ ] Instagram (via Facebook Business Manager)
- [ ] Google My Business (if not done under SEO)
- [ ] Mailchimp audience access (if email marketing is included)
- [ ] Confirm content calendar start date and first cycle

### For website builds

- [ ] Kickoff call scheduled with discovery questions prepared (see Project Discovery SOP)
- [ ] Asset gathering list sent (see Asset Gathering SOP in Agency Copilot)
- [ ] Staging environment provisioned
- [ ] Repo created under `voyager-marketing` GitHub org (naming: `[client-slug]-theme` or `[client-slug]-site`)

---

## Welcome email

Send within 24 hours of signing. Goes under Alex's name unless Ben has been the primary contact.

> Hi [Name],
>
> Welcome to Voyager. We're glad to have you on board.
>
> Over the next few days you'll hear from us about getting everything set up. For [service], we'll need [specific access or info — see checklist above]. We'll send that request separately.
>
> Your kickoff call is [scheduled for X / we'll send a link to book a time]. That's where we'll walk through [what the kickoff covers — timeline, what we need, what to expect].
>
> In the meantime, feel free to reach out at [alex@voyagermark.com or ben@voyagermark.com depending on service type].

Adjust the bracketed sections based on what they signed up for. No filler. Don't mention every service in the first email — keep it to the one or two most relevant to their first 30 days.

---

## Kickoff call agenda

Use this structure. Keep to 30–45 minutes.

1. Introductions (1–2 min if new relationship)
2. Confirm services and scope (what's included, what's not)
3. Timeline and milestones (first deliverable, first check-in date)
4. What Voyager needs from them to start (access, assets, approvals)
5. How communication works (primary contact, expected response times, how to reach us)
6. Q&A

After the call: send a brief follow-up email that same day recapping decisions and listing what each party owes the other.

---

## Roles and responsibilities

**Alex owns:** welcome email, kickoff call scheduling, client communication, billing confirmation, access requests.

**Ben owns:** server provisioning, SpinupWP, ManageWP setup, Orbit plugin install, GitHub repo creation, GA/GSC technical setup.

When in doubt: client-facing work is Alex, technical infrastructure is Ben.

---

## What to log in Notion

After onboarding is complete:
- All services confirmed in the client record (Services field, multi-select)
- All TP_IDs filled in (GA, GSC, SEM, Ahrefs, Stripe ID, FB, MC-A, MC-S as applicable)
- Google Drive folder linked (create one if it doesn't exist, link in the Google Drive field)
- Onboarding task marked Done
- Any quirks or notes added to client notes

---

## Common onboarding failure points

**Credential collection drags.** Chase it once after 48 hours. If still stuck, let Alex handle it directly — don't let setup block billing start.

**Orbit plugin not installed.** This is required for Voyager Portal to receive health data. Don't skip it for hosting clients.

**GA/GSC not delegated properly.** Always verify access works from a Voyager account before marking done.

**Billing start date mismatch.** Stripe and Notion must agree on when billing starts. Reconcile on kickoff day.
