import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

export const GOVERNANCE_FIELDS = Object.freeze({
  distribution: ['internal', 'imported', 'forked', 'public', 'client'],
  origin: ['voyager', 'community', 'client', 'vendor'],
  mcp_requirement: ['none', 'optional', 'required'],
  logic_type: ['voice', 'router', 'workflow', 'tool-wrapper', 'reference'],
  surface: ['claude-code', 'claude-chat', 'api', 'all'],
});

export function readFrontmatter(mdPath) {
  const content = fs.readFileSync(mdPath, 'utf8');
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return { fm: null, reason: 'no YAML frontmatter' };

  try {
    return { fm: yaml.load(match[1]) ?? {}, reason: null };
  } catch (e) {
    return { fm: null, reason: `YAML parse error: ${e.message}` };
  }
}

export function validateGovernanceMetadata(skillName, fm, options = {}) {
  const requireFields = options.requireFields ?? true;
  const errors = [];
  const warnings = [];

  for (const [field, allowed] of Object.entries(GOVERNANCE_FIELDS)) {
    const value = fm[field];

    if (value === undefined || value === null || value === '') {
      if (requireFields) {
        warnings.push(`${skillName}: missing governance field '${field}' (${allowed.join('|')})`);
      }
      continue;
    }

    if (!allowed.includes(String(value))) {
      errors.push(`${skillName}: ${field} '${value}' must be one of ${allowed.join(', ')}`);
    }
  }

  return { errors, warnings };
}

export function buildSkillInventory(skillsDirs) {
  const rows = [];
  const rootDirs = Array.isArray(skillsDirs) ? skillsDirs : [skillsDirs];

  for (const rootDir of rootDirs) {
    const rootName = path.basename(rootDir);
    const dirs = fs
      .readdirSync(rootDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .sort((a, b) => a.name.localeCompare(b.name));

    for (const dir of dirs) {
      const mdPath = path.join(rootDir, dir.name, 'SKILL.md');
      if (!fs.existsSync(mdPath)) continue;

      const { fm, reason } = readFrontmatter(mdPath);
      if (!fm) {
        throw new Error(`${dir.name}: ${reason}`);
      }

      rows.push({
        root: rootName,
        name: fm.name ?? dir.name,
        path: mdPath,
        owner: fm.owner ?? '',
        distribution: fm.distribution ?? '',
        origin: fm.origin ?? '',
        mcp_requirement: fm.mcp_requirement ?? '',
        logic_type: fm.logic_type ?? '',
        surface: fm.surface ?? '',
        allowed_tools: Array.isArray(fm['allowed-tools']) ? fm['allowed-tools'] : [],
      });
    }
  }

  return rows;
}

function increment(counts, field, value) {
  const key = value ? String(value) : 'missing';
  counts[field][key] = (counts[field][key] ?? 0) + 1;
}

export function summarizeInventory(rows) {
  const counts = Object.fromEntries(Object.keys(GOVERNANCE_FIELDS).map((field) => [field, {}]));
  const gaps = [];

  for (const row of rows) {
    for (const field of Object.keys(GOVERNANCE_FIELDS)) {
      increment(counts, field, row[field]);
    }

    const governance = validateGovernanceMetadata(row.name, row);
    gaps.push(...governance.errors, ...governance.warnings);
  }

  return {
    total: rows.length,
    counts,
    gaps,
  };
}
