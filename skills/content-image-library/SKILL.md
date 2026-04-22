---
name: content-image-library
description: "Use when you need an image for a post or page and want to search the Voyager R2 image library before generating a new one. Saves a generation cost when a previously-made image fits. Pairs with content-hero-image (which generates new). Triggers on: 'find an image for', 'search the image library', 'do we have an image of', 'show me our generated images', 'reuse an image', 'browse the image library'."
argument-hint: "[--prefix images/2026-04] [--limit 50] [--save-drive] [--post-id 123] [--site domain.com]"
allowed-tools: [Bash, Read, Grep, Glob, Agent, TodoWrite]
user-invocable: true
owner: Ben
last_reviewed: 2026-04-21
---

# Content Image Library

Browse the Voyager R2 image library (`images/YYYY-MM-DD/<uuid>.jpg`) to find a previously-generated image that fits the current need. Saves the ~$0.04-$0.24 generation cost when a reuse works. Companion to `content-hero-image` (which is for new generations).

## When to use

- A blog post or service area page needs a hero and a similar one was recently generated
- Ben or Alex wants to see what's been generated in the last N days or for a given client
- A previously-generated image needs to be re-uploaded to a different post or backed up to Drive

## When NOT to use

- The topic is new and it's unlikely anything in the library fits — skip the lookup, go straight to `content-hero-image`
- The user needs a specific visual concept with no possible reuse (e.g., client-specific composite with their logo baked in)
- The image would need **editing** to fit. In that case, pair this skill with `image_edit` via `content-hero-image` instead.

## The tool chain

Primary:
```
image_library_list  →  (user picks)  →  optional reuse path
```

Reuse paths:
- **Just preview** — return the signed URL, stop.
- **Save to Drive** — `image_save_to_drive` with the chosen R2 key.
- **Upload to WordPress** — `wp_upload_media` → optional `wp_set_featured_image`.

## Procedure

### Step 1 — List the library

Call `image_library_list`:

- `prefix`: narrow by date or batch. `images/2026-04-` for this month; `images/2026-04-20/` for a specific day. Leave default (`images/`) for everything.
- `limit`: default 50. Bump to 100 for broader searches; drop to 10 when the user wants a quick glance.
- `expires_in_seconds`: leave default (3600) unless downstream reuse will take longer.
- `cursor`: for pagination — pass whatever the previous call returned as `cursor` to fetch the next page.

Output: list of R2 objects with signed URLs, last_modified, size, and mime_type.

### Step 2 — Filter by intent

The library doesn't have topic tags. Filter by what the user can infer:
- **Date** — if the user says "the one from last Tuesday", scope the prefix to that day.
- **Aspect ratio** — inspect `width`/`height` when available (landscape vs portrait vs square).
- **Recency** — default to showing the last 14 days unless a broader window is asked.

Present the candidates as a compact list. Don't embed all the signed URLs in chat output — pick the top 5-10 likely matches and show one URL per.

### Step 3 — User picks (or punts)

Three outcomes:

- **User picks a URL**. Move to step 4 for the chosen reuse path.
- **User wants to see more**. Page through with the `cursor` from the previous response.
- **None fit**. Stop here and hand off to `content-hero-image` for a fresh generation.

### Step 4 — Reuse path

Branch on what the user asked for:

**A. Just the URL** — return it, note the expiry time (1 hour default), and stop.

**B. Save to Drive (`--save-drive`)** — call `image_save_to_drive`:
- `r2_key`: the key from `image_library_list` (e.g. `images/2026-04-20/abc123.jpg`). OR
- `signed_url`: the full signed URL (the tool extracts the key from the path).
- `title`: build a descriptive filename like `{topic}-reuse-{YYYY-MM-DD}.jpg`.
- `folder_id`: leave default (Voyager AI Image Library folder).

**C. Upload to WordPress (`--post-id`)** — two calls:
1. `wp_upload_media` with the signed URL and a descriptive `alt_text`.
2. If the user asked to set it as featured: `wp_set_featured_image` with the attachment ID from step 1.

### Step 5 — Confirm

Return a summary:

```
## Image Library — [topic/prefix]

**Found:** [N images matching filter]
**Chosen:** [filename or "none — handoff to content-hero-image"]

[if reused]
**Saved to Drive:** [drive URL]  -or-  not requested
**Uploaded to WP:** attachment [id], featured on post [post_id] — [permalink]
```

## Guardrails

- **Don't dump hundreds of URLs into chat output.** Paginate. 5-10 previews at a time is plenty.
- **Respect R2 signed-URL TTL.** Default is 1 hour. If the user says "I'll come back to this tomorrow," regenerate the URL via another `image_library_list` call the next day rather than caching the URL.
- **Alt text is required on WordPress upload.** Don't call `wp_upload_media` without one. Derive from the inferred subject of the image.
- **If nothing matches, say so clearly** and offer the handoff to `content-hero-image` rather than forcing a poor-fit image.
- **Don't claim an image exists that you haven't actually seen in the list result.** If `image_library_list` returned zero matches for the prefix, that's the truthful answer.

## Related skills

- `content-hero-image` — generates a new image when the library has no fit.
- `publish` — if you're in the publishing flow, the `publish` skill handles `wp_set_featured_image` at the end via `wp_upsert_content`'s `featured_image_url` field. Pass the library's signed URL in there rather than running step 4C separately.
- `pseo-manage` — for service area pages that need enriched imagery.
