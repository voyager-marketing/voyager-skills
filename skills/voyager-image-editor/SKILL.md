---
name: voyager-image-editor
description: "Generate, edit, or save images via the Voyager MCP server's Gemini-backed image_generate / image_edit tools and wp_upload_media. Use this skill when the user asks to generate, create, draw, design, make a picture of, or render an image; OR when they ask to edit, modify, retouch, remove, replace, change, swap, or adjust something in an existing image; OR when they ask to save the last generated image to the WordPress media library / set it as a featured image. Handles the full flow end-to-end: invokes the MCP tool, downloads the output, previews inline, and optionally persists to WP media."
argument-hint: "[prompt]"
user-invocable: true
owner: Ben
last_reviewed: 2026-04-29
---

# Voyager Image Editor

Route natural-language image requests through the deployed Voyager MCP server's `image_generate` and `image_edit` tools. Returns a signed R2 URL (served through the Worker) and a local copy in `/tmp` for inspection.

Worker endpoint: `https://voyager-mcp-server.ben-f3a.workers.dev/mcp`
Backed by Google Gemini Nano Banana (`gemini-2.5-flash-image` by default, `gemini-3-pro-image-preview` on request).

## Decision: generate, edit, or save?

Pick one based on the user's intent:

- **`image_generate`** — they want something new, from a description. Phrases: "generate", "create", "draw", "design", "render", "make an image of", "picture of", "illustration of".
- **`image_edit`** — they want to change something that already exists. Phrases: "edit", "modify", "remove", "replace", "change", "swap", "add [X] to [this]", "make [X] [different]", "retouch", "fix".
- **`save`** — they want to keep the *last-generated* image permanently. Phrases: "save that", "keep this one", "upload that to the media library", "use that as the featured image for [post]", "save as hero for [post]". See Flow C.

If the user attached an image in the conversation and is asking something, default to `image_edit` — the attachment is a strong signal.

If they haven't attached anything and don't mention an existing image, use `image_generate`.

When in doubt, ask: *"Generate a new image, edit an existing one, or save the last output?"*

## Auth

The Worker requires a bearer token (`MCP_AUTH_TOKEN`). In this order:

1. `$VOYAGER_MCP_TOKEN` if set in the environment
2. Contents of `~/.voyager-mcp-token` if the file exists
3. Ask the user for the token (and offer to save it to `~/.voyager-mcp-token` with 600 perms)

Never hardcode the token in any file that could be committed. Do not echo it in command output.

```bash
TOKEN="${VOYAGER_MCP_TOKEN:-$(cat ~/.voyager-mcp-token 2>/dev/null)}"
[ -z "$TOKEN" ] && { echo "Need MCP_AUTH_TOKEN — set VOYAGER_MCP_TOKEN or ~/.voyager-mcp-token"; exit 1; }
```

## Flow A — Generate a new image

Parameters the user can steer:

- `prompt` — required, natural language
- `aspect_ratio` — one of `1:1`, `16:9`, `9:16`, `4:3`, `3:4`. Default `1:1`. Offer a hint if the context suggests one (e.g. "hero banner" → `16:9`, "phone wallpaper" → `9:16`).
- `model` — `flash` ($0.039/image, default) or `pro` ($0.134/image). Use `pro` only if the user asks for higher fidelity or explicitly mentions it.

Call:

```bash
cat > /tmp/generate_req.json <<EOF
{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"image_generate","arguments":{
  "prompt": "PROMPT_HERE",
  "aspect_ratio": "1:1"
}}}
EOF

RESP=$(curl -s https://voyager-mcp-server.ben-f3a.workers.dev/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json, text/event-stream" \
  -d @/tmp/generate_req.json)

URL=$(echo "$RESP" | python3 -c "import json,sys; d=json.load(sys.stdin); p=json.loads(d['result']['content'][0]['text']); print(p['data']['url'] if 'data' in p else ''); print(p, file=sys.stderr)")
```

If `URL` is empty, parse the error envelope (`p['error']['code']` + `['message']`) and surface it to the user verbatim — common codes: `AUTH_FAILED` (bad token), `UPSTREAM_ERROR` (Gemini), `NOT_ALLOWED` (billing/rate).

## Flow B — Edit an existing image

Two sub-paths depending on where the source image lives.

### B.1 — User attached the image in this conversation

When a user drops an image into the chat, the harness writes it to a temp path and includes the path in context. Find that path, then:

```bash
SRC="/path/to/attached/image.png"  # from conversation context
MIME=$(file --mime-type -b "$SRC")  # e.g. image/png, image/jpeg, image/webp

# Size guard — the MCP tool caps at 10MB
SIZE=$(stat -c%s "$SRC")
if [ "$SIZE" -gt 10485760 ]; then
  echo "Source image is ${SIZE} bytes, exceeds 10MB cap. Ask the user to downscale first."
  exit 1
fi

B64=$(base64 -w0 "$SRC")

cat > /tmp/edit_req.json <<EOF
{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"image_edit","arguments":{
  "prompt": "PROMPT_HERE",
  "image_base64": "$B64",
  "mime_type": "$MIME"
}}}
EOF

RESP=$(curl -s https://voyager-mcp-server.ben-f3a.workers.dev/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json, text/event-stream" \
  -d @/tmp/edit_req.json)
```

