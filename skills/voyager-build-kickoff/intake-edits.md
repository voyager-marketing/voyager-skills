---
name: intake-edits
description: Edits to voyager-client-intake/SKILL.md required to hand off to voyager-build-kickoff. Apply manually when intake merges from worktree to main skills/.
type: handoff-patch
target: skills/voyager-client-intake/SKILL.md
last_reviewed: 2026-04-21
---

# voyager-client-intake edits for build-kickoff handoff

Two edits. Neither changes intake's behavior, only adds a Path A handoff line and a new handoff phrase. Apply when `voyager-client-intake` moves from `.claude/worktrees/.../skills/voyager-client-intake/` to `skills/voyager-client-intake/` on main.

No Path property is added to the Clients DB. Build-kickoff infers Path A from state (WP Publish Enabled = YES, Websites relation empty, Voyager Orbit Installed unchecked), so intake does not need to write anything new.

---

## Edit 1. Step E8 "Next" section

**Location.** Step E8 "Return summary", in the trailing Next block.

**Current (around line 343):**

```
Next:
1. Send welcome email → "draft welcome email for [business_name]"
2. Send Bitwarden Send for credentials
3. (Path B only) Run Site DNA → "run Site DNA for [business_name]"
4. (If skipped) Provision WP later → re-run intake or call "provision site data for [business_name]"
```

**Replace with:**

```
Next:
1. (Path A only) Provision dev site → "run build kickoff for [business_name]"
2. Send welcome email → "draft welcome email for [business_name]"
3. Send Bitwarden Send for credentials
4. (Path B only) Run Site DNA → "run Site DNA for [business_name]"
5. (If skipped) Provision WP later → re-run intake or call "provision site data for [business_name]"
```

Only one line added: the Path A build-kickoff handoff at position 1 (it runs before welcome email because the site needs to exist first).

---

## Edit 2. Handoff phrases list

**Location.** "Handoff phrases after completion" section (around line 381-385).

**Current:**

```
- "draft welcome email" / "send welcome" → `voyager-client-message`
- "run Site DNA" / "start the audit" (Path B) → `voyager-site-dna`
- "credentials" / "password collection" → `voyager-credentials-tracker`
```

**Replace with:**

```
- "run build kickoff" / "provision dev site" (Path A) → `voyager-build-kickoff`
- "draft welcome email" / "send welcome" → `voyager-client-message`
- "run Site DNA" / "start the audit" (Path B) → `voyager-site-dna`
- "credentials" / "password collection" → `voyager-credentials-tracker`
```

One line added at the top.

---

## Why no Path property edit

Earlier draft proposed adding a `Path` single-select to the Clients DB schema so build-kickoff could gate on it. Decided against (2026-04-21, Ben):

- Path is an onboarding-time state, not a client identity attribute.
- If a client upgrades (Path C → Path A later), the Path field would go stale or create reporting noise.
- The Clients row already encodes Path A implicitly via three fields that build-kickoff checks directly.

So intake does not need a new property write, and the "Known schema drift risks" note in intake ("Clients DB has no `Path` property. Currently encoded in task title only") stays accurate.
