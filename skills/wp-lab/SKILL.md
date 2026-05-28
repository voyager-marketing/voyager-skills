---
name: wp-lab
description: >
  Spin up WordPress development environments for ephemeral tests, continuous
  Docker stacks, or persistent client builds. Use this skill whenever the user
  wants to test a WordPress plugin, test a theme, start a new client build, do
  client child theme dev, set up local dev for a client, use Laragon, run
  wp-env, run wp-now, open an ephemeral WordPress playground, poke around a
  plugin's code, or tear down local WordPress dev environments.
owner: Ben
last_reviewed: 2026-05-28
distribution: internal
origin: voyager
mcp_requirement: none
logic_type: workflow
surface: claude-code
---

# wp-lab

WordPress environment automation for local development.

## Mode routing

Choose the mode before launching anything:

| Mode | Engine | Use for | Do not use for |
|---|---|---|---|
| `ephemeral` | wp-now from a temp or wrapper dir | Fast plugin/theme exploration, throwaway repros, short-lived WordPress playgrounds | Client builds that need MySQL or staging parity |
| `continuous` | wp-env Docker | Multi-plugin stacks, Gutenberg core dev, Docker-backed persistence | Windows client child-theme work when Laragon is available |
| `persistent-client` | Laragon, Apache, MySQL | Net-new client child theme builds, staging parity, local dev for a named client | Throwaway plugin checks |

If the user says "new client build", "client child theme dev", "set up local dev for X", "Laragon", or needs real MySQL, route to `persistent-client`. If they only need to see what a plugin or theme does, route to `ephemeral`. If they specifically need Docker, Gutenberg core, or a complex multi-plugin fixture, route to `continuous`.

## Modes

### `ephemeral` (wp-now)
- Starts in ~5 seconds, no Docker required
- Uses `@wp-now/wp-now` (native PHP binaries, SQLite)
- Spawned from `/tmp/wp-lab/...` — DB dies with the dir
- Can also run from a stable project wrapper when a longer-lived wp-now preview is enough
- **Use for:** quick code exploration, plugin testing, "what does this do?"

### `continuous` (wp-env, Docker)
- Docker-backed, persistent volumes, multi-plugin stacks
- Config lives in `.wp-env.json` in the project directory
- **Use for:** complex multi-plugin staging mirrors, Gutenberg core dev, anything
  needing a real MySQL + nginx that wp-now's SQLite/PHP-server can't fake.

### `persistent-client` (Laragon)
- Windows Laragon setup with Apache + MySQL, matching the SpinupWP staging layout
- Uses the client child theme from `F:\dev\voyager-clients\<client-slug>`
- Symlinks the child theme into `F:\laragon\www\<client-slug>\wp-content\themes\<client-slug>`
- Installs the Voyager parent theme, `voyager-core`, `voyager-blocks`, `voyager-orbit`, and required plugins from the WP Plugins DB
- **Use for:** net-new Voyager client builds, real client child theme dev, local reproduction of staging-only MySQL issues.

## Prerequisites

