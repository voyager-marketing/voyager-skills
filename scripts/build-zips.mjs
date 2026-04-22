#!/usr/bin/env node
/**
 * Build Claude.ai-ready zips for every Live skill.
 *
 * Output:
 *   dist/org/<skill>.zip       — Organization panel skills (Alex uses them too)
 *   dist/personal/<skill>.zip  — Personal panel skills (Ben-only, dev workflow)
 *
 * Cross-platform. Uses adm-zip which writes forward-slash paths by default,
 * so the output passes Claude.ai's upload validator on Windows, macOS, and
 * Linux. Drops the PowerShell script.
 *
 * Runs locally (`npm run build-zips`) and in the release GitHub Action.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import AdmZip from 'adm-zip';

const ROOT = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const SKILLS_DIR = path.join(ROOT, 'skills');
const DIST_DIR = path.join(ROOT, 'dist');

// Surface routing. Edit this map when a skill's Surface changes in the Skills DB.
// Rule: Chat Org = Alex uses it (content/SEO/client ops/reporting).
//       Chat Personal = Ben-only (WP plugin dev, git workflow).
const ORG_SKILLS = [
  'client-prep',
  'onboard-client',
  'fleet-health',
  'pattern-cloud',
  'prospect-audit',
  'content-brief',
  'content-production',
  'content-strategy',
  'content-audit',
  'content-tracker',
  'editorial-qa',
  'social-repurpose',
  'publish',
  'content-hero-image',
  'content-image-library',
  'seo-report',
  'seo-research',
  'link-builder',
  'pseo',
  'pseo-manage',
  'report',
];

const PERSONAL_SKILLS = [
  'voyager-abilities',
  'voyager-ai-integration',
  'voyager-orbit-dev',
  'wp-lab',
  'ship-session',
];

function collectFiles(dir, prefix = '') {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) out.push(...collectFiles(full, rel));
    else out.push({ abs: full, rel });
  }
  return out;
}

function buildZip(skillName, destDir) {
  const src = path.join(SKILLS_DIR, skillName);
  const dst = path.join(destDir, `${skillName}.zip`);

  if (!fs.existsSync(src)) {
    console.warn(`  ⚠ ${skillName}: source not found at skills/${skillName}, skipping`);
    return null;
  }

  fs.mkdirSync(destDir, { recursive: true });
  if (fs.existsSync(dst)) fs.unlinkSync(dst);

  const zip = new AdmZip();
  // Entry names use forward slashes so Claude.ai's upload validator accepts
  // the zip on every platform. addFile lets us set the entry path explicitly.
  for (const f of collectFiles(src)) {
    zip.addFile(`${skillName}/${f.rel}`, fs.readFileSync(f.abs));
  }
  zip.writeZip(dst);
  return fs.statSync(dst).size;
}

const orgDir = path.join(DIST_DIR, 'org');
const personalDir = path.join(DIST_DIR, 'personal');

console.log(`Building Org zips (${ORG_SKILLS.length}):`);
for (const s of ORG_SKILLS) {
  const size = buildZip(s, orgDir);
  if (size !== null) console.log(`  ${s}.zip (${size} bytes)`);
}

console.log(`\nBuilding Personal zips (${PERSONAL_SKILLS.length}):`);
for (const s of PERSONAL_SKILLS) {
  const size = buildZip(s, personalDir);
  if (size !== null) console.log(`  ${s}.zip (${size} bytes)`);
}

console.log(`\nDone. Zips in ${path.relative(ROOT, DIST_DIR)}/.`);
