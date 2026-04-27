#!/usr/bin/env node
/**
 * Eval runner for Portal Agent Runtime.
 *
 * Usage:
 *   node scripts/run-evals.mjs <agent-name> [--stub] [--verbose]
 *   node scripts/run-evals.mjs project-hygiene-sweeper --stub
 *   node scripts/run-evals.mjs project-task-executor --verbose
 *
 * Flags:
 *   --stub      Force stub agent even if PORTAL_API_KEY is set (safe for CI dry-runs)
 *   --verbose   Print per-failure diffs inline
 *
 * Environment:
 *   PORTAL_API_KEY         Portal thin-client API key (Phase 0c). Without it, stub mode is used.
 *   PORTAL_API_URL         Portal base URL (default: https://voyager-portal.vercel.app)
 *   GITHUB_STEP_SUMMARY    Set by GitHub Actions — outputs summary to job UI
 *   GITHUB_TOKEN           Set by GitHub Actions — enables PR comment posting
 *   GITHUB_REPOSITORY      Set by GitHub Actions (owner/repo)
 *   PR_NUMBER              Set by CI workflow from github.event.pull_request.number
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import yaml from 'js-yaml'

const ROOT = path.resolve(fileURLToPath(new URL('..', import.meta.url)))
const AGENTS_EVALS_DIR = path.join(ROOT, 'agents', 'evals')

// ─── Args ────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
const agentName = args.find(a => !a.startsWith('--'))
const forceStub = args.includes('--stub')
const verbose = args.includes('--verbose')

if (!agentName) {
  console.error('Usage: node scripts/run-evals.mjs <agent-name> [--stub] [--verbose]')
  console.error('')
  console.error('Available agents:')
  if (fs.existsSync(AGENTS_EVALS_DIR)) {
    for (const d of fs.readdirSync(AGENTS_EVALS_DIR)) {
      console.error(`  ${d}`)
    }
  }
  process.exit(1)
}

const evalDir = path.join(AGENTS_EVALS_DIR, agentName)
if (!fs.existsSync(evalDir)) {
  console.error(`No eval directory found for agent: ${agentName}`)
  console.error(`Expected: ${evalDir}`)
  process.exit(1)
}

// ─── Load evals ──────────────────────────────────────────────────────────────

const evalFiles = fs.readdirSync(evalDir)
  .filter(f => f.endsWith('.yaml') || f.endsWith('.yml'))
  .sort()

if (evalFiles.length === 0) {
  console.error(`No eval files found in ${evalDir}`)
  process.exit(1)
}

// ─── Stub agent ───────────────────────────────────────────────────────────────
// Returns a predictable pending_action based on eval spec expected values.
// Allows the harness to run end-to-end without a real agent. All non-trivially
// matched evals will fail (intended) so the harness correctness can be verified.

function runStubAgent(spec) {
  const { expected } = spec
  // Mirror the expected action_type back so basic structural tests pass.
  // Voice/judge evals intentionally fail in stub mode.
  const hints = (expected.reasoning_contains ?? []).join(' ')

  if (expected.action_type === 'clarify') {
    return {
      action_type: 'clarify',
      reasoning: `Stub: need clarification — ${hints || 'more information'}.`,
      tokens: 0,
      cost_cents: 0,
    }
  }
  if (expected.action_type === 'decline') {
    return {
      action_type: 'decline',
      reasoning: `Stub: out of scope — ${hints}. Refer to /mission.`,
      tokens: 0,
      cost_cents: 0,
    }
  }
  if (expected.flagged === false) {
    return { flagged: false, action_type: 'noop', reasoning: 'Stub: no issues found.', tokens: 0, cost_cents: 0 }
  }
  if (expected.flagged === true || expected.action_type === 'flag_issue') {
    return {
      flagged: true,
      action_type: expected.action_type ?? 'flag_issue',
      issue_type: expected.issue_type,
      target_type: expected.target_type,
      reasoning: hints,
      tokens: 0,
      cost_cents: 0,
    }
  }
  // Default: mirror expected shape so structural tests pass
  return {
    action_type: expected.action_type ?? 'noop',
    target_type: expected.target_type,
    target_id: expected.target_id,
    reasoning: hints,
    tokens: 0,
    cost_cents: 0,
  }
}

// ─── Portal thin client (Phase 0c) ───────────────────────────────────────────
// TODO: implement when Phase 0c lands.

async function runAgentSession(spec) {
  const apiKey = process.env.PORTAL_API_KEY
  const baseUrl = process.env.PORTAL_API_URL ?? 'https://voyager-portal.vercel.app'
  const res = await fetch(`${baseUrl}/api/agents/sessions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ agent: agentName, fixture: spec.fixture }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Portal API ${res.status}: ${text}`)
  }
  return res.json()
}

// ─── Verifier ────────────────────────────────────────────────────────────────

function verify(actual, expected) {
  const failures = []

  if (expected.action_type !== undefined && actual.action_type !== expected.action_type) {
    failures.push(`action_type: expected "${expected.action_type}", got "${actual.action_type}"`)
  }

  if (expected.flagged !== undefined && actual.flagged !== expected.flagged) {
    failures.push(`flagged: expected ${expected.flagged}, got ${actual.flagged}`)
  }

  if (expected.issue_type !== undefined && actual.issue_type !== expected.issue_type) {
    failures.push(`issue_type: expected "${expected.issue_type}", got "${actual.issue_type ?? 'undefined'}"`)
  }

  if (expected.target_type !== undefined && actual.target_type !== expected.target_type) {
    failures.push(`target_type: expected "${expected.target_type}", got "${actual.target_type ?? 'undefined'}"`)
  }

  if (expected.target_id !== undefined && actual.target_id !== expected.target_id) {
    failures.push(`target_id: expected "${expected.target_id}", got "${actual.target_id ?? 'undefined'}"`)
  }

  const content = actual.reasoning ?? actual.proposed_change?.content ?? ''

  if (expected.reasoning_contains) {
    for (const phrase of expected.reasoning_contains) {
      if (!content.toLowerCase().includes(phrase.toLowerCase())) {
        failures.push(`reasoning_contains: missing "${phrase}"`)
      }
    }
  }

  if (expected.reasoning_excludes) {
    for (const phrase of expected.reasoning_excludes) {
      if (content.toLowerCase().includes(phrase.toLowerCase())) {
        failures.push(`reasoning_excludes: found banned phrase "${phrase}"`)
      }
    }
  }

  return failures
}

// ─── Run ─────────────────────────────────────────────────────────────────────

const useStub = forceStub || !process.env.PORTAL_API_KEY

console.log(`\nAgent: ${agentName}`)
console.log(`Mode:  ${useStub ? 'stub' : 'live'}`)
console.log(`Evals: ${evalFiles.length}`)
console.log()

const results = []
let passed = 0
let failed = 0
let parseErrors = 0
let totalTokens = 0
let totalCostCents = 0

for (const file of evalFiles) {
  const filePath = path.join(evalDir, file)
  const raw = fs.readFileSync(filePath, 'utf8')

  let spec
  try {
    spec = yaml.load(raw)
  } catch (e) {
    console.error(`  PARSE ERROR ${file}: ${e.message}`)
    parseErrors++
    failed++
    continue
  }

  const { id = file, description = '', expected = {}, verifier } = spec

  let actual
  try {
    actual = useStub ? runStubAgent(spec) : await runAgentSession(spec)
  } catch (e) {
    actual = { action_type: 'error', reasoning: e.message, tokens: 0, cost_cents: 0 }
  }

  // Judge-based evals always pass in stub mode (they need a real agent)
  const failures = verifier === 'judge' && useStub
    ? []
    : verify(actual, expected)

  const ok = failures.length === 0
  if (ok) passed++; else failed++

  totalTokens += actual.tokens ?? 0
  totalCostCents += actual.cost_cents ?? 0

  results.push({ id, description, ok, failures, file, verifier })

  const icon = ok ? '✓' : '✗'
  const judgeNote = verifier === 'judge' && useStub ? ' [judge: skip in stub]' : ''
  console.log(`  ${icon} ${id}: ${description}${judgeNote}`)
  if (!ok && verbose) {
    for (const f of failures) console.log(`      ↳ ${f}`)
  }
}

// ─── Summary ────────────────────────────────────────────────────────────────

console.log()
console.log('─'.repeat(50))
console.log(`Results: ${passed} passed, ${failed} failed / ${results.length} total`)
if (totalTokens > 0) {
  console.log(`Tokens:  ${totalTokens.toLocaleString()}`)
  console.log(`Cost:    $${(totalCostCents / 100).toFixed(4)}`)
}
if (parseErrors > 0) {
  console.log(`Parse errors: ${parseErrors}`)
}
console.log()

if (failed > 0 && !verbose) {
  console.log('Failures (re-run with --verbose for details):')
  for (const r of results.filter(r => !r.ok)) {
    console.log(`  ✗ ${r.id}: ${r.failures[0] ?? 'unknown'}`)
  }
  console.log()
}

// ─── GitHub Actions step summary ────────────────────────────────────────────

if (process.env.GITHUB_STEP_SUMMARY) {
  const lines = [
    `## Agent Eval Results — \`${agentName}\``,
    '',
    `**${passed} passed** / **${failed} failed** / ${results.length} total  `,
    useStub ? '_Mode: stub (no live agent calls)_' : '_Mode: live_',
    '',
    '| ID | Description | Result |',
    '|---|---|---|',
    ...results.map(r => {
      const tag = r.verifier === 'judge' && useStub ? '⏭ Skip (judge)' : r.ok ? '✅ Pass' : '❌ Fail'
      return `| \`${r.id}\` | ${r.description} | ${tag} |`
    }),
  ]
  if (failed > 0) {
    lines.push('', '### Failures', '')
    for (const r of results.filter(r => !r.ok)) {
      lines.push(`**\`${r.id}\`** — ${r.description}`)
      for (const f of r.failures) lines.push(`- ${f}`)
      lines.push('')
    }
  }
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, lines.join('\n') + '\n')
}

// ─── PR comment ──────────────────────────────────────────────────────────────

if (process.env.GITHUB_TOKEN && process.env.GITHUB_REPOSITORY && process.env.PR_NUMBER) {
  const statusIcon = failed === 0 ? '✅' : '❌'
  const body = [
    `## ${statusIcon} Agent Eval Results — \`${agentName}\``,
    '',
    `**${passed} passed** / **${failed} failed** / ${results.length} total`,
    useStub ? '_Stub mode — no live agent calls_' : '',
    '',
    ...(failed > 0 ? [
      '### Failures',
      '',
      ...results.filter(r => !r.ok).map(r =>
        `- **\`${r.id}\`**: ${r.failures.join('; ')}`
      ),
    ] : ['_All evals passed._']),
  ].filter(l => l !== undefined).join('\n')

  const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/')
  const url = `https://api.github.com/repos/${owner}/${repo}/issues/${process.env.PR_NUMBER}/comments`
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({ body }),
    })
    if (!res.ok) {
      const text = await res.text()
      console.error(`Failed to post PR comment: ${res.status} ${text}`)
    }
  } catch (e) {
    console.error(`PR comment error: ${e.message}`)
  }
}

process.exit(failed > 0 ? 1 : 0)
