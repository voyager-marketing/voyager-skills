#!/usr/bin/env node
/**
 * Check skill allowed-tools entries against the Voyager MCP tool catalog.
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { buildSkillInventory } from './skill-governance.mjs';

export const VOYAGER_MCP_PREFIX = 'mcp__claude_ai_Voyager_MCP__';

export function extractVoyagerMcpToolName(toolName) {
  if (typeof toolName !== 'string') return null;
  if (!toolName.startsWith(VOYAGER_MCP_PREFIX)) return null;
  const stripped = toolName.slice(VOYAGER_MCP_PREFIX.length);
  return stripped.length ? stripped : null;
}

export function checkMcpContracts(skillRows, mcpTools) {
  const errors = [];

  for (const skill of skillRows) {
    for (const tool of skill.allowed_tools ?? []) {
      const mcpTool = extractVoyagerMcpToolName(tool);
      if (!mcpTool) continue;
      if (!mcpTools.has(mcpTool)) {
        errors.push(`${skill.name}: references missing Voyager MCP tool ${mcpTool}`);
      }
    }
  }

  return errors;
}

export function catalogRowsToToolSet(rows) {
  return new Set(rows.map((row) => row.name).filter(Boolean));
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--mcp-catalog') args.mcpCatalog = argv[++i];
    else if (arg === '--mcp-repo') args.mcpRepo = argv[++i];
  }
  return args;
}

function readCatalogFile(catalogPath) {
  return JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
}

function readCatalogFromRepo(mcpRepo) {
  const result = spawnSync(process.execPath, ['scripts/list-tools.mjs', '--json'], {
    cwd: mcpRepo,
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    const stderr = result.stderr.trim();
    const stdout = result.stdout.trim();
    throw new Error(
      `Failed to read MCP tool catalog from ${mcpRepo}: ${stderr || stdout || `exit ${result.status}`}`
    );
  }

  return JSON.parse(result.stdout);
}

function skillRoots(root) {
  return ['skills', 'wordpress', 'shared', 'diagnostics']
    .map((dir) => path.join(root, dir))
    .filter((dir) => fs.existsSync(dir));
}

function runCli() {
  const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
  const args = parseArgs(process.argv.slice(2));
  const catalogRows = args.mcpCatalog
    ? readCatalogFile(path.resolve(args.mcpCatalog))
    : readCatalogFromRepo(path.resolve(root, args.mcpRepo ?? '../voyager-mcp-server'));

  const skillRows = buildSkillInventory(skillRoots(root));
  const errors = checkMcpContracts(skillRows, catalogRowsToToolSet(catalogRows));

  if (errors.length) {
    console.error(`Voyager MCP contract check failed with ${errors.length} error${errors.length === 1 ? '' : 's'}:`);
    for (const error of errors) console.error(`  - ${error}`);
    process.exit(1);
  }

  console.log(
    `✓ Voyager MCP contracts valid (${skillRows.length} skills checked, ${catalogRows.length} MCP tools available).`
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCli();
}
