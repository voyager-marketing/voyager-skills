---
name: content-hero-image
description: "Use when a blog post, service area page, or landing page needs a hero image generated from a text prompt. Wraps Voyager MCP image tools (Gemini Nano Banana + R2 + optional Drive + WordPress upload) into one handoff. Triggers on: 'generate a hero image for', 'make a hero image', 'create a featured image for', 'I need a cover image', 'make an image for this post'."
argument-hint: "[description of the image] [--aspect 16:9|1:1|9:16|4:3|3:4] [--model flash|pro] [--post-id 123] [--save-drive] [--site domain.com]"
allowed-tools: [Bash, Read, Grep, Glob, Agent, TodoWrite]
user-invocable: true
owner: Ben
last_reviewed: 2026-04-21
---

# Content Hero Image

Generate a hero image for Voyager content via the Voyager MCP server, save it to R2, and hand it off to WordPress (featured image) or Google Drive (library). Orchestrator over four MCP tools.

## When to use

- A blog post needs a featured image and no stock photo fits
- A service area page or industry page needs a location-agnostic hero
- A landing page needs a custom illustration or photograph

## When NOT to use

- The client needs **real photography** of their business, products, or team. Use real photos.
- The image must include **identifiable people or places**. Gemini synthesizes, it doesn't represent reality.
- The image must include a **client logo** pixel-accurate. Composite in the logo after generation, don't try to prompt for it.
- The post is low-traffic or archive-only. Image cost is real ($0.04-$0.24 per generation). Stock is fine.

## The tool chain

Four Voyager MCP tools in a line:

```
image_generate  →  (optional) image_save_to_drive  →  wp_upload_media  →  wp_set_featured_image
```

1. **`image_generate`** — text prompt → Gemini Nano Banana → R2 bucket → signed URL
2. **`image_save_to_drive`** — optional archive to the Voyager AI Image Library Google Drive folder
3. **`wp_upload_media`** — download the signed URL, sideload into the WP media library
4. **`wp_set_featured_image`** — attach the new attachment to the target post

Chain behavior:
- If `--post-id` is provided, run all four steps.
- If only the prompt is given, stop after `image_generate` and return the signed URL for review.
- `--save-drive` slots `image_save_to_drive` in after step 1.

## Model choice (flash vs pro)

| Factor | `flash` (default) | `pro` |
|--------|-------------------|-------|
| Cost | ~$0.039 / image | ~$0.134-$0.24 / image |
| Speed | Faster | Slower |
| Fidelity | Good | Higher |
| Use for | Blog heroes, internal testing, iteration | Landing page heroes, client-facing hero where quality matters |

Default to `flash`. Upgrade to `pro` only when:
- The image is the dominant visual on a conversion page
- Early `flash` attempts aren't hitting the prompt intent
- The client explicitly asked for top quality

## Aspect ratios

| Ratio | Use for |
|-------|---------|
| `16:9` | Blog featured images, standard hero |
| `1:1` | Social repurpose, thumbnail |
| `9:16` | Story / reel / mobile full-bleed |
| `4:3` | Card grids, secondary hero |
| `3:4` | Portrait spot in a layout |

Default to `16:9` for blog posts and landing pages.

## Prompt-writing guidelines

Hero images live or die by the prompt. Rules:

1. **Lead with the subject.** "A rocket launch at dusk" not "An image that shows...".
2. **Name the medium.** Photograph, oil painting, 3D render, editorial illustration — pick one and say so. "Cinematic photograph" is a good default for SEO/service-area heroes.
3. **Describe lighting.** "Golden hour side lighting", "soft overcast daylight", "backlit rim light" — lighting drives mood more than subject.
4. **Describe composition.** "Wide shot, subject on left third, negative space on right for overlay text" — this is how you get rooms for a headline.
5. **Avoid text-in-image.** Gemini's text rendering is unreliable. Prompt for negative space instead and overlay real text in WordPress.
6. **No ambiguous scale or people counts.** Specify "a single engineer in a blue hardhat" not "engineers".
7. **Add a finish.** "High detail, photorealistic, soft color grade" — closes the loop.

