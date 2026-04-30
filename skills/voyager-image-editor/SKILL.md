---
name: voyager-image-editor
description: "Generate, edit, browse, or save images via the Voyager MCP image and WordPress tools. Triggers on: 'generate hero image', 'create an image of', 'make a picture of', 'render an illustration', 'edit image', 'modify this photo', 'remove [X] from', 'replace [X] with', 'find an image of [X]', 'show me the library', 'save image to [client] drive', 'upload to [client] media library', 'set as featured image for post [N]'. Routes intent to image_generate / image_edit / image_library_list / image_save_to_drive / wp_upload_media / wp_set_featured_image."
argument-hint: "[prompt]"
user-invocable: true
owner: Ben
last_reviewed: 2026-04-30
---

# Voyager Image Editor

Route natural-language image requests to the right MCP tool. Generation is Gemini-backed (`flash` default, `pro` on request).

## Decision tree

Pick the path before calling anything:

- **Generate** (new image from a description). Phrases: "generate", "create", "draw", "design", "render", "make an image of", "picture of", "illustration of". Tool: `image_generate`.
- **Edit** (change an existing image). Phrases: "edit", "modify", "remove", "replace", "change", "swap", "add [X] to [this]", "retouch", "fix". The user attached an image OR gave a URL. Tool: `image_edit`.
- **Browse / find** (search the R2 library). Phrases: "show me the library", "find the [X] one from last week", "what did I generate yesterday". Tool: `image_library_list`.
- **Save** (push to client Drive or WordPress). See "Saving" below.

If the user attached an image, default to edit. If no image and no library reference, default to generate. When ambiguous, ask: "Generate new, edit existing, or find one in the library?"

## Aspect-ratio inference

Infer from context, then confirm if the user did not specify:

- "hero", "banner", "header", "landing page" -> `16:9`
- "phone wallpaper", "story", "reel" -> `9:16`
- "icon", "avatar", "square" -> `1:1`
- "portrait", "card", "poster" -> `4:3` or `3:4`

Default: `1:1`.

## Model + cost gate

`flash` is $0.039 per image (default). `pro` is $0.134 per image. If the user asks for `pro` ("use pro", "high fidelity", "4K print"), confirm cost first: "Pro model runs ~$0.13 per image vs $0.04 for flash. Proceed?" Wait for yes before calling.

## Regeneration cap

If the first output misses, regenerate up to **3 times total** with sharper prompts. After three attempts, stop and ask the user to redirect rather than burning more credits.

## Generate

Call `image_generate({ prompt, aspect_ratio, model })`. Show the returned signed URL inline. Render the image so the user can see it. Surface model + cost from the response.

After showing the result, offer once: "It's in the 30-day R2 library. Want me to save it to a client Drive folder, upload to a WP media library, or set as a featured image?" Then move on.

## Edit

Call `image_edit({ image_url, instructions })`. The `image_url` is either the URL the user pasted or the previous generation's R2 URL. Same regeneration cap (3 attempts).

## Browse the library

Call `image_library_list({ filters })` with prefix, date, or keyword filters. Render results as a compact table (name, date, size, link). Do not dump JSON.

## Saving

### CLIENT-ISOLATION RULE — read this every time

Voyager runs 15+ client sites. **Never infer the destination.** The `site` parameter on `wp_upload_media` is mandatory and must be explicitly named by the user. There is no alphabetical-first fallback. There is no "the obvious one." If the user says "save it to the client site" without a name, ask which client. Cross-client image upload is the worst footgun in this skill.

**Prior-turn context does not count.** If the user's most recent message does not contain the site or drive name verbatim, ask before calling. A site mentioned three turns ago is not consent for the current upload. This includes any "save it" / "upload it" / "use it as featured" follow-up where the user did not re-state the site.

Same rule for `image_save_to_drive`: `drive_folder` must be explicit, and prior-turn references do not count.

### Save to client Drive

Trigger: "save to [client] drive", "drop in [client]'s folder". Call `image_save_to_drive({ r2_url, drive_folder, name })`.

### Upload to WordPress media library

Trigger: "upload to [client]'s media library", "save to Regency". Call `wp_upload_media({ site, file_url, alt_text })`. Derive `alt_text` from the original prompt if not given.

### Set as featured image

Trigger: "set as featured for post 492", "use as hero for the [post] page". Two-step:

1. `wp_upload_media({ site, file_url, alt_text })` -> capture `attachment_id`.
2. `wp_set_featured_image({ site, post_id, attachment_id })`.

Always pass `site` to both calls. Same site on both.

## Example flows

- "Generate a hero banner for a solar company, sunrise over panels" -> `image_generate({ prompt, aspect_ratio: "16:9" })`.
- "Use pro for this, I need 4K print quality" -> confirm cost gate, then `image_generate({ ..., model: "pro" })`.
- "Remove the boxes from this photo" (with attachment) -> `image_edit({ image_url, instructions })`.
- "Find the solar one from last week" -> `image_library_list({ filters: { keyword: "solar", since: "..." } })`.
- "Save that to Pristine Powerwash drive" -> `image_save_to_drive({ r2_url, drive_folder: "Pristine Powerwash", name })`.
- "Upload to Regency and set as featured for post 492" -> `wp_upload_media({ site: "regencymoving.com", ... })` then `wp_set_featured_image({ site: "regencymoving.com", post_id: 492, attachment_id })`.
