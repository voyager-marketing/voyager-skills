# Voyager AI OS Next Phases Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Voyager's skills/MCP operating model portable across machines by finishing governance coverage, community skill intake, MCP contract checks, and the first workflow refactor.

**Architecture:** `voyager-skills` owns skill governance, intake, and validation. `voyager-mcp-server` owns the authoritative MCP tool catalog and service execution. Cross-repo checks should fail early when skill metadata, allowed tools, or MCP tool names drift.

**Tech Stack:** Node.js ESM scripts, `node:test`, `js-yaml`, TypeScript MCP server modules, existing `npm run validate`, `npm test`, and MCP preflight scripts.

---

## Source Context

- Strategy doc: `F:\dev\voyager\AI Tools\voyager-skills\docs\voyager-ai-os-roadmap.md`
- Community intake doc: `F:\dev\voyager\AI Tools\voyager-skills\docs\community-skill-intake.md`
- Existing governance module: `F:\dev\voyager\AI Tools\voyager-skills\scripts\skill-governance.mjs`
- Existing inventory CLI: `F:\dev\voyager\AI Tools\voyager-skills\scripts\inventory-skills.mjs`
- Existing validator: `F:\dev\voyager\AI Tools\voyager-skills\scripts\validate-skills.mjs`
- MCP server tool registrations: `F:\dev\voyager\AI Tools\voyager-mcp-server\src\tools*.ts`
- MCP server preflight pattern: `F:\dev\voyager\AI Tools\voyager-mcp-server\scripts\preflight.sh`

## Task 1: Extend Governance Inventory Beyond Root Skills

**Files:**
- Modify: `F:\dev\voyager\AI Tools\voyager-skills\scripts\skill-governance.mjs`
- Modify: `F:\dev\voyager\AI Tools\voyager-skills\scripts\inventory-skills.mjs`
- Modify: `F:\dev\voyager\AI Tools\voyager-skills\scripts\skill-governance.test.mjs`
- Modify: `F:\dev\voyager\AI Tools\voyager-skills\README.md`

- [x] **Step 1: Write a failing test for multiple skill roots**

Add a test that creates `skills/`, `wordpress/`, `shared/`, and `diagnostics/` directories in a temp root and verifies inventory rows include a `root` field.

```js
test('buildSkillInventory scans multiple Voyager skill roots', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'voyager-skill-roots-'));
  for (const rootName of ['skills', 'wordpress', 'shared', 'diagnostics']) {
    const skillDir = path.join(root, rootName, `${rootName}-sample`);
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(
      path.join(skillDir, 'SKILL.md'),
      `---
name: ${rootName}-sample
description: Use when testing ${rootName}.
owner: Ben
last_reviewed: 2026-05-12
distribution: internal
origin: voyager
mcp_requirement: none
logic_type: reference
surface: all
---

# ${rootName}
`,
    );
  }

  const rows = buildSkillInventory([
    path.join(root, 'skills'),
    path.join(root, 'wordpress'),
    path.join(root, 'shared'),
    path.join(root, 'diagnostics'),
  ]);

  assert.deepEqual(
    rows.map((row) => `${row.root}:${row.name}`),
    [
      'skills:skills-sample',
      'wordpress:wordpress-sample',
      'shared:shared-sample',
      'diagnostics:diagnostics-sample',
    ],
  );
});
```

- [x] **Step 2: Run the test and confirm it fails**

Run:

```bash
npm test
```

Expected: fail because `buildSkillInventory` currently accepts one directory path and does not attach `root`.

- [x] **Step 3: Implement multi-root inventory scanning**

Change `buildSkillInventory(skillsDir)` to accept either a string or an array of directories. For each row, add:

```js
root: path.basename(rootDir)
```

Keep backward compatibility by wrapping string input:

```js
const rootDirs = Array.isArray(skillsDirs) ? skillsDirs : [skillsDirs];
```

- [x] **Step 4: Update inventory CLI roots**

In `scripts/inventory-skills.mjs`, scan these roots:

