---
name: content-hero-image
description: "Use when a blog post, service page, landing page, or campaign needs a generated or reused hero/featured image. Triggers on: 'generate a hero image for', 'make a hero image', 'create a featured image for', 'I need a cover image', 'make an image for this post'."
argument-hint: "[description] [--aspect 16:9|1:1|9:16|4:3|3:4] [--model flash|pro|imagen-fast] [--post-id 123] [--site domain.com] [--save-drive]"
allowed-tools:
  - mcp__claude_ai_Voyager_MCP__content_generate_hero_image
user-invocable: true
owner: Ben
last_reviewed: 2026-05-15
distribution: internal
origin: voyager
mcp_requirement: required
logic_type: tool-wrapper
surface: all
---

# Content Hero Image

Generate or reuse a Voyager hero image through `content_generate_hero_image`. The MCP owns generation, R2 signing, optional Drive save, WordPress upload, and featured-image attachment; this skill owns prompt craft, cost judgment, and approval/safety gates.

## When To Use

- A blog post needs a featured image and no real photo fits.
- A service area, industry, or landing page needs a location-safe hero.
- A generated library image should be reused, uploaded, or set as featured.

Do not use this when the client needs real photography, identifiable people/places, exact logo rendering, or a low-value archive image where stock is enough.

## Prompt Rules

1. Lead with the subject.
2. Name the medium: cinematic photograph, editorial illustration, 3D render, etc.
3. Describe lighting and mood.
4. Describe composition, especially negative space for headline overlays.
5. Avoid text-in-image; WordPress should overlay real text.
6. Specify count/scale when people or objects matter.
7. End with finish: high detail, photorealistic, soft color grade, shallow depth of field.

Good prompt:

```text
A cinematic photograph of a single solar panel array at golden hour, low angle wide shot, warm side lighting from a setting sun, a maintenance technician in the middle distance inspecting a panel, mountains blurred in the background, negative space in the upper right for a headline overlay. High detail, photorealistic, shallow depth of field, warm color grade.
```

## Defaults

- `aspect_ratio`: `16:9` for hero/featured images; infer `1:1` for thumbnails/social, `9:16` for stories/reels.
- `model`: `flash` by default; `imagen-fast` for cheaper text-to-image drafts; `pro` only after confirming cost.
- `alt_text`: required before any WordPress upload or featured-image attach.
- `site`: required when `post_id` is present. Never infer a site from prior turns.

## MCP Call

```ts
content_generate_hero_image({
  prompt,
  aspect_ratio,
  model,
  post_id,
  site,
  save_to_drive,
  drive_client,
  drive_folder_id,
  title,
  alt_text,
  r2_key,
  signed_url
})
```

If there is no `post_id`, the MCP stops after R2 generation/reuse and returns a signed URL. If `save_to_drive` is true, it also archives the image. If `post_id` is present, `site` and `alt_text` are mandatory and the MCP uploads to WordPress and sets the featured image.

## Guardrails

- Confirm before using `pro`.
- Stop after 3 generation attempts and ask what needs to change.
- Do not attach to a published post unless the user explicitly asked to replace the live hero.
- Never call the tool with `post_id` unless the latest user message explicitly names the `site`.
- Never upload without meaningful `alt_text`.
- If reusing a library image, pass `r2_key` or `signed_url`; do not claim a match exists unless `image_library_list` returned it.

## Output

```md
## Hero Image - {topic}

Prompt: {prompt}
Model/aspect: {model}, {aspect_ratio}
R2: {signed_r2_url}
Drive: {drive_file.view_url or "not saved"}
WordPress: attachment {id}, featured on post {post_id}
Alt text: {alt_text}
```