Check before launching:
- **Ephemeral:** Node.js 18+ (no Docker needed)
- **Continuous:** Node.js 18+ AND Docker running
- **Persistent client:** Windows 10/11, Laragon Full, Apache + MySQL running, GitHub CLI authenticated to `voyager-marketing`, and the one-time Voyager stack clones under `F:\dev\voyager\wordpress\`

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
| `voyager-stack` | ephemeral (project) | Fast wp-now Voyager preview. voyager-block-theme parent + voyager-core + voyager-blocks + voyager-orbit plugins. Mounts cwd as active child theme. Use Laragon `persistent-client` mode for net-new client builds that need MySQL and staging parity. |
| `voyager-base` | continuous | ACF Pro, Rank Math, WP Rocket, Voyager starter theme (legacy 3rd-party stack) |
| `gutenberg-dev` | continuous | Gutenberg trunk, test utils, Voyager Blocks |

## Persistent client build workflow (Laragon)

Use this for canonical Voyager client child-theme work. Link to the SOP instead of copying every troubleshooting branch into the skill: [[How-To] Infra: Local Development Environment (Laragon)](https://www.notion.so/36e47c03778b81628c26d0b1cc7a3ead).

**One-time machine setup:**

```powershell
$VOYAGER_DEV_ROOT = "F:\dev\voyager\wordpress"
git clone https://github.com/voyager-marketing/voyager-block-theme "$VOYAGER_DEV_ROOT\voyager-block-theme"
git clone https://github.com/voyager-marketing/voyager-core         "$VOYAGER_DEV_ROOT\voyager-core"
git clone https://github.com/voyager-marketing/voyager-orbit        "$VOYAGER_DEV_ROOT\voyager-orbit"
git clone https://github.com/voyager-marketing/voyager-blocks       "F:\dev\voyager\voyager-blocks"
```

**Per-client bootstrap:**

```powershell
git clone https://github.com/voyager-marketing/voyager-blank-child F:\dev\voyager-clients\<client-slug>
cd F:\dev\voyager-clients\<client-slug>
# Edit style.css header, Text Domain, theme.json, and patterns for the client.
git remote set-url origin git@github.com:voyager-marketing/<client-slug>-theme.git
powershell -ExecutionPolicy Bypass -File F:\dev\voyager-clients\<client-slug>\scripts\bootstrap-laragon.ps1
```

**Verify:**
- Visit `http://<client-slug>.test/`
- Visit `http://<client-slug>.test/wp-admin` as `admin` / `admin`
- Run `wp theme list --path=F:\laragon\www\<client-slug>` and confirm the active child theme has `voyager-block-theme` as parent
- Run `wp plugin list --path=F:\laragon\www\<client-slug>` and confirm the required WP Plugins DB rows for this install profile are active

## Voyager wp-now stack

The `voyager-stack` preset is the fast wp-now setup for Voyager stack previews.
It is useful when the user needs a short-lived child-theme preview or plugin test,
but Laragon is the canonical route for persistent client builds.

**What it provides:**
- Parent theme: `voyager-block-theme` (slug: `voyager`)
- Plugin suite: `voyager-core` + `voyager-blocks` + `voyager-orbit`
- The current working directory mounted as the active child theme
- PHP 8.3, WP latest, SQLite (no Docker)
- Persistent state via wp-now project mode

**One-time setup (per machine) - pick one or both:**

Option A - pull stable release artifacts (recommended for child-theme previews):
```bash
~/.claude/skills/wp-lab/scripts/voyager-dist-sync.sh sync
# Populates ~/.voyager-dist/<component>/<version>/ with `latest` symlink
```

Option B - clone working trees (only needed if you'll edit core/blocks/orbit source):
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
2. Determine mode (`ephemeral`, `continuous`, or `persistent-client`) from command, preset, or context
3. Resolve target (download plugin, clone repo, validate local path, or route to the Laragon bootstrap)
4. Generate config (.wp-env.json for continuous, directory mount for ephemeral, Laragon site folder for persistent-client)
5. Launch environment
6. Report the local URL and admin credentials
7. On teardown, clean up temp directories and stop containers

## Default credentials

- **URL:** http://localhost:8888 (wp-env) or http://localhost:8881 (wp-now)
- **Admin:** admin / password
- **wp-now note:** wp-now auto-logs you in as admin, no credentials needed

## Theme dev workflow (block themes / FSE)

For canonical client child theme + pattern work, use the Laragon `persistent-client` workflow above. If the user chooses wp-now for a fast preview:

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
- **wp-now Windows quirks:** Stick to PHP 8.3 (default). If you hit a native binary
  crash, try `--php=8.3` as a fallback. Older guidance recommended `--php=8.1` —
  do **not** do that; PHP 8.1 has been EOL since Nov 2024.
- **Plugin not found:** The wordpress.org API slug must match exactly. Check
  https://wordpress.org/plugins/<slug>/
- **wp-now state seems lost:** Check `~/.wp-now/wp-content/` — the hash is derived
  from the absolute project path. If you moved the project, wp-now sees a new
  install. Move the data dir manually, or re-seed.

## Related

- [[How-To] Infra: Local Development Environment (Laragon)](https://www.notion.so/36e47c03778b81628c26d0b1cc7a3ead)
- [[How-To] Infra: SpinupWP New Site Provisioning](https://www.notion.so/36e47c03778b819f9a0de7e148e4cd38)
- [Voyager WordPress Stack - Component Reference](https://www.notion.so/35947c03778b8180be19d6bbdb0e79d1)
- [WP Plugins DB](https://www.notion.so/2d247c03778b80ddb8addfdf85368c73)