### B.2 — User gave an external URL

```bash
SRC_URL="https://example.com/image.jpg"

RESP=$(curl -s https://voyager-mcp-server.ben-f3a.workers.dev/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json, text/event-stream" \
  -d "{\"jsonrpc\":\"2.0\",\"id\":2,\"method\":\"tools/call\",\"params\":{\"name\":\"image_edit\",\"arguments\":{\"prompt\":\"PROMPT_HERE\",\"image_url\":\"$SRC_URL\"}}}")
```

**Known limitation:** if `SRC_URL` points at our own `voyager-mcp-server.ben-f3a.workers.dev/images/...` host, the Worker can't subrequest itself and returns 404. In that case, download the bytes first and use **Flow B.1** with `image_base64`.

## After the call — download + preview

Regardless of generate or edit, once you have a signed URL:

```bash
OUT="/tmp/voyager-image-$(date +%s).png"
curl -s -o "$OUT" "$URL"
file "$OUT" | head -1   # verify PNG + dimensions

# Persist URL for a potential Flow C save step
echo "$URL" > /tmp/last_image_url.txt

# Surface the output to the user
echo "Saved to: $OUT"
echo "Signed URL (valid 1h by default): $URL"
```

Render the image inline if possible using the file path (Claude Code will display PNG attachments). Always show:

- The signed URL (they may want to share it)
- The local path (they may want to open/edit it)
- Model used + cost estimate (parse `p['data']['model']` and `p['data']['cost_estimate']`)

After showing the result, proactively offer: *"It's already in the 30-day R2 library — ask me to list it anytime. Want me to push it to a client's WordPress media library / set as featured image?"* Don't nag — one offer, then move on.

## Flow C — Save / Browse (library management)

**R2 *is* the library.** Every generated image is already stored in the `voyager-mcp-images` R2 bucket with a 30-day retention. You don't need to "save" anything to make it persistent — you just need to browse, keep a reference to, or push it to a client site.

### C.1 — Default: just keep the R2 URL

When the user says *"save it"* / *"keep this"* / doesn't specify anywhere, reassure them it's already saved in the library and hand back a fresh long-lived signed URL (up to 24h TTL):

```bash
# Re-sign the URL with a longer expiry for sharing
TOKEN="${VOYAGER_MCP_TOKEN:-$(cat ~/.voyager-mcp-token 2>/dev/null)}"
R2_KEY="images/2026-04-20/<uuid>.png"  # from the previous generate response

# For a fresh 24h URL, call image_library_list with a prefix filter:
curl -s https://voyager-mcp-server.ben-f3a.workers.dev/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json, text/event-stream" \
  -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/call\",\"params\":{\"name\":\"image_library_list\",\"arguments\":{\"prefix\":\"$R2_KEY\",\"expires_in_seconds\":86400}}}"
```

Tell the user: *"It's already in the library (30-day retention). Here's a 24-hour shareable URL: ..."*

### C.2 — Browse: list the library

When the user says *"show me the library"*, *"what did I generate yesterday?"*, *"find the solar one from last week"*:

```bash
curl -s https://voyager-mcp-server.ben-f3a.workers.dev/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"image_library_list","arguments":{"limit":50}}}'
```

Filter by date via prefix: `"prefix": "images/2026-04-20/"` for a single day. Returns `{ images: [{ key, name, size, uploaded, mime_type, url, expires_at }], cursor, truncated }`. Paginate with `cursor` if `truncated: true`.

Render the results as a compact table (name, date, size, link) — not a JSON dump. If the user wants to preview one, `curl` its `url` to `/tmp/` and `Read` the file to show inline.

### ⚠️ WordPress save — site selection is mandatory

The MCP server manages 15+ client sites. `wp_upload_media` without a `site` parameter silently defaults to the *first site alphabetically*, which is almost certainly the wrong one and violates the client-isolation rule (see memory `feedback_client_isolation.md`).

**Never default to WP.** WordPress save only happens when the user explicitly names a client in the prompt (e.g., *"save that to Regency"*, *"as the hero for the Pristine Powerwash landing page"*). If they just say *"save it"* → use Flow C.1 (R2 library, already persisted), don't ask.

If they say something client-ish that you can't resolve (*"save it to the client site"*), fetch the fleet list and ask:

```bash
curl -s https://voyager-mcp-server.ben-f3a.workers.dev/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":98,"method":"tools/call","params":{"name":"wp_fleet_status","arguments":{}}}' \
  | python3 -c "import json,sys; d=json.load(sys.stdin); p=json.loads(d['result']['content'][0]['text']); [print(' -', s.get('siteId') or s.get('url')) for s in p.get('data',p).get('sites',[])]"
```

