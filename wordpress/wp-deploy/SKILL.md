---
name: wp-deploy
description: "Use this skill when the user asks to deploy, push to production, ship, release, or check deployment status for a Voyager WordPress plugin."
argument-hint: "[--status] [--dry-run]"
allowed-tools: [Bash, Read, Grep, Glob]
user-invocable: true
---

# Deploy Voyager WordPress Plugin

Manage the deployment pipeline for a Voyager plugin. Deployment is automated via GitHub Actions — pushing to `main` triggers a build + rsync to the SpinupWP testing server.

## Plugin Root

The plugin directory is defined in the project's CLAUDE.md. Use `PLUGIN_ROOT` from that file (e.g. `/sites/client.com/files/wp-content/plugins/voyager-blocks/`).

## Deployment Pipeline

### 1. Pre-Deploy Checks

Before deploying, run these checks:

**Build:**
```bash
cd $PLUGIN_ROOT
npm run build
```
Verify no build errors. Check that `build/` directory contains expected output.

**PHP Preflight:**
```bash
cd $PLUGIN_ROOT
find . -name '*.php' -not -path '*/node_modules/*' -not -path '*/build/*' -exec php -l {} \; 2>&1 | grep -v "No syntax errors"
```

**Git Status:**
```bash
cd $PLUGIN_ROOT
git status
git diff --stat
```
Show uncommitted changes. Confirm with user before proceeding.

### 2. Commit and Push

Only after user confirmation:
```bash
cd $PLUGIN_ROOT
git add -A
git commit -m "feat: {description}"
git push origin main
```

### 3. Monitor Deployment

The GitHub Actions workflow `deploy-testing.yml` triggers on push to main.

**Check status:**
```bash
cd $PLUGIN_ROOT
gh run list --workflow=deploy-testing.yml --limit=3
```

**Watch specific run:**
```bash
cd $PLUGIN_ROOT
gh run view --log
```

**Check for failures:**
```bash
cd $PLUGIN_ROOT
gh run list --workflow=deploy-testing.yml --status=failure --limit=3
```

### 4. Verify Deployment

After deployment:
- Check the site loads without errors
- Verify new blocks/patterns appear in the editor
- Confirm plugin version updated in wp-admin

### Status-Only Mode

If the user just wants to check deployment status (using `--status`):
```bash
cd $PLUGIN_ROOT
gh run list --workflow=deploy-testing.yml --limit=5
```

### Dry Run Mode

If the user wants a dry run (using `--dry-run`):
- Run build + preflight checks
- Show what would be committed
- Do NOT actually commit or push

## Deployment Architecture

- **Trigger:** Push to `main` branch
- **CI:** GitHub Actions (`deploy-testing.yml`)
- **Steps:** checkout → Node 22 setup → npm ci → npm run build → rsync via SSH
- **Hosting:** SpinupWP