```js
const SKILL_ROOTS = ['skills', 'wordpress', 'shared', 'diagnostics']
  .map((dir) => path.join(ROOT, dir))
  .filter((dir) => fs.existsSync(dir));
```

Update the markdown table to include a `Root` column.

- [x] **Step 5: Run verification**

Run:

```bash
npm test
npm run validate
npm run inventory
```

Expected:

- Tests pass.
- Existing root skill validation passes.
- Inventory includes root-level and non-root skill folders.
- Governance gaps are visible for non-root skills until metadata is added.

- [x] **Step 6: Add metadata to non-root skills or document exclusions**

If the inventory reports missing fields for `wordpress/`, `shared/`, or `diagnostics/`, add the same five governance fields to those `SKILL.md` files. If any directory is intentionally excluded, document the exclusion in `README.md` and update `SKILL_ROOTS` accordingly.

- [x] **Step 7: Commit**

```bash
git add README.md scripts/skill-governance.mjs scripts/inventory-skills.mjs scripts/skill-governance.test.mjs wordpress shared diagnostics
git commit -m "feat: expand skill governance inventory"
```

## Task 2: Add Community Skill Intake Tracking

**Files:**
- Create: `F:\dev\voyager\AI Tools\voyager-skills\community\README.md`
- Create: `F:\dev\voyager\AI Tools\voyager-skills\community\intake.json`
- Create: `F:\dev\voyager\AI Tools\voyager-skills\scripts\validate-community-intake.mjs`
- Create: `F:\dev\voyager\AI Tools\voyager-skills\scripts\validate-community-intake.test.mjs`
- Modify: `F:\dev\voyager\AI Tools\voyager-skills\package.json`
- Modify: `F:\dev\voyager\AI Tools\voyager-skills\docs\community-skill-intake.md`

- [x] **Step 1: Write a failing test for intake manifest validation**

Create `scripts/validate-community-intake.test.mjs` with a `node:test` case that validates this row shape:

```json
{
  "name": "example-community-skill",
  "source_url": "https://github.com/example/repo/tree/main/skills/example-community-skill",
  "license": "MIT",
  "status": "reviewing",
  "owner": "Ben",
  "reviewed_on": "2026-05-12",
  "decision": "sandbox"
}
```

Allowed `status`: `discovered`, `reviewing`, `sandboxed`, `forked`, `promoted`, `rejected`.

Allowed `decision`: `sandbox`, `fork`, `promote`, `reject`, `defer`.

- [x] **Step 2: Run the test and confirm it fails**

Run:

```bash
node --test scripts/validate-community-intake.test.mjs
```

Expected: fail because the validator does not exist.

- [x] **Step 3: Implement `validate-community-intake.mjs`**

Implement:

```js
export function validateIntakeRows(rows) {
  const errors = [];
  // validate required fields and allowed enum values
  return errors;
}
```

CLI behavior:

```bash
node scripts/validate-community-intake.mjs
```

Reads `community/intake.json`, prints errors, exits `1` on invalid rows.

- [x] **Step 4: Add initial manifest**

Create `community/intake.json`:

```json
[]
```

Create `community/README.md` explaining that raw community skills go through intake before becoming `imported`, `forked`, or `internal`.

- [x] **Step 5: Wire package script**

Add:

```json
"validate:community": "node scripts/validate-community-intake.mjs"
```

- [x] **Step 6: Run verification**

Run:

```bash
npm test
npm run validate:community
npm run validate
```

Expected: all commands exit `0`.

- [x] **Step 7: Commit**

```bash
git add community docs/community-skill-intake.md package.json scripts/validate-community-intake.mjs scripts/validate-community-intake.test.mjs
git commit -m "feat: add community skill intake tracking"
```

## Task 3: Export MCP Tool Catalog From `voyager-mcp-server`

**Files:**
- Create: `F:\dev\voyager\AI Tools\voyager-mcp-server\scripts\list-tools.mjs`
- Create: `F:\dev\voyager\AI Tools\voyager-mcp-server\scripts\list-tools.test.mjs`
- Modify: `F:\dev\voyager\AI Tools\voyager-mcp-server\package.json`
- Modify: `F:\dev\voyager\AI Tools\voyager-mcp-server\scripts\preflight.sh`

