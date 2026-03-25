# /wp-clean

Tear down WordPress development environments.

## Your task

Clean up running wp-env and wp-now instances and their temp files.

### Steps

1. Stop and destroy wp-env if running:
   ```bash
   npx @wordpress/env stop 2>/dev/null
   npx @wordpress/env destroy --force 2>/dev/null
   ```
2. Kill any running wp-now processes:
   ```bash
   pkill -f "wp-now" 2>/dev/null || true
   ```
3. Clean temp directories:
   ```bash
   rm -rf /tmp/wp-lab/ephemeral-*
   ```
4. Report what was cleaned up
5. Do NOT delete:
   - Any `.wp-env.json` files (those are project config)
   - Anything outside `/tmp/wp-lab/`
   - Any named/persistent wp-env projects the user might want to keep

### If $ARGUMENTS contains a specific target

Only clean that specific environment, not everything. For example:
- `/wp-clean ephemeral` -- only clean ephemeral temp dirs and wp-now processes
- `/wp-clean continuous` -- only stop/destroy wp-env
