#!/usr/bin/env node
/**
 * Validate every skill SKILL.md against the Voyager governance rules.
 *
 * Errors (exit 1) — things that block a merge:
 *   - SKILL.md missing in a skills/ directory
 *   - No YAML frontmatter
 *   - YAML parse error
 *   - `name` missing, wrong case, or mismatched with folder
 *   - `description` missing or >1024 chars
 *   - `owner` missing
 *   - `last_reviewed` missing or not YYYY-MM-DD
 *
 * Warnings (exit 0 but surfaced) — things worth noticing:
 *   - `owner` not Ben or Alex
 *   - `description` without a use-trigger verb
 *   - `last_reviewed` older than 90 days
 *
 * Usage:
 *   node scripts/validate-skills.mjs          # all skills
 *   node scripts/validate-skills.mjs <name>   # single skill
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const ROOT = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const SKILLS_DIR = path.join(ROOT, 'skills');
const KEBAB = /^[a-z][a-z0-9-]*$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const TRIGGER_HINTS = /\b(use when|use this|triggers on|fires on|invoke|call this)\b/i;
const STALE_DAYS = 90;

const errors = [];
const warnings = [];

function readFrontmatter(mdPath) {
  const content = fs.readFileSync(mdPath, 'utf8');
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return { fm: null, reason: 'no YAML frontmatter' };
  try {
    return { fm: yaml.load(match[1]) ?? {}, reason: null };
  } catch (e) {
    return { fm: null, reason: `YAML parse error: ${e.message}` };
  }
}

function daysSince(iso) {
  const ms = Date.now() - new Date(iso).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function validate(skillDir) {
  const skillName = path.basename(skillDir);
  const mdPath = path.join(skillDir, 'SKILL.md');

  if (!fs.existsSync(mdPath)) {
    errors.push(`${skillName}: no SKILL.md in skills/${skillName}/`);
    return;
  }

  const { fm, reason } = readFrontmatter(mdPath);
  if (!fm) {
    errors.push(`${skillName}: ${reason}`);
    return;
  }

  // name
  if (!fm.name) {
    errors.push(`${skillName}: missing 'name'`);
  } else if (!KEBAB.test(fm.name)) {
    errors.push(`${skillName}: name '${fm.name}' must be kebab-case (lowercase, hyphens only)`);
  } else if (fm.name !== skillName) {
    errors.push(`${skillName}: name '${fm.name}' does not match folder '${skillName}'`);
  }

  // description
  if (!fm.description) {
    errors.push(`${skillName}: missing 'description'`);
  } else {
    if (fm.description.length > 1024) {
      errors.push(`${skillName}: description is ${fm.description.length} chars (max 1024)`);
    }
    if (!TRIGGER_HINTS.test(fm.description)) {
      warnings.push(`${skillName}: description has no use-trigger phrase (e.g. "Use when...", "Triggers on:")`);
    }
  }

  // owner
  if (!fm.owner) {
    errors.push(`${skillName}: missing 'owner'`);
  } else if (!['Ben', 'Alex'].includes(fm.owner)) {
    warnings.push(`${skillName}: owner '${fm.owner}' is not Ben or Alex`);
  }

  // last_reviewed — js-yaml auto-parses ISO dates to Date objects, so handle both
  if (!fm.last_reviewed) {
    errors.push(`${skillName}: missing 'last_reviewed'`);
  } else {
    const iso =
      fm.last_reviewed instanceof Date
        ? fm.last_reviewed.toISOString().slice(0, 10)
        : String(fm.last_reviewed);
    if (!ISO_DATE.test(iso)) {
      errors.push(`${skillName}: last_reviewed '${iso}' must be YYYY-MM-DD`);
    } else {
      const age = daysSince(iso);
      if (age > STALE_DAYS) {
        warnings.push(`${skillName}: last_reviewed is ${age} days old (>90, time for a review)`);
      }
    }
  }
}

const target = process.argv[2];
const dirs = fs
  .readdirSync(SKILLS_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .filter((d) => !target || d.name === target)
  .map((d) => path.join(SKILLS_DIR, d.name));

if (dirs.length === 0) {
  console.error(`No skill directories found${target ? ` matching '${target}'` : ''}.`);
  process.exit(1);
}

for (const dir of dirs) validate(dir);

const line = '─'.repeat(60);
if (warnings.length) {
  console.warn(`\n${line}\n${warnings.length} warning${warnings.length === 1 ? '' : 's'}:`);
  for (const w of warnings) console.warn(`  · ${w}`);
}
if (errors.length) {
  console.error(`\n${line}\n${errors.length} error${errors.length === 1 ? '' : 's'}:`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  console.error(`\nValidation failed. Fix the errors above before committing.`);
  process.exit(1);
}
console.log(`\n${line}\n✓ validated ${dirs.length} skill${dirs.length === 1 ? '' : 's'}, ${warnings.length} warning${warnings.length === 1 ? '' : 's'}.`);
