---
name: wp-debug
description: "Use this skill when the user asks to debug, check errors, view debug log, check PHP errors, troubleshoot, or investigate WordPress issues on a Voyager project."
argument-hint: "[--tail] [--errors-only] [--block=slug]"
allowed-tools: [Bash, Read, Grep, Glob]
user-invocable: true
---

# WordPress Debug Helper

Quick debugging workflow for Voyager WordPress projects. Uses the WP root and debug log path from the project's CLAUDE.md.

## WP Root & Debug Log

Resolve from CLAUDE.md:
- `WP_ROOT` — e.g. `/sites/client.com/files/`
- Debug log: `$WP_ROOT/wp-content/debug.log`

## Debug Actions

### 1. Check Debug Log

**Recent entries (last 50 lines):**
```bash
tail -50 $WP_ROOT/wp-content/debug.log
```

**Voyager-specific errors only:**
```bash
grep -i 'voyager\|VoyagerBlocks' $WP_ROOT/wp-content/debug.log | tail -30
```

**Fatal errors and warnings:**
```bash
grep -E '(Fatal error|Warning|Notice|Deprecated)' $WP_ROOT/wp-content/debug.log | tail -30
```

**Errors from today only:**
```bash
grep "$(date +%d-%b-%Y)" $WP_ROOT/wp-content/debug.log | grep -E '(Fatal|Warning|Error)'
```

### 2. Check Plugin Status

```bash
wp --path=$WP_ROOT plugin status voyager-blocks
```

### 3. PHP Syntax Check on Recent Changes

```bash
cd $WP_ROOT/wp-content/plugins/voyager-blocks
git diff --name-only HEAD~5 -- '*.php' | while read f; do
  echo "=== $f ==="
  php -l "$f" 2>&1
done
```

### 4. Block-Specific Debug

If a specific block is mentioned:
- Check its `block.json` for valid JSON
- Verify build output exists in `build/blocks/{slug}/`
- Check frontend.js for common issues (missing GSAP refs, undefined vars)
- Check if block is disabled in settings

```bash
# Check if block is registered
wp --path=$WP_ROOT eval "echo in_array('voyager/{slug}', array_keys(WP_Block_Type_Registry::get_instance()->get_all_registered())) ? 'REGISTERED' : 'NOT REGISTERED';"
```

### 5. Asset Loading Debug

Check if GSAP and block scripts are enqueued:
```bash
wp --path=$WP_ROOT eval "
global \$wp_scripts;
do_action('wp_enqueue_scripts');
foreach (\$wp_scripts->registered as \$handle => \$script) {
    if (strpos(\$handle, 'voyager') !== false || strpos(\$handle, 'gsap') !== false) {
        echo \$handle . ' => ' . \$script->src . PHP_EOL;
    }
}
"
```

### 6. Database Check

Check plugin settings:
```bash
wp --path=$WP_ROOT option get voyager_blocks_settings --format=json
```

## Quick Triage Flow

1. Check debug log for recent errors
2. If error mentions a specific file → php -l that file
3. If error mentions a block → check build output + registration
4. If no errors in log → check plugin status + asset loading
5. If everything looks fine → clear debug log and reproduce the issue

## Clear Debug Log

Only when the user explicitly asks:
```bash
> $WP_ROOT/wp-content/debug.log
```
