import assert from 'node:assert/strict';
import test from 'node:test';

import {
  checkMcpContracts,
  extractVoyagerMcpToolName,
} from './check-mcp-contracts.mjs';

test('extractVoyagerMcpToolName strips the Voyager MCP prefix', () => {
  assert.equal(
    extractVoyagerMcpToolName('mcp__claude_ai_Voyager_MCP__report_generate'),
    'report_generate',
  );
  assert.equal(extractVoyagerMcpToolName('Bash'), null);
  assert.equal(extractVoyagerMcpToolName('mcp__claude_ai_Notion__notion-search'), null);
});

test('checkMcpContracts passes when Voyager MCP references exist', () => {
  const skills = [
    {
      name: 'report',
      allowed_tools: [
        'mcp__claude_ai_Voyager_MCP__report_generate',
        'Bash',
      ],
    },
  ];
  const mcpTools = new Set(['report_generate']);

  assert.deepEqual(checkMcpContracts(skills, mcpTools), []);
});

test('checkMcpContracts reports missing Voyager MCP tools', () => {
  const skills = [
    {
      name: 'report',
      allowed_tools: [
        'mcp__claude_ai_Voyager_MCP__report_generate',
        'Bash',
      ],
    },
  ];
  const mcpTools = new Set(['client_get_profile']);

  assert.deepEqual(checkMcpContracts(skills, mcpTools), [
    'report: references missing Voyager MCP tool report_generate',
  ]);
});
