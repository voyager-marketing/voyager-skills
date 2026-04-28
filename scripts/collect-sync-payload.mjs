#!/usr/bin/env node
/**
 * Collect all agent, tool, and eval definitions and output a JSON payload
 * string suitable for piping into sync-to-portal.mjs.
 *
 * Usage:
 *   node scripts/collect-sync-payload.mjs <commit-sha> <source-repo>
 *
 * Outputs a single-line JSON string to stdout.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import yaml from 'js-yaml'

const ROOT = path.resolve(fileURLToPath(new URL('..', import.meta.url)))
const AGENTS_DIR = path.join(ROOT, 'agents')
const TOOLS_DIR = path.join(ROOT, 'agents', 'tools')
const EVALS_DIR = path.join(ROOT, 'agents', 'evals')

const commitSha = process.argv[2] || 'unknown'
const sourceRepo = process.argv[3] || 'voyager-marketing/voyager-skills'

function loadYamlFiles(dir, recursive = false) {
  const results = []
  if (!fs.existsSync(dir)) return results

  const entries = fs.readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    if (entry.name.startsWith('_')) continue
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory() && recursive) {
      results.push(...loadYamlFiles(fullPath, true))
    } else if (entry.isFile() && (entry.name.endsWith('.yaml') || entry.name.endsWith('.yml'))) {
      try {
        const raw = fs.readFileSync(fullPath, 'utf8')
        const doc = yaml.load(raw)
        results.push({ file: path.relative(ROOT, fullPath).replace(/\\/g, '/'), ...doc })
      } catch (e) {
        process.stderr.write(`Warning: could not parse ${fullPath}: ${e.message}\n`)
      }
    }
  }

  return results
}

// Load top-level agent definitions (agents/*.yaml)
const agents = fs.readdirSync(AGENTS_DIR, { withFileTypes: true })
  .filter(d => d.isFile() && (d.name.endsWith('.yaml') || d.name.endsWith('.yml')) && !d.name.startsWith('_'))
  .map(d => {
    const fullPath = path.join(AGENTS_DIR, d.name)
    try {
      const raw = fs.readFileSync(fullPath, 'utf8')
      const doc = yaml.load(raw)
      return {
        file: `agents/${d.name}`,
        source_repo: sourceRepo,
        source_commit: commitSha,
        ...doc,
      }
    } catch (e) {
      process.stderr.write(`Warning: could not parse ${fullPath}: ${e.message}\n`)
      return null
    }
  })
  .filter(Boolean)

// Load tool definitions (agents/tools/*.yaml)
const tools = loadYamlFiles(TOOLS_DIR)

// Load eval definitions (agents/evals/*/*.yaml)
const evals = loadYamlFiles(EVALS_DIR, true)

const payload = {
  schema_version: '1',
  source_repo: sourceRepo,
  source_commit: commitSha,
  synced_at: new Date().toISOString(),
  agents,
  tools,
  evals,
}

process.stdout.write(JSON.stringify(payload))
