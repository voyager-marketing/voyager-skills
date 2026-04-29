---
name: pr
description: "Use this skill when the user asks to create a pull request, open a PR, submit for review, or push changes for any Voyager project."
argument-hint: "[title override]"
allowed-tools: [Bash, Read, Grep]
user-invocable: true
owner: Ben
last_reviewed: 2026-04-29
---

# Create Pull Request

Create a PR for the current project, auto-detecting the Voyager repo and base branch from the working directory.

## Prerequisites

`gh` CLI must be installed and authenticated. Verify with `gh auth status` if creation fails on auth.

## Process

### 1. Detect Project

Match the current working directory against the table below. If no row matches (e.g. a per-client child theme repo), fall back to:

```bash
gh repo view --json defaultBranchRef --jq .defaultBranchRef.name
```

That resolves the base branch directly from the remote, so any new dev repo or client child theme works without an entry here.

| Path contains | Repo | Default base branch |
|---------------|------|-------------------|
| `voyager-orbit` | voyager-marketing/voyager-orbit | `master` |
| `voyager-blocks` | voyager-marketing/voyager-blocks | `main` |
| `voyager-core` | voyager-marketing/voyager-core | `main` |
| `voyager-block-theme` | voyager-marketing/voyager-block-theme | `main` |
| `voyagermark` | voyager-marketing/voyagermark | `main` |
| `voyager-skills` | voyager-marketing/voyager-skills | `main` |
| `voyager-mcp-server` | voyager-marketing/voyager-mcp-server | `main` |
| `voyager-portal` | voyager-marketing/voyager-portal | `main` |
| `voyager-blank-child` | voyager-marketing/voyager-blank-child | `main` |
| any other (client child theme, new repo) | resolve via `gh repo view` | resolve via `gh repo view` |

### 2. Gather Context

```bash
# Check current branch and status
git status
git branch --show-current

# See all commits on this branch vs base
git log {base}..HEAD --oneline

# See full diff
git diff {base}..HEAD --stat
```

### 3. Ensure Changes Are Pushed

```bash
# Push current branch with upstream tracking
git push -u origin $(git branch --show-current)
```

### 4. Generate PR

Analyze ALL commits (not just the latest) to write the PR:

- **Title:** Short (<70 chars), conventional format matching the primary change type
- **Body:** Summary bullets + test plan

```bash
gh pr create --title "{title}" --body "$(cat <<'EOF'
## Summary
- {bullet points summarizing all changes}

## Test plan
- [ ] {testing steps}

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

### 5. Return PR URL

Print the PR URL so the user can see it.

## Conventions

- PR title uses conventional commit format: `feat:`, `fix:`, `chore:`, etc.
- If multiple commit types, use the most significant one for the title
- Always include a test plan section
- Never force push unless explicitly asked
- If there's an existing PR for this branch, show its URL instead of creating a duplicate