- [x] **Step 1: Write a failing extractor test**

Create `scripts/list-tools.test.mjs` using a temp TypeScript file:

```ts
server.registerTool(
  "report_generate",
  {
    title: "Generate Report",
    description: "Generate a report"
  },
  async () => {}
);
```

Expected extractor output:

```js
[
  {
    name: 'report_generate',
    file: '<temp-file>',
    line: 1
  }
]
```

- [x] **Step 2: Run the test and confirm it fails**

Run from `voyager-mcp-server`:

```bash
node --test scripts/list-tools.test.mjs
```

Expected: fail because the extractor does not exist.

- [x] **Step 3: Implement static tool extraction**

Implement `extractToolRecords(files)` in `scripts/list-tools.mjs` using the same rule as `scripts/preflight.sh`: a `server.registerTool(` or `server.tool(` call has the quoted tool name on the next line.

CLI modes:

```bash
node scripts/list-tools.mjs --json
node scripts/list-tools.mjs --markdown
```

Default to markdown.

- [x] **Step 4: Add package script**

Add:

```json
"tools:list": "node scripts/list-tools.mjs --markdown"
```

- [x] **Step 5: Use extractor in preflight or document parity**

Either replace the duplicated shell extraction in `scripts/preflight.sh` with `node scripts/list-tools.mjs --json`, or leave preflight as-is and add a comment that both extraction rules must stay in sync. Prefer replacing duplication if the Node script is stable on Windows and Linux.

- [x] **Step 6: Run verification**

Run from `voyager-mcp-server`:

```bash
node --test scripts/list-tools.test.mjs
npm run tools:list
npm run preflight
```

Expected:

- Test passes.
- Tool catalog prints current MCP tools.
- Preflight passes.

- [x] **Step 7: Commit**

```bash
git add package.json scripts/list-tools.mjs scripts/list-tools.test.mjs scripts/preflight.sh
git commit -m "feat: export mcp tool catalog"
```

## Task 4: Add Skill-to-MCP Contract Check

**Files:**
- Create: `F:\dev\voyager\AI Tools\voyager-skills\scripts\check-mcp-contracts.mjs`
- Create: `F:\dev\voyager\AI Tools\voyager-skills\scripts\check-mcp-contracts.test.mjs`
- Modify: `F:\dev\voyager\AI Tools\voyager-skills\package.json`
- Modify: `F:\dev\voyager\AI Tools\voyager-skills\README.md`

- [x] **Step 1: Write a failing contract test**

Test input:

```js
const skills = [
  {
    name: 'report',
    allowed_tools: [
      'mcp__claude_ai_Voyager_MCP__report_generate',
      'Bash'
    ],
  },
];
const mcpTools = new Set(['report_generate']);
```

Expected: no errors.

Second case:

```js
const mcpTools = new Set(['client_get_profile']);
```

Expected error:

```text
report: references missing Voyager MCP tool report_generate
```

- [x] **Step 2: Run the test and confirm it fails**

Run:

```bash
node --test scripts/check-mcp-contracts.test.mjs
```

Expected: fail because the contract checker does not exist.

- [x] **Step 3: Implement checker**

Rules:

- Ignore non-MCP tools such as `Bash`, `Read`, `Grep`, `Glob`, `Agent`, `TodoWrite`, `WebSearch`, and `WebFetch`.
- Only check tools with prefix `mcp__claude_ai_Voyager_MCP__`.
- Strip the prefix to get the MCP tool name.
- Compare against catalog JSON from `voyager-mcp-server`.

CLI:

```bash
node scripts/check-mcp-contracts.mjs --mcp-catalog "../voyager-mcp-server/dist/tool-catalog.json"
```

- [x] **Step 4: Add MCP catalog output target**

In Task 3, make `voyager-mcp-server` support:

```bash
node scripts/list-tools.mjs --json > dist/tool-catalog.json
```

If `dist/` is gitignored, regenerate this file during contract checks rather than committing it.

