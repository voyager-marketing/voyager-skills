# wp-lab Examples

Example presets for the wp-lab skill. Copy these to `skills/wp-lab/presets/` and customize.

## Presets

- `clean.json` - Vanilla WordPress, no plugins
- `starter-agency.json` - Basic agency stack with ACF, Yoast, and utility plugins

## Creating your own preset

Copy any preset and modify:

```json
{
  "name": "my-preset",
  "description": "What this preset is for",
  "mode": "ephemeral or continuous",
  "wp_version": "latest",
  "php_version": "8.2",
  "plugins": [
    { "source": "plugin-slug", "type": "slug" },
    { "source": "https://github.com/user/plugin", "type": "github" },
    { "source": "./local-plugin", "type": "local", "path": "/absolute/path" }
  ],
  "themes": [],
  "config": {},
  "env_vars": {}
}
```

### Plugin source types

| Type | Source value | Notes |
|------|-------------|-------|
| `slug` | wordpress.org slug | Auto-downloaded |
| `github` | Full GitHub URL | Shallow cloned |
| `local` | Directory path | Mounted directly |
| `url` | Download URL | For premium plugins with license key URLs |
