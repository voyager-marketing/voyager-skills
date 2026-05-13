import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  GOVERNANCE_FIELDS,
  buildSkillInventory,
  summarizeInventory,
  validateGovernanceMetadata,
} from './skill-governance.mjs';

test('governance metadata accepts the supported Voyager taxonomy', () => {
  const result = validateGovernanceMetadata('report', {
    distribution: 'internal',
    origin: 'voyager',
    mcp_requirement: 'required',
    logic_type: 'tool-wrapper',
    surface: 'all',
  });

  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.warnings, []);
});

test('governance metadata rejects unsupported values with actionable field names', () => {
  const result = validateGovernanceMetadata('report', {
    distribution: 'partner',
    origin: 'marketplace',
    mcp_requirement: 'sometimes',
    logic_type: 'magic',
    surface: 'terminal',
  });

  assert.deepEqual(result.errors, [
    "report: distribution 'partner' must be one of internal, imported, forked, public, client",
    "report: origin 'marketplace' must be one of voyager, community, client, vendor",
    "report: mcp_requirement 'sometimes' must be one of none, optional, required",
    "report: logic_type 'magic' must be one of voice, router, workflow, tool-wrapper, reference",
    "report: surface 'terminal' must be one of claude-code, claude-chat, api, all",
  ]);
  assert.deepEqual(result.warnings, []);
});

test('governance metadata warns when required governance fields are missing', () => {
  const result = validateGovernanceMetadata('report', {});

  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.warnings, [
    `report: missing governance field 'distribution' (${GOVERNANCE_FIELDS.distribution.join('|')})`,
    `report: missing governance field 'origin' (${GOVERNANCE_FIELDS.origin.join('|')})`,
    `report: missing governance field 'mcp_requirement' (${GOVERNANCE_FIELDS.mcp_requirement.join('|')})`,
    `report: missing governance field 'logic_type' (${GOVERNANCE_FIELDS.logic_type.join('|')})`,
    `report: missing governance field 'surface' (${GOVERNANCE_FIELDS.surface.join('|')})`,
  ]);
});

test('governance metadata can skip missing-field warnings during incremental rollout', () => {
  const result = validateGovernanceMetadata('report', {}, { requireFields: false });

  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.warnings, []);
});

test('buildSkillInventory reads skill frontmatter into governance rows', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'voyager-skill-inventory-'));
  const skillsDir = path.join(root, 'skills');
  fs.mkdirSync(path.join(skillsDir, 'report'), { recursive: true });
  fs.writeFileSync(
    path.join(skillsDir, 'report', 'SKILL.md'),
    `---
name: report
description: Use when generating client reports.
owner: Ben
last_reviewed: 2026-05-12
distribution: internal
origin: voyager
mcp_requirement: required
logic_type: tool-wrapper
surface: all
allowed-tools: [mcp__claude_ai_Voyager_MCP__report_generate]
---

# Report
`,
  );

  const rows = buildSkillInventory(skillsDir);

  assert.deepEqual(rows, [
    {
      name: 'report',
      path: path.join(skillsDir, 'report', 'SKILL.md'),
      owner: 'Ben',
      distribution: 'internal',
      origin: 'voyager',
      mcp_requirement: 'required',
      logic_type: 'tool-wrapper',
      surface: 'all',
      allowed_tools: ['mcp__claude_ai_Voyager_MCP__report_generate'],
    },
  ]);
});

test('summarizeInventory counts governance values and surfaces missing metadata', () => {
  const summary = summarizeInventory([
    {
      name: 'report',
      distribution: 'internal',
      origin: 'voyager',
      mcp_requirement: 'required',
      logic_type: 'tool-wrapper',
      surface: 'all',
      owner: 'Ben',
      allowed_tools: ['mcp__claude_ai_Voyager_MCP__report_generate'],
    },
    {
      name: 'community-skill',
      distribution: '',
      origin: 'community',
      mcp_requirement: 'none',
      logic_type: '',
      surface: 'claude-code',
      owner: 'Ben',
      allowed_tools: [],
    },
  ]);

  assert.equal(summary.total, 2);
  assert.deepEqual(summary.counts.distribution, { internal: 1, missing: 1 });
  assert.deepEqual(summary.counts.origin, { voyager: 1, community: 1 });
  assert.deepEqual(summary.counts.mcp_requirement, { required: 1, none: 1 });
  assert.deepEqual(summary.counts.logic_type, { 'tool-wrapper': 1, missing: 1 });
  assert.deepEqual(summary.counts.surface, { all: 1, 'claude-code': 1 });
  assert.deepEqual(summary.gaps, [
    "community-skill: missing governance field 'distribution' (internal|imported|forked|public|client)",
    "community-skill: missing governance field 'logic_type' (voice|router|workflow|tool-wrapper|reference)",
  ]);
});
