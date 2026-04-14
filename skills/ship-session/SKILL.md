---
name: ship-session
description: "Use at the end of a work session to commit changes, sync skill mirrors, verify the build, update Notion tasks, and leave a clean handoff. Triggers on: 'wrap up', 'end session', 'ship this', 'commit and close', 'ready to hand off'."
user-invocable: true
---

# Ship Session — End-of-Session Checklist

Wrap up a work session cleanly. Run this before closing Claude Code.

## Step 1: Verify Build

```bash
yarn typecheck
yarn lint
```

Fix any errors before proceeding. Don't commit a broken build.

## Step 2: Sync Agent Assets

```bash
yarn agent:sync
```

Ensures all `.agents/skills/` changes are mirrored to `.claude/skills/`. If it reports drift, the write flag fixes it:
```bash
yarn agent:sync --write --yes
```

## Step 3: Review Changes

```bash
git status
git diff --stat
```

Confirm what's changed. Group related changes mentally before staging.

## Step 4: Stage and Commit

Stage only relevant files — avoid accidentally committing `.env`, large binaries, or unrelated work-in-progress.

```bash
git add <specific files>
git commit -m "<type>(<scope>): <subject>"
```

Commit message format: `feat(skills): add content-tracker skill` not "updated stuff".
Types: feat, fix, docs, refactor, chore. Scopes: skills, agents, ui, api, db, trigger.

## Step 5: Push

```bash
git push origin <branch>
```

If pushing new skills to voyager-skills org repo, use the gh API push pattern from AGENTS.md.

## Step 6: Handoff Note

Briefly summarize in the conversation:
- What was built/changed
- What's pending (if anything)
- Any env vars or manual steps needed (Supabase migrations, Trigger.dev activation, etc.)

## What NOT to commit

- `.env`, `.env.local`, credential files
- `node_modules/`, `.next/`, build artifacts
- Temp files (`.publish-tmp.md`, `*.stackdump`, etc.)
- Unrelated work-in-progress from other features
