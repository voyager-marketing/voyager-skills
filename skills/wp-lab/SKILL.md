---
name: wp-lab
description: >
  Spin up ephemeral or continuous WordPress development environments instantly.
  Use this skill whenever the user wants to test a WordPress plugin, theme, or
  codebase without touching production. Triggers on: "spin up WordPress",
  "test this plugin", "wp-env", "wp-now", "ephemeral WordPress", "dev environment",
  "poke around this plugin's code", "WordPress playground", or any request to
  quickly run WordPress locally for development or exploration. Also triggers
  when the user wants to tear down or clean up WordPress dev environments.
owner: Ben
last_reviewed: 2026-05-07
distribution: internal
origin: voyager
mcp_requirement: none
logic_type: workflow
surface: claude-code
---

# wp-lab

WordPress environment automation for instant local development.

## Three usage shapes

### Throwaway (wp-now from a temp dir)
- Starts in ~5 seconds, no Docker required
- Uses `@wp-now/wp-now` (native PHP binaries, SQLite)
- Spawned from `/tmp/wp-lab/...` — DB dies with the dir
- **Use for:** quick code exploration, plugin testing, "what does this do?"

### Project (wp-now from a stable project dir) ← **non-Docker persistent**
- Same `wp-now` binary, but invoked from a real project directory (e.g. a theme repo)
- wp-now hashes the project path and persists DB + uploads at `~/.wp-now/wp-content/<hash>/`
- Re-run from the same dir → state survives. Ctrl+C is pause, not delete.
- **Use for:** ongoing client theme/plugin development without Docker. The default for
  Voyager child-theme work (VA Exteriors, Melody Magic, etc.).

### Continuous (wp-env, Docker)
- Docker-backed, persistent volumes, multi-plugin stacks
- Config lives in `.wp-env.json` in the project directory
- **Use for:** complex multi-plugin staging mirrors, Gutenberg core dev, anything
  needing a real MySQL + nginx that wp-now's SQLite/PHP-server can't fake.

## Prerequisites

Check before launching:
- **Ephemeral:** Node.js 18+ (no Docker needed)
- **Continuous:** Node.js 18+ AND Docker running

## Presets

Presets live in `presets/` as JSON files. Load with `--preset <name>`.

