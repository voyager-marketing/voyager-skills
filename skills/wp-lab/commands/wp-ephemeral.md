# /wp-ephemeral

Quick WordPress environment using wp-now. No Docker needed.

Two shapes:
- **Throwaway** — spawned from a temp dir, DB dies on cleanup.
- **Project** — spawned from a stable project dir, DB persists at `~/.wp-now/wp-content/<hash>/`. Re-running from the same dir resumes state.

## Your task

Spin up a wp-now WordPress instance. $ARGUMENTS is a plugin slug, GitHub URL, or local path.

### Steps

1. Verify Node.js 18+ is installed
2. Resolve target from $ARGUMENTS:
   - **Local path** (existing repo / theme dir): use directly → **project mode** (persistent)
   - **Plugin slug:** download from wordpress.org API into a temp dir → throwaway
   - **GitHub URL:** shallow clone (`git clone --depth 1`) into a temp dir → throwaway
   - **No arguments:** start a clean WordPress instance in a temp directory → throwaway
3. For throwaway targets, create the temp directory: `mkdir -p /tmp/wp-lab/ephemeral-$(date +%s)`
4. If plugin/theme was downloaded, extract into the working directory
5. Launch: `cd <dir> && npx @wp-now/wp-now start --php=8.4`
6. Tell the user:
   - The URL (usually http://localhost:8881)
   - wp-now auto-logs in as admin
   - Whether they're in project mode (state persists) or throwaway (state dies)
   - WP-CLI: `npx wp-now wp plugin list`, `npx wp-now wp theme list`, etc.
   - Ctrl+C to stop. In project mode it's pause; in throwaway the temp dir can be deleted.

### If something goes wrong

- Port in use: `npx @wp-now/wp-now start --port=8882`
- PHP errors / native binary crash on Windows: try `--php=8.3` (do **not** drop to 8.1 — EOL since Nov 2024)
- Plugin slug 404: verify at https://wordpress.org/plugins/