Fuzzy-match shorthand (*"Regency"* → `regencymoving.com`, *"Pristine"* → `pristinepowerwash.com`).

### C.2 — WordPress media library (explicit client site)

```bash
URL=$(cat /tmp/last_image_url.txt)
SITE="regencymoving.com"  # ALWAYS explicit, never omitted

cat > /tmp/save_req.json <<EOF
{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"wp_upload_media","arguments":{
  "site": "$SITE",
  "url": "$URL",
  "title": "TITLE_HERE",
  "alt_text": "ALT_TEXT_HERE"
}}}
EOF

RESP=$(curl -s https://voyager-mcp-server.ben-f3a.workers.dev/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json, text/event-stream" \
  -d @/tmp/save_req.json)

python3 -c "
import json
d = json.load(open('/dev/stdin'))
p = json.loads(d['result']['content'][0]['text'])
if 'attachment_id' in p or ('data' in p and 'attachment_id' in p.get('data', {})):
    a = p.get('data', p)
    print('ATTACHMENT_ID:', a.get('attachment_id'))
    print('WP URL:', a.get('url') or a.get('source_url'))
else:
    print(json.dumps(p, indent=2))
" <<< "$RESP"
```

Always derive `title` and `alt_text` from the prompt that generated the image. If unspecified, a sensible default like `"Voyager generated: <first 50 chars of prompt>"` and `"<original prompt>"` works.

Parse the response for `attachment_id` — you'll need it if the user also wants to set it as a featured image (C.2).

### C.3 — Save AND set as featured image for a post

When the user says *"save that as the featured image for post 492"* or *"use that as the hero for the solar landing page"*:

1. First call `wp_upload_media` as in C.1. Capture the returned `attachment_id`.
2. Then call `wp_set_featured_image`:

```bash
cat > /tmp/feat_req.json <<EOF
{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"wp_set_featured_image","arguments":{
  "post_id": POST_ID_HERE,
  "attachment_id": ATTACHMENT_ID_FROM_C1,
  "alt_text": "ALT_TEXT_HERE"
}}}
EOF

curl -s https://voyager-mcp-server.ben-f3a.workers.dev/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json, text/event-stream" \
  -d @/tmp/feat_req.json
```

`wp_set_featured_image` also accepts `url` directly (skipping the upload step), but doing the explicit two-step lets us reuse the same attachment for multiple posts and gives the user the attachment ID to reference later.

### C.4 — Don't save?

If the user is iterating and hasn't said save, leave it alone. The local `/tmp/voyager-image-*.png` persists until system reboot, and the R2 object is good for 24h. Regenerating is cheap ($0.039 flash).

## Response shape (both tools)

```json
{
  "abilityVersion": "2.0.0",
  "data": {
    "url": "https://voyager-mcp-server.ben-f3a.workers.dev/images/images/YYYY-MM-DD/<uuid>.png?exp=...&sig=...",
    "model": "gemini-2.5-flash-image",
    "cost_estimate": { "usd": 0.039, "model": "gemini-2.5-flash-image" },
    "expires_at": "ISO-8601",
    "width": 1024,
    "height": 1024,
    "mime_type": "image/png"
  }
}
```

## Examples

- *"Generate a hero banner for a solar installation company — sunrise over solar panels, warm lighting"* → `image_generate` with `aspect_ratio: 16:9`
- *"Make me a 1:1 icon of a voyager spacecraft"* → `image_generate` with `aspect_ratio: 1:1`
- *"Use the pro model for this — I need a 4K print"* → set `model: pro`
- User pastes a photo + *"remove the cardboard boxes and put plastic storage bins"* → `image_edit`, Flow B.1
- *"Change the background of https://example.com/portrait.jpg to a forest"* → `image_edit`, Flow B.2
- *"Take the image you just generated and add a red ribbon"* → download the previous output first (to /tmp), then Flow B.1 (don't try to pass the Worker-hosted URL back in — self-subrequest returns 404)

## Notes for future sessions

- Objects auto-delete from R2 after 24h (`delete-images-after-24h` lifecycle rule on the `images/` prefix). If a user references an image from yesterday, its URL will be gone — regenerate.
- Signed URLs default to 1h TTL. Pass `expires_in_seconds` up to 86400 for longer-lived links.
- `image_edit` has built-in retry tolerance for trimming whitespace on the Gemini key (PR #7), but not for transient 5xx from Gemini. If a call fails with `UPSTREAM_ERROR`, retry once before surfacing to the user.
- Phase 2 ideas not yet built: prompt-hash caching (skip redundant Gemini calls for identical prompts), Trigger.dev batch mode (for generating featured images across a content batch), `image_vary` (N variants from one input).
