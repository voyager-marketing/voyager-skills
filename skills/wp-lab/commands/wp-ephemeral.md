# /wp-ephemeral

Quick ephemeral WordPress environment using wp-now. No Docker needed.

## Your task

Spin up a throwaway WordPress instance. $ARGUMENTS is a plugin slug, GitHub URL, or local path.

### Steps

1. Verify Node.js 18+ is installed
2. Resolve target from $ARGUMENTS:
   - Plugin slug: download from wordpress.org API
   - GitHub URL: shallow clone (`git clone --depth 1`)
   - Local path: validate and use directly
   - No arguments: start a clean WordPress instance in a temp directory
3. Create temp working directory: `mkdir -p /tmp/wp-lab/ephemeral-$(date +%s)`
4. If plugin/theme was downloaded, extract into the temp directory
5. Launch: `cd <dir> && npx @wp-now/wp-now start`
6. Tell the user:
   - The URL (usually http://localhost:8881)
   - wp-now auto-logs in as admin
   - WP-CLI: `npx wp-now wp plugin list`, `npx wp-now wp theme list`, etc.
   - Ctrl+C to kill it. The temp directory can be deleted or left to rot.

### If something goes wrong

- Port in use: `npx @wp-now/wp-now start --port=8882`
- PHP errors: try `--php=8.1` flag
- Plugin slug 404: verify at https://wordpress.org/plugins/
