---
name: provision-site-data
description: Use when pushing Tier 1 site data (phone, email, address, hours, social URLs) to a Voyager-managed WordPress site after build-kickoff. Pulls known fields from the Notion Clients row, asks for the missing ones (hours + social), then runs the voyager-orbit/provision-site-data ability and verifies the voyager_site_* options. Trigger phrases include "provision site data for [name]", "push contact info to [name]", "set up site options for [slug]", "run tier 1 bindings for [name]", "/provision-site-data [name]". Halts if the client has no Websites row or required fields are missing. Do NOT use before voyager-build-kickoff has completed.
owner: Ben
last_reviewed: 2026-04-30
---

# Provision Site Data

Pushes Tier 1 site data into WordPress `voyager_site_*` options so the `voyager/site-data` block binding source can render phone, email, address, hours, and social URLs across blocks and patterns.

Scope. One site at a time, after `voyager-build-kickoff` has completed. Assumes Orbit is active and Portal-registered.

---

## Phase 1. Resolve client

Resolve the target by business name (positional arg) or `--clients-db-url=<id>`.

1. Try `client_get_profile` first. If populated, capture `domain`, `business_name`, contact fields (phone, email, address_raw).
2. Fallback: `notion-search` the Clients DB, then `notion-fetch` the row plus its `Websites` relation.

Capture from the Websites row: `Domain`, site URL, `SpinupWP Site ID`.

**Halt** if: no Clients row, empty/multi `Websites` relation (ask which), or required field missing. Surface what's empty and stop.

---

## Phase 2. Gather inputs

### Address parser

Split `address_raw` on commas: `street, city, state_zip`. From the last segment pull the 2-letter state and trailing 5-digit (or ZIP+4). Example: `"3041 Lauderdale Drive, Henrico, VA 23233"` → street `3041 Lauderdale Drive`, city `Henrico`, state `VA`, zip `23233`. If the parse fails, show the raw string and ask for the components. Do not guess.

### Prompt for missing fields

```
Business hours? (e.g. "Mon–Fri: 10am–6pm, Sat: 9am–3pm, Sun: closed")
Facebook URL? (optional)
Instagram URL? (optional)
LinkedIn URL? (optional)
```

Never default hours. Never silently drop a social URL the user provided. If the user skips a social, pass empty string.

### Confirm payload

Show the full payload and require explicit Run / Edit / Cancel before proceeding.

```
Push these to [domain]?

Phone:    [phone]
Email:    [email]
Address:  [street], [city], [state] [zip]
Hours:    [hours]
Facebook: [url or "-"]
Instagram: [url or "-"]
LinkedIn: [url or "-"]
```

---

## Phase 3. Execute and verify

One ability call, then read-back.

```
wp_execute_ability(
  site: <domain>,
  ability_name: "voyager-orbit/provision-site-data",
  args: { phone, email, street, city, state, zip, hours,
          social: { facebook, instagram, linkedin } }
)
```

<!-- TODO: confirm args shape matches the ability's registered schema (flat vs nested social). Adjust if Orbit expects flat keys like social_facebook. -->

Verify with:

```
wp_get_options(
  site: <domain>,
  option_names: [
    "voyager_site_phone", "voyager_site_email",
    "voyager_site_address", "voyager_site_city",
    "voyager_site_state", "voyager_site_zip", "voyager_site_hours",
    "voyager_site_social_facebook",
    "voyager_site_social_instagram",
    "voyager_site_social_linkedin"
  ]
)
```

If any required option is empty, halt with the diff. Report the written options back to the user. Notion is not updated (WP option is the source of truth; Orbit syncs upstream).

---

## What this skill does NOT do

- Write to Notion. Address/phone/email source-of-truth stays there.
- Provision the site itself (`voyager-build-kickoff`).
- Configure brand tokens or scaffold core pages (separate skills).
