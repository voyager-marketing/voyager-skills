# /ship-session

End-of-session wrap-up: push repos, update Notion, update memory.

## Your task

Run through this checklist. Do each step, report results, and move on.

### Step 1: Push all dirty repos

Check these repos for unpushed commits or uncommitted changes:

```
f:/dev/voyager/voyager-blocks
f:/dev/voyager/wordpress/voyager-orbit
f:/dev/voyager/wordpress/voyagermark
f:/dev/voyager/voyager-skills
```

For each:
- Run `git status -sb` to check state
- If ahead of remote: `git push origin <branch>`
- If behind: `git pull --rebase origin <branch>` then push
- If dirty (uncommitted changes): ask the user what to do
- If clean: skip

### Step 2: Update Notion

Search Notion for the relevant project page(s) that were worked on this session. Create a child page summarizing:
- What was built, fixed, or changed
- Key commits and branches
- Anything that needs follow-up

Skip this step if the session was trivial (< 3 commits, single small fix).

### Step 3: Update memory

Check the MEMORY.md index. Update or create memory entries for:
- New architecture decisions or modules
- User feedback/corrections about approach
- Project context that future sessions need

Skip this step if nothing memory-worthy happened.

### Step 4: Report

Tell the user:
- Which repos were pushed (or already clean)
- Notion page link (if created)
- Which memories were updated (if any)
- Any items that need manual attention