Each preset defines:
- `mode`: "ephemeral" or "continuous"
- `wp_version`: WordPress version (default: "latest")
- `php_version`: PHP version (default: **"8.3"** — wp-now caps at 8.3 as of
  2026-05-07 and aborts on 8.4 with "Unsupported PHP version". SpinupWP supports
  8.4 but accept the dev/prod skew. wp-env (continuous mode) does support 8.4.
  Bump back to 8.4 once wp-now ships support — track at
  https://github.com/WordPress/playground-tools)
- `plugins`: array of plugin sources (slug, URL, or local path)
- `themes`: array of theme sources
- `config`: wp-config.php constants to set
- `env_vars`: environment variables (for license keys, etc.)

### Available presets

| Preset | Mode | What's in it |
|--------|------|-------------|
| `clean` | ephemeral | Vanilla WordPress, zero plugins |
| `voyager-stack` | ephemeral (project) | **Standard Voyager build env.** voyager-block-theme parent + voyager-core + voyager-blocks + voyager-orbit plugins. Mounts cwd as active child theme. Use this for client builds. |
| `voyager-base` | continuous | ACF Pro, Rank Math, WP Rocket, Voyager starter theme (legacy 3rd-party stack) |
| `gutenberg-dev` | continuous | Gutenberg trunk, test utils, Voyager Blocks |

## Voyager standard stack (for client child-theme builds)

The `voyager-stack` preset is the canonical setup for any Voyager child-theme
project (VA Exteriors, Melody Magic, future client builds).

**What it provides:**
- Parent theme: `voyager-block-theme` (slug: `voyager`)
- Plugin suite: `voyager-core` + `voyager-blocks` + `voyager-orbit`
- The current working directory mounted as the active child theme
- PHP 8.4, WP latest, SQLite (no Docker)
- Persistent state via wp-now project mode

**One-time setup (per machine) — pick one or both:**

Option A — pull stable release artifacts (recommended for child-theme dev):
```bash
~/.claude/skills/wp-lab/scripts/voyager-dist-sync.sh sync
# Populates ~/.voyager-dist/<component>/<version>/ with `latest` symlink
```

Option B — clone working trees (only needed if you'll edit core/blocks/orbit source):
```bash
export VOYAGER_DEV_ROOT=/f/dev/voyager/wordpress
git clone https://github.com/voyager-marketing/voyager-block-theme "$VOYAGER_DEV_ROOT/voyager-block-theme"
git clone https://github.com/voyager-marketing/voyager-core         "$VOYAGER_DEV_ROOT/voyager-core"
git clone https://github.com/voyager-marketing/voyager-orbit        "$VOYAGER_DEV_ROOT/voyager-orbit"
git clone https://github.com/voyager-marketing/voyager-blocks       "$VOYAGER_DEV_ROOT/voyager-blocks"
```

**Per-client invocation:**
```bash
cd f:/dev/voyager-clients/<client-slug>   # e.g. va-exteriors
/wp-lab --preset voyager-stack            # uses ~/.voyager-dist if present, else working trees
/wp-lab --preset voyager-stack --use-dev  # force working trees (plugin-developer mode)
```

## Dist folder vs working trees

The voyager-stack runner resolves each component via this precedence:

1. `--use-dev` flag set → working tree at `$VOYAGER_DEV_ROOT/<component>` (skip dist)
2. Else `~/.voyager-dist/<component>/latest` exists → use that
3. Else fall back to `$VOYAGER_DEV_ROOT/<component>` working tree

**When to use which:**
- **Dist (default)** — child-theme dev. You want stable, released plugin code under your feet. Refresh via `voyager-dist-sync.sh sync` when a new release ships.
- **Working tree (`--use-dev`)** — plugin-developer mode. You're actively editing voyager-core / voyager-blocks / voyager-orbit source.
- **Mix** — dist runs by default, the dist sync script keeps `~/.voyager-dist/` fresh; switch to `--use-dev` only when you need to live-edit a plugin.

The dist sync script (`scripts/voyager-dist-sync.sh`) downloads pre-built release zips from GitHub Releases via `gh` CLI (private-repo aware) with curl fallback for public repos. Versions are detected from each zip's `Version:` header; layout is `~/.voyager-dist/<component>/<version>/` with `latest` repointed to the most recent sync.

Per-client version pinning via `voyager-stack.lock` files is **designed but not yet implemented** — see [Notion design doc](https://www.notion.so/35947c03778b81beaf2cc088ffabd1e3) for the spec.

**What the engine actually does:** when you invoke `--preset voyager-stack`,
`scripts/wp-lab.sh` builds a wrapper directory at
`~/.wp-now/voyager-stack/<child-slug>/` and symlinks the parent theme + plugin
suite into its `wp-content/`, then runs wp-now from there in wp-content mode.
The wrapper persists between sessions; wp-now stores the DB at the hashed path
it derives from the wrapper. Symlinks are POSIX `ln -s` where supported and
fall back to Windows directory junctions via `cmd /c mklink /J` (no admin or
Developer Mode needed for junctions).

**If cwd is not a theme directory** (no `style.css`), the runner clones
`voyager-marketing/voyager-blank-child` into `./voyager-child-scratch` and uses
that as the active child theme.

**Native wp-now blueprint:** [`blueprints/voyager-stack.blueprint.json`](./blueprints/voyager-stack.blueprint.json)
is a [Playground/wp-now blueprint](https://wordpress.github.io/wordpress-playground/blueprints/)
template that achieves the same setup without going through the wp-lab skill.
Copy it into a client repo as `blueprint.json` and `npx @wp-now/wp-now start`
will pick it up automatically. Useful for sharing portable preview environments
or for collaborators who don't have the wp-lab skill installed.

**Component reference:** see the
[Voyager WordPress Stack — Component Reference](https://www.notion.so/35947c03778b8180be19d6bbdb0e79d1)
page in Notion for the full component map (parent theme, plugin suite,
blank child) with repo URLs, roles, and the canonical onboarding workflow.

## Slash commands

| Command | What it does |
|---------|-------------|
| `/wp-lab <target>` | Smart router. Detects mode from context or preset. |
| `/wp-ephemeral <target>` | Force ephemeral mode with wp-now |
| `/wp-dev <target or --preset>` | Force continuous mode with wp-env |
| `/wp-clean` | Tear down all running wp-env environments |

### Target formats

- **Plugin slug:** `developer-tools` (downloads from wordpress.org)
- **GitHub URL:** `https://github.com/user/repo` (clones the repo)
- **Local path:** `./my-plugin` or `/absolute/path` (mounts directly)
- **Preset:** `--preset voyager-base` (loads preset config)

## Scripts

The automation engine lives in `scripts/wp-lab.sh`. The slash commands invoke
this script with appropriate flags. You can also run it directly:

```bash
./scripts/wp-lab.sh --mode ephemeral --target developer-tools
./scripts/wp-lab.sh --mode continuous --preset voyager-base
./scripts/wp-lab.sh --clean
```

## Workflow

1. User invokes a slash command or describes what they want
2. Determine mode (ephemeral vs continuous) from command, preset, or context
3. Resolve target (download plugin, clone repo, or validate local path)
4. Generate config (.wp-env.json for continuous, directory mount for ephemeral)
5. Launch environment
6. Report the local URL and admin credentials
7. On teardown, clean up temp directories and stop containers

## Default credentials

- **URL:** http://localhost:8888 (wp-env) or http://localhost:8881 (wp-now)
- **Admin:** admin / password
- **wp-now note:** wp-now auto-logs you in as admin, no credentials needed

## Theme dev workflow (block themes / FSE)

For child theme + pattern work (the VA Exteriors / Melody Magic shape):

1. `cd <theme-repo>` → `npx @wp-now/wp-now start --php=8.3` (project mode, persistent)
2. Edit visually in WP Site Editor
3. `npx wp-now wp create-block-theme save-changes` → writes Site Editor changes
   back to `theme.json` and `parts/*.html` in the repo (run from the same dir
   wp-now booted from)
4. Commit, push, let SpinupWP git-deploy pick it up on the dev server

**wp-now WP-CLI cwd gotcha:** `npx wp-now wp <command>` only works when run from
the same directory wp-now booted from. Running from a sibling dir produces
`Error: Cannot find module 'package.json'`. For the voyager-stack preset, that
means the wrapper dir at `~/.wp-now/voyager-stack/<slug>/`, not the client repo.

This is the round-trip Automattic uses for first-party themes. It avoids
hand-tuning `theme.json` and keeps the repo as source of truth.

## Migration to SpinupWP (production target)

The wp-lab skill spawns local environments only — it does not push to SpinupWP.
For local → SpinupWP sync:

- **Theme/plugin code:** Use SpinupWP's native git-deploy. Push to a `dev` branch,
  SpinupWP auto-pulls. No DB sync needed for code-only changes.
- **Database + media:** Use **WP Migrate** (Delicious Brains, same vendor as SpinupWP)
  with saved push/pull profiles. Required when seeding pages / migrating content.

## Troubleshooting

- **Port conflict:** If 8888 is taken, wp-env uses the next available port. Check output.
- **Docker not running:** wp-env fails silently sometimes. Run `docker info` to verify.
- **wp-now Windows quirks:** Stick to PHP 8.4 (default). If you hit a native binary
  crash, try `--php=8.3` as a fallback. Older guidance recommended `--php=8.1` —
  do **not** do that; PHP 8.1 has been EOL since Nov 2024.
- **Plugin not found:** The wordpress.org API slug must match exactly. Check
  https://wordpress.org/plugins/<slug>/
- **wp-now state seems lost:** Check `~/.wp-now/wp-content/` — the hash is derived
  from the absolute project path. If you moved the project, wp-now sees a new
  install. Move the data dir manually, or re-seed.