- [x] **Step 5: Wire package script**

Add:

```json
"check:mcp-contracts": "node scripts/check-mcp-contracts.mjs --mcp-repo ../voyager-mcp-server"
```

The checker should run the MCP repo's `tools:list` JSON command internally so users do not need to manage a generated file.

- [x] **Step 6: Run verification**

Run from `voyager-skills`:

```bash
npm test
npm run check:mcp-contracts
npm run validate
```

Expected: tests pass and contract checker either passes or reports real missing tool names that must be fixed before commit.

- [x] **Step 7: Commit**

```bash
git add README.md package.json scripts/check-mcp-contracts.mjs scripts/check-mcp-contracts.test.mjs
git commit -m "feat: check voyager mcp tool contracts"
```

## Task 5: First Workflow Refactor Candidate, `content-audit`

**Files:**
- Inspect: `F:\dev\voyager\AI Tools\voyager-skills\skills\content-audit\SKILL.md`
- Inspect: `F:\dev\voyager\AI Tools\voyager-mcp-server\src\tools-content.ts`
- Inspect: `F:\dev\voyager\AI Tools\voyager-mcp-server\src\tools-seo-orbit.ts`
- Modify only after designing the exact server-side tool shape.

- [x] **Step 1: Confirm current MCP tool names**

Run:

```bash
cd "F:\dev\voyager\AI Tools\voyager-mcp-server"
npm run tools:list
```

Look for:

- `seo_audit_freshness`
- `seo_audit_images`
- `content_analyze_gaps`
- `seo_predict_performance`
- existing `content_audit` or equivalent composite

- [x] **Step 2: Decide whether this is a new composite or an extension**

If `content_audit` already exists, extend it with `mode: "full"`. If it does not exist, add:

```ts
content_audit(
  client_site: string,
  mode: "freshness" | "images" | "gaps" | "performance" | "full",
  options?: {
    months?: number;
    keyword?: string;
    post_id?: number;
    post_type?: "post" | "page" | "service_area";
    limit?: number;
  }
) -> {
  findings: Finding[];
  summary: string;
  prioritized_actions: Action[];
}
```

- [x] **Step 3: Write failing MCP tests**

Use existing test style in `voyager-mcp-server` if available. The key test should verify `mode: "full"` orchestrates freshness, images, and performance paths and returns one merged response shape.

- [x] **Step 4: Implement minimal MCP composite**

Keep the first version boring:

- Validate required inputs by mode.
- For `full`, call the three safe audit modes.
- Return structured errors per mode rather than failing the entire audit when one mode fails.
- Do not add publishing, writes, or destructive actions.

- [x] **Step 5: Thin the skill only after MCP tests pass**

Update `skills/content-audit/SKILL.md` so it calls the composite where available and keeps only:

- intent matching
- mode selection
- output formatting
- honesty/specificity rules
- handoff phrases

- [x] **Step 6: Run cross-repo verification**

Run from `voyager-mcp-server`:

```bash
npm test
npm run preflight
```

Run from `voyager-skills`:

```bash
npm test
npm run validate
npm run check:mcp-contracts
```

- [x] **Step 7: Commit MCP and skill changes**

Commit in the relevant repo or repos:

```bash
git commit -m "feat: add content audit composite"
```

If both repos change, push both branches and mention both commit hashes in the handoff.

## Continuation Prompt

Use this prompt in a new Codex session:

```text
Continue Voyager AI OS from docs/superpowers/plans/2026-05-12-voyager-ai-os-next-phases.md.
Start at the first unchecked task. Preserve the private/internal-first strategy from docs/voyager-ai-os-roadmap.md.
Run verification before each commit and leave unrelated local files untouched.
```

## Completion Criteria

- `voyager-skills` inventory covers all intended skill roots.
- Community skill intake has a manifest, validator, and documented promotion path.
- `voyager-mcp-server` can export a static MCP tool catalog.
- `voyager-skills` can check Voyager MCP tool references against that catalog.
- `content-audit` is the first validated workflow refactor candidate or has a written blocker explaining why it should not be first.
