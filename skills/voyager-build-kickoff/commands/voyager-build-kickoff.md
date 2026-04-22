---
description: Provision a Voyager-standard dev site for a Path A client
argument-hint: "<business-name> [--clients-db-url=<id>] [--slug=<kebab>] [--server-notion-id=<id>]"
---

# /voyager-build-kickoff

Provision the dev environment for a new Path A client on the shared Voyager SpinupWP server. Arguments. $ARGUMENTS

Follow the SKILL.md pipeline:

- **Phase 0**. Load Notion MCP. Verify `SPINUPWP_API_TOKEN`, `CLOUDFLARE_API_TOKEN`, `GITHUB_RELEASE_PAT`. Fetch Clients, Websites, Servers DB schemas. Halt if Clients DB `Path` property missing. Resolve the shared Voyager server in Servers DB + SpinupWP API.
- **Phase 1**. Resolve Clients row. Gate on `Path = A`, `Status = Active`, `WP Publish Enabled = YES`, no existing Websites row, `Voyager Orbit Installed` unchecked. Validate slug not taken. Ask user to proceed.
- **Phase 2**. Create Websites row using the "New voyager.website site" template (`Stage = Dev`, `Status = In Progress`, `Server` relation to shared server, `Company` relation to Clients row). Provision SpinupWP site on shared server. Add Cloudflare A record, wait for propagation. Verify SSL.
- **Phase 3**. Install plugin stack via SpinupWP shell (Orbit, Blocks, Core, Abilities API, MCP Adapter, WP AI Client, Rank Math). Install + activate voyager-block-theme. Orbit installed LAST so its activation finds the other plugins present.
- **Phase 4**. Wait for Orbit to self-register with Portal (polls `voyager_registration_status` option until `active`). Read `voyager_site_secret` via WP-CLI, write to Websites row `Orbit Secret` field without echoing to transcript.
- **Phase 5**. Flip Clients flags (Orbit, Theme, Blocks = YES). Write CLIENT.md handoff on server. Emit summary + JSON.
- Every failure leaves the Websites row with `Status = Needs Review` and a resume hint in exit output.
- Never create duplicate Notion records. Never log or echo the Orbit Secret.