**Good prompt example:**
```
A cinematic photograph of a single solar panel array at golden hour, low angle
wide shot, warm side lighting from a setting sun, a maintenance technician
in the middle distance inspecting a panel, mountains blurred in the background,
negative space in the upper right for a headline overlay. High detail,
photorealistic, shallow depth of field, warm color grade.
```

**Bad prompt example:**
```
A cool image for a blog about solar panels with the text "Solar in Colorado"
on it.
```

## Procedure

### Step 1 — Generate

Call `image_generate`:

- `prompt`: the full prompt per the guidelines above
- `aspect_ratio`: `16:9` unless specified
- `model`: `flash` unless `--model pro` or the quality justifies it
- `expires_in_seconds`: leave default (3600) unless downstream steps will take longer

Output: signed R2 URL + width/height/cost_estimate. Present the URL to the user for review.

### Step 2 — Save to Drive (optional)

If `--save-drive` was passed, or the user explicitly asks for Drive backup, call `image_save_to_drive`:

- `signed_url`: pass the full URL returned by `image_generate`
- `title`: build a descriptive filename — `{client}-{topic}-hero-{aspect}.jpg` (e.g. `acme-solar-panels-hero-16x9.jpg`)
- `folder_id`: leave default (Voyager AI Image Library root)

Output: Drive file ID and URL. Record both for future reference.

### Step 3 — Upload to WordPress

If `--post-id` was provided:

1. Resolve the site — use `--site` flag value, or the `WP_ROOT` / site in the current CLAUDE.md context.
2. Call `wp_upload_media`:
   - `site`: resolved site
   - `url`: the signed R2 URL from step 1
   - `alt_text`: a short descriptive alt text derived from the prompt ("Solar panel array at golden hour with maintenance technician")
   - `caption`: optional, leave empty unless the user provides one

Output: WordPress attachment ID and local media URL.

### Step 4 — Set as featured image

Call `wp_set_featured_image`:
- `site`: same site as step 3
- `post_id`: the `--post-id` value
- `attachment_id`: returned from step 3

Output: confirmation that the featured image is set. Return the post's permalink so the user can inspect.

## Output format

```
## Hero Image — [Topic]

**Prompt:** [full prompt used]
**Model:** flash | pro — $[cost] — [aspect ratio]
**Generated URL (R2, expires [time]):** [signed URL]

[if saved to Drive]
**Drive:** [filename] — [drive URL]

[if uploaded to WordPress]
**WordPress attachment ID:** [id]
**Set as featured on post:** [post_id] — [permalink]

**Alt text:** [alt text used]
```

## Guardrails

- **Confirm the prompt before spending a `pro` call.** Flash is cheap enough to iterate; pro isn't.
- **Cap auto-iteration.** If the user isn't happy after 3 generations, stop and ask what's wrong. Don't burn budget on blind retries.
- **Don't auto-commit to `wp_set_featured_image` on a published post** without confirmation. Replacing a live hero is visible. Confirm or work on a draft.
- **Don't fabricate the image library.** If `image_library_list` returns no matches for what the user wants, say so and offer to generate new — don't claim an image exists that doesn't.
- **Alt text is required.** Never call `wp_upload_media` without an alt text argument. A hero with empty alt is an accessibility regression.
- **Respect R2 TTL.** Signed URLs expire (default 1 hour). If the WordPress upload step needs to happen later, re-call `image_generate` or use a longer TTL via `expires_in_seconds`.

## Related skills

- `publish` — the publishing pipeline. If the content-hero-image run happens *during* a publish cycle, the publish skill already handles `wp_set_featured_image` at the end, so pass the R2 URL in via the `featured_image_url` field on `wp_upsert_content` instead of running step 4 separately.
- `pseo` and `pseo-manage` — for service area pages. The `pseo_create_service_area` tool accepts a `featured_image_url`, so generate first and pipe the signed URL in rather than running the full chain.
- `social-repurpose` — if the blog gets a new hero, trigger social repurpose after the upload so the generated image propagates to social posts that reference it.
