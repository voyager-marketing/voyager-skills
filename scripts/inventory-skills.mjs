#!/usr/bin/env node
/**
 * Print a governance inventory for Voyager skills.
 *
 * Usage:
 *   node scripts/inventory-skills.mjs
 *   node scripts/inventory-skills.mjs --json
 *   node scripts/inventory-skills.mjs --check
 */

import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import { GOVERNANCE_FIELDS, buildSkillInventory, summarizeInventory } from './skill-governance.mjs';

const ROOT = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const SKILL_ROOTS = ['skills', 'wordpress', 'shared', 'diagnostics']
  .map((dir) => path.join(ROOT, dir))
  .filter((dir) => fs.existsSync(dir));
const args = new Set(process.argv.slice(2));

const rows = buildSkillInventory(SKILL_ROOTS);
const summary = summarizeInventory(rows);

if (args.has('--json')) {
  console.log(JSON.stringify({ rows, summary }, null, 2));
  process.exit(summary.gaps.length && args.has('--check') ? 1 : 0);
}

function countLine(field) {
  const counts = summary.counts[field];
  const values = [...GOVERNANCE_FIELDS[field], 'missing']
    .filter((value) => counts[value])
    .map((value) => `${value}: ${counts[value]}`)
    .join(', ');
  return `- ${field}: ${values || 'none'}`;
}

console.log('# Voyager Skill Governance Inventory\n');
console.log(`Total skills: ${summary.total}\n`);
console.log('## Counts\n');
for (const field of Object.keys(GOVERNANCE_FIELDS)) {
  console.log(countLine(field));
}

console.log('\n## Skills\n');
console.log('| Root | Skill | Distribution | Origin | MCP | Logic | Surface | Owner | Tools |');
console.log('|---|---|---|---|---|---|---|---|---:|');
for (const row of rows) {
  console.log(
    `| ${row.root} | ${row.name} | ${row.distribution || 'missing'} | ${row.origin || 'missing'} | ${
      row.mcp_requirement || 'missing'
    } | ${row.logic_type || 'missing'} | ${row.surface || 'missing'} | ${row.owner || 'missing'} | ${
      row.allowed_tools.length
    } |`,
  );
}

console.log('\n## Governance Gaps\n');
if (summary.gaps.length) {
  const bySkill = new Map();
  for (const gap of summary.gaps) {
    const match = gap.match(/^([^:]+): missing governance field '([^']+)'/);
    if (!match) {
      bySkill.set(gap, null);
      continue;
    }
    const [, skill, field] = match;
    bySkill.set(skill, [...(bySkill.get(skill) ?? []), field]);
  }

  for (const [skill, fields] of bySkill) {
    if (!fields) console.log(`- ${skill}`);
    else console.log(`- ${skill}: missing ${fields.join(', ')}`);
  }
} else {
  console.log('- none');
}

if (summary.gaps.length && args.has('--check')) {
  process.exit(1);
}
