#!/usr/bin/env node
/**
 * Sync SKILL.md frontmatter into the Notion Skills DB.
 *
 * For each skill directory:
 *   1. Read SKILL.md frontmatter (name, description, owner, last_reviewed)
 *   2. Find the matching page in the Skills DB by Name (title)
 *   3. Diff the fields we own from source: Description, Owner, Last reviewed, Repo path
 *   4. If any drift, PATCH the page with the new values. Otherwise skip.
 *
 * Fields we explicitly DO NOT sync (Notion-owned):
 *   - Surface, Lifecycle, Last eval — these are human judgment calls
 *   - MCP tools used, Replaces, Replaced by — these are relations curated in Notion
 *
 * Requires env: NOTION_API_KEY (internal integration token, shared with Skills DB).
 *
 * Dry-run mode: pass --dry-run or set DRY_RUN=1 to report diffs without patching.
 *
 * Usage:
 *   NOTION_API_KEY=secret_xxx node scripts/sync-to-notion.mjs
 *   NOTION_API_KEY=secret_xxx node scripts/sync-to-notion.mjs --dry-run
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { Client } from '@notionhq/client';

const ROOT = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const SKILLS_DIR = path.join(ROOT, 'skills');
const SKILLS_DATABASE_ID = 'd511e6fc01a342f5869d79eb51e3c0b0';
const REPO_URL_BASE =
  'https://github.com/voyager-marketing/voyager-skills/blob/main/skills';

const DRY_RUN =
  process.argv.includes('--dry-run') || process.env.DRY_RUN === '1';

if (!process.env.NOTION_API_KEY) {
  console.error('NOTION_API_KEY not set. Create an internal integration in Notion, share it with the Skills DB, and export the secret.');
  process.exit(1);
}

const notion = new Client({ auth: process.env.NOTION_API_KEY });

function readSkillFrontmatter(skillDir) {
  const name = path.basename(skillDir);
  const mdPath = path.join(skillDir, 'SKILL.md');
  if (!fs.existsSync(mdPath)) return null;
  const content = fs.readFileSync(mdPath, 'utf8');
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  let fm;
  try {
    fm = yaml.load(match[1]) ?? {};
  } catch {
    return null;
  }
  const lastReviewed =
    fm.last_reviewed instanceof Date
      ? fm.last_reviewed.toISOString().slice(0, 10)
      : String(fm.last_reviewed ?? '').trim();
  return {
    name,
    description: String(fm.description ?? '').trim(),
    owner: String(fm.owner ?? '').trim(),
    lastReviewed,
    repoPath: `${REPO_URL_BASE}/${name}/SKILL.md`,
  };
}

async function fetchAllSkillsPages() {
  const pages = [];
  let cursor;
  do {
    const res = await notion.databases.query({
      database_id: SKILLS_DATABASE_ID,
      start_cursor: cursor,
      page_size: 100,
    });
    pages.push(...res.results);
    cursor = res.has_more ? res.next_cursor : undefined;
  } while (cursor);
  return pages;
}

function getPropText(props, key) {
  const p = props[key];
  if (!p) return '';
  if (p.type === 'rich_text') return (p.rich_text ?? []).map((t) => t.plain_text).join('');
  if (p.type === 'title') return (p.title ?? []).map((t) => t.plain_text).join('');
  if (p.type === 'url') return p.url ?? '';
  if (p.type === 'select') return p.select?.name ?? '';
  if (p.type === 'date') return p.date?.start ?? '';
  return '';
}

function buildUpdates(fm, page) {
  const updates = {};
  const props = page.properties;

  const currentDescription = getPropText(props, 'Description');
  if (fm.description && currentDescription !== fm.description) {
    updates.Description = { rich_text: [{ type: 'text', text: { content: fm.description } }] };
  }

  const currentOwner = getPropText(props, 'Owner');
  if (fm.owner && currentOwner !== fm.owner) {
    updates.Owner = { select: { name: fm.owner } };
  }

  const currentLastReviewed = getPropText(props, 'Last reviewed');
  if (fm.lastReviewed && currentLastReviewed !== fm.lastReviewed) {
    updates['Last reviewed'] = { date: { start: fm.lastReviewed } };
  }

  const currentRepoPath = getPropText(props, 'Repo path');
  if (fm.repoPath && currentRepoPath !== fm.repoPath) {
    updates['Repo path'] = { url: fm.repoPath };
  }

  return updates;
}

async function main() {
  console.log(`${DRY_RUN ? '[DRY RUN] ' : ''}Syncing SKILL.md frontmatter → Notion Skills DB`);

  const dirs = fs
    .readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => path.join(SKILLS_DIR, d.name));

  const skills = dirs.map(readSkillFrontmatter).filter(Boolean);
  console.log(`Read ${skills.length} skills from repo.`);

  const pages = await fetchAllSkillsPages();
  console.log(`Fetched ${pages.length} rows from Skills DB.`);

  const pagesByName = new Map();
  for (const page of pages) {
    const name = getPropText(page.properties, 'Name');
    if (name) pagesByName.set(name, page);
  }

  let patched = 0;
  let skipped = 0;
  let missing = 0;
  const changes = [];

  for (const fm of skills) {
    const page = pagesByName.get(fm.name);
    if (!page) {
      missing++;
      changes.push({ name: fm.name, action: 'MISSING in Skills DB (not patched)' });
      continue;
    }
    const updates = buildUpdates(fm, page);
    if (Object.keys(updates).length === 0) {
      skipped++;
      continue;
    }
    changes.push({ name: fm.name, action: `patch: ${Object.keys(updates).join(', ')}` });
    if (!DRY_RUN) {
      await notion.pages.update({ page_id: page.id, properties: updates });
    }
    patched++;
  }

  console.log(
    `\nResult: ${patched} patched, ${skipped} in sync, ${missing} missing from DB.\n`
  );
  for (const c of changes) console.log(`  · ${c.name} — ${c.action}`);

  if (missing > 0) {
    console.warn(
      `\n⚠ ${missing} skill${missing === 1 ? '' : 's'} in the repo ${missing === 1 ? 'has' : 'have'} no matching Skills DB row. ` +
        'Create the row manually (or add to scripts/build-zips.mjs and re-run).'
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
