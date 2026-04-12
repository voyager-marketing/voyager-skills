---
name: ship-session
description: "End-of-session checklist: push all dirty repos, update Notion project pages, update Claude memory. Run when wrapping up a work session."
---

# Ship Session

Run this at the end of a work session to ensure nothing is left behind.

## Checklist

### 1. Push all dirty repos

Check each Voyager repo for unpushed commits:

```bash
# Check each repo
for repo in \
  "f:/dev/voyager/voyager-blocks" \
  "f:/dev/voyager/wordpress/voyager-orbit" \
  "f:/dev/voyager/wordpress/voyagermark" \
  "f:/dev/voyager/voyager-skills"; do
  echo "=== $(basename $repo) ==="
  cd "$repo" 2>/dev/null && git status -sb | head -1
  cd - > /dev/null
done
```

For each repo with unpushed commits:
- If on a feature branch: `git push origin <branch>`
- If on main/master and behind remote: `git pull --rebase origin <branch> && git push`
- If there are merge conflicts: report to user, don't force push

### 2. Update Notion

Search Notion for the relevant project page(s) and create a child page summarizing:
- What was built (endpoints, blocks, skills, patterns)
- What was fixed (security, performance, stability)
- Key commits and branches
- Anything that needs follow-up

Use `notion-search` to find the project, `notion-create-pages` to add the summary.

### 3. Update Claude Memory

Check `MEMORY.md` for staleness. Update or create memory files for:
- **Project memories** — new modules, endpoints, architecture decisions
- **Feedback memories** — any corrections the user made about approach
- **User memories** — new preferences or context learned

Only write memories that will be useful in future sessions. Skip ephemeral task details.

### 4. Report

Summarize to the user:
- Repos pushed (or already clean)
- Notion page(s) created/updated (with links)
- Memories updated (list which ones)
- Any items that couldn't be completed (conflicts, permissions, etc.)
