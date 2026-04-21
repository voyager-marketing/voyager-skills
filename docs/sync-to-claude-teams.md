# Sync to Claude.ai Teams Org panel

**Why this exists.** Every `SKILL.md` in this repo is canonical, but the Claude.ai Teams Org panel has no public admin API that can provision skills into it. Until Anthropic ships one, uploading to the panel is a manual step. This runbook is how that step gets done cleanly so the panel stays in sync with `main`.

**Who runs this.** Ben. Alex consumes the result (skills appear in Claude.ai Chat) but does not upload.

**When to run.**
- **Same day** if the change affects a skill Alex uses in daily rotation (anything in the Org panel's Keep list).
- **Weekly** for everything else. Friday afternoon is the default slot. Scan `CHANGELOG.md` for the week and catch up on any skill edits that merged.
- **After any merge to main that edits `skills/<name>/SKILL.md`** (manual trigger, no GitHub Action yet).

---

## The flow

### 1. Pull main

```bash
cd ~/code/voyager-skills
git pull
```

### 2. Identify what needs uploading

Open `CHANGELOG.md`. Read the entries since last sync. Make a list of every skill name that got touched, added, or retired.

A skill needs re-upload if:
- Its `SKILL.md` was added, edited, or had frontmatter changed since last sync.
- Its `owner` or `last_reviewed` changed.
- It moved lifecycle state (Draft → Live, Live → Deprecated, etc.).

### 3. For each skill, build the upload archive

Claude.ai expects a `.zip`. The zip must contain a single folder named after the skill, with `SKILL.md` at its root. Any referenced files (scripts, templates) go inside that folder.

```bash
cd ~/code/voyager-skills/skills
zip -r ~/Desktop/voyager-voice.zip voyager-voice/
```

Repeat per skill. Keep the zips on the Desktop so they're easy to grab during the next step.

### 4. Upload to the Org panel

1. Open **claude.ai** in a browser, signed in as the Teams org admin (Ben).
2. Click the workspace switcher, make sure you're in the **Voyager Marketing** org context.
3. Navigate to **Customize → Skills**.
4. For each zip:
   - If the skill already exists in the panel: click its row, then **Replace**. Upload the new zip.
   - If the skill is new: click **+ Add skill**. Upload the zip.
   - After upload, toggle **Share with organization** on. Without this, only Ben sees it.
5. Spot-check one or two by opening a new Claude.ai chat and prompting the skill's trigger phrase. The skill should auto-fire.

### 5. Retirements

If the changelog says a skill was retired:
1. In **Customize → Skills**, find the row and click **Delete**.
2. Confirm the replacement is uploaded and passing before deleting the old one. The parallel-run pattern is non-negotiable.

### 6. Propagate to Alex

Nothing to do. Org-shared skills propagate automatically once **Share with organization** is on. Alex will see them on next Claude.ai page load.

If it's a breaking change (trigger phrases renamed, skill split, major voice change), DM Alex in Slack so he knows to expect different behavior.

### 7. Log the sync

Append a line to `CHANGELOG.md` under the matching date:

```
Synced to Claude.ai Org panel: voyager-voice, voyager-client-message, voyager-cold-email.
```

Commit the changelog update. Push.

### 8. Post to #dev-agents

One line in `#dev-agents` (Slack channel `C0AFC9W3UGH`):

```
Synced N skills to Claude.ai Org panel. Details in CHANGELOG.md.
```

---

## Personal panel (Ben-only skills)

A separate, smaller flow for Ben's personal skills (`mission`, `voyager-mission-write`, `voyager-feature-spec`, `voyager-new-software-project`, `skill-creator`). Same upload steps, but:

- Do **not** toggle Share with organization.
- Upload to **Customize → Skills** under Ben's personal profile, not the Voyager Marketing org context.
- Personal skills do not propagate to Alex. That's the point.

---

## Gotchas

- **Drift happens.** The Teams UI has no version diff. If you're not sure whether the uploaded copy matches the repo, re-upload. Cost of a wasted upload is low; cost of stale panel behavior is high.
- **Zip structure matters.** The zip's top-level entry must be the skill folder (e.g. `voyager-voice/`), not `SKILL.md` at root. Wrong structure causes a silent upload failure.
- **Frontmatter errors block upload.** Claude.ai validates YAML frontmatter on upload. If `owner`, `last_reviewed`, or the schema fields are malformed, the upload fails. Re-run the repo's frontmatter check first.
- **Alex sees stale skill for \~1 min after re-upload.** Hard refresh Claude.ai if a fresh test fires the old behavior. Usually resolves within a minute.

---

## Stretch goal: `/v1/skills` API

Anthropic shipped a beta endpoint at `POST /v1/skills` with header `anthropic-beta: skills-2025-10-02`. As of 2026-04-21 it's scoped to skills that fire inside the Messages API code execution environment, **not** the Teams Org panel. Verify this with a one-time test each quarter. If at any point the endpoint can provision to the Org panel, replace this manual runbook with a GitHub Action on merge to main. The Action writes the zip, posts to `/v1/skills`, and updates `CHANGELOG.md` with the upload result.

Until then, manual is the ceiling.

---

## Reference

- Parent governance doc: [Voyager Skills Hub](https://www.notion.so/34947c03778b81809600fa6da5bec8f2)
- Repo: [voyager-marketing/voyager-skills](https://github.com/voyager-marketing/voyager-skills)
- Rules this runbook depends on (in `CLAUDE.md`): Rule 1 (one repo, one truth), Rule 4 (eval is a hard gate).
