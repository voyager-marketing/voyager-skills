---
description: Provision a Voyager-standard dev site for a Path A client
argument-hint: "<business-name> [--clients-db-url=<id>] [--slug=<kebab>] [--server-notion-id=<id>]"
---

# /voyager-build-kickoff

Provision the dev environment for a new Path A client on the shared Voyager Dev SpinupWP server. Arguments. $ARGUMENTS

Follow the SKILL.md pipeline:

- **Phase 0**. Load Notion MCP, `gh auth`, SSH keys. Verify `SPINUPWP_API_KEY` + `CLOUDFLARE_API_TOKEN` (must have `Zone.DNS:Edit` scope). Fetch Clients, Websites, Servers DB schemas. Resolve Voyager Dev server (Notion + SpinupWP API, hardcoded id `16035`). Read sudo password from Servers DB row.
- **Phase 1**. Resolve Clients row. Gate on `Status = Active`, build signal (`WP Publish Enabled = YES` OR `Services` contains Website/MWP), empty `Websites` relation, unchecked `Voyager Orbit Installed`. Validate slug unused. Ask user to proceed.
- **Phase 2**. Create Websites row from template (`Stage = Dev`, `Status = In Progress`). Create Cloudflare A record. **Wait for DNS propagation via `nslookup 1.1.1.1`** (NOT `dig` — not on Windows). POST to SpinupWP `/v1/sites` with full schema (`installation_method: "wp"`, `wordpress.{title, admin_user, admin_email, admin_password}`, `database.{name, username, password}`, `https.enabled: true`). Poll event until status = **`deployed`** (NOT `completed`). Verify `https.enabled: true` on site response; if false, pause for manual UI enable.
- **Phase 3**. Download plugin + theme assets (parallel `gh release download` for release zips, `gh api .../tarball/<tag>` for source tarballs). `scp` to server `/tmp/`. Install via SSH + `echo $SUDO_PW | sudo -S -u [site_user] wp ...` — sudo is NOT NOPASSWD. Plugin order: core → abilities-api → mcp-adapter → wordpress-mcp → blocks (source tarball, not release zip — release is broken) → rank-math (WP.org) → **Orbit LAST** (activation triggers Portal registration). Install theme via extracted source dir move (no `zip` on server).
- **Phase 4**. Poll `voyager_registration_status` until `active`. If `failed` + "HTTPS required", verify HTTPS live then reset retries + retry via `RegistrationService::attemptRegistration()`. Read `voyager_site_secret`, write to Websites row `Orbit Secret` field without echoing.
- **Phase 5**. Flip Clients flags (Orbit, Theme, Blocks = YES; auto-flip `WP Publish Enabled` if Services fallback was used). Write CLIENT.md to `/tmp` first then `sudo mv` into `/sites/[domain]/CLIENT.md` (NOT `sudo tee <<EOF` — the heredoc attaches to `tee`, not sudo). Update Websites row to `Status = Active`. Emit summary + JSON.
- Every failure leaves the Websites row with `Status = Needs Review` and a resume hint in exit output.
- Never log or echo the Orbit Secret.
