#!/usr/bin/env node
/**
 * Validate all agent, tool, and eval definitions against their JSON Schemas,
 * then run cross-reference checks.
 *
 * Exits 0 on success, 1 on any failure.
 *
 * Usage:
 *   node scripts/validate-agents.mjs
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import yaml from 'js-yaml'
import Ajv from 'ajv'

const ROOT = path.resolve(fileURLToPath(new URL('..', import.meta.url)))
const AGENTS_DIR = path.join(ROOT, 'agents')
const TOOLS_DIR = path.join(ROOT, 'agents', 'tools')
const EVALS_DIR = path.join(ROOT, 'agents', 'evals')
const SKILLS_DIR = path.join(ROOT, 'skills')

const ajv = new Ajv({ allErrors: true })

// ─── Schema loading ───────────────────────────────────────────────────────────

function loadSchema(schemaPath) {
  const raw = fs.readFileSync(schemaPath, 'utf8')
  return JSON.parse(raw)
}

const agentSchema = loadSchema(path.join(AGENTS_DIR, '_schema.json'))
const toolSchema = loadSchema(path.join(TOOLS_DIR, '_schema.json'))
const evalSchema = loadSchema(path.join(EVALS_DIR, '_schema.json'))

const validateAgent = ajv.compile(agentSchema)
const validateTool = ajv.compile(toolSchema)
const validateEval = ajv.compile(evalSchema)

// ─── State ────────────────────────────────────────────────────────────────────

const errors = []   // [{ file, message }]
const passed = []   // file paths that validated OK

function fail(file, message) {
  errors.push({ file, message })
}

function ok(file) {
  passed.push(file)
}

function formatAjvErrors(errs) {
  return (errs || []).map(e => `${e.instancePath || '(root)'}: ${e.message}`).join('; ')
}

// ─── 1. Agent YAMLs (agents/*.yaml, not in subdirs) ──────────────────────────

const agentNames = new Set()
const agentFiles = fs.readdirSync(AGENTS_DIR, { withFileTypes: true })
  .filter(d => d.isFile() && (d.name.endsWith('.yaml') || d.name.endsWith('.yml')) && !d.name.startsWith('_'))
  .map(d => path.join(AGENTS_DIR, d.name))

for (const filePath of agentFiles) {
  const rel = path.relative(ROOT, filePath).replace(/\\/g, '/')
  let doc
  try {
    doc = yaml.load(fs.readFileSync(filePath, 'utf8'))
  } catch (e) {
    fail(rel, `YAML parse error: ${e.message}`)
    continue
  }
  const valid = validateAgent(doc)
  if (!valid) {
    fail(rel, formatAjvErrors(validateAgent.errors))
  } else {
    agentNames.add(doc.name)
    ok(rel)
  }
}

// ─── 2. Tool YAMLs (agents/tools/*.yaml) ─────────────────────────────────────

const toolNames = new Set()
const toolFiles = fs.existsSync(TOOLS_DIR)
  ? fs.readdirSync(TOOLS_DIR, { withFileTypes: true })
      .filter(d => d.isFile() && (d.name.endsWith('.yaml') || d.name.endsWith('.yml')) && !d.name.startsWith('_'))
      .map(d => path.join(TOOLS_DIR, d.name))
  : []

for (const filePath of toolFiles) {
  const rel = path.relative(ROOT, filePath).replace(/\\/g, '/')
  let doc
  try {
    doc = yaml.load(fs.readFileSync(filePath, 'utf8'))
  } catch (e) {
    fail(rel, `YAML parse error: ${e.message}`)
    continue
  }
  const valid = validateTool(doc)
  if (!valid) {
    fail(rel, formatAjvErrors(validateTool.errors))
  } else {
    toolNames.add(doc.name)
    ok(rel)
  }
}

// ─── 3. Eval YAMLs (agents/evals/*/*.yaml) ───────────────────────────────────

const evalDocs = []   // { rel, doc } — for cross-ref checks
let evalFileCount = 0

if (fs.existsSync(EVALS_DIR)) {
  const evalDirs = fs.readdirSync(EVALS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory() && !d.name.startsWith('_'))

  for (const dir of evalDirs) {
    const dirPath = path.join(EVALS_DIR, dir.name)
    const files = fs.readdirSync(dirPath, { withFileTypes: true })
      .filter(d => d.isFile() && (d.name.endsWith('.yaml') || d.name.endsWith('.yml')) && !d.name.startsWith('_'))

    for (const file of files) {
      const filePath = path.join(dirPath, file.name)
      const rel = path.relative(ROOT, filePath).replace(/\\/g, '/')
      evalFileCount++
      let doc
      try {
        doc = yaml.load(fs.readFileSync(filePath, 'utf8'))
      } catch (e) {
        fail(rel, `YAML parse error: ${e.message}`)
        continue
      }
      const valid = validateEval(doc)
      if (!valid) {
        fail(rel, formatAjvErrors(validateEval.errors))
      } else {
        evalDocs.push({ rel, doc })
        ok(rel)
      }
    }
  }
}

// ─── 4. Cross-reference checks ───────────────────────────────────────────────

// Load agent docs for cross-ref (tools + skills arrays)
const agentDocs = agentFiles.map(filePath => {
  try {
    return yaml.load(fs.readFileSync(filePath, 'utf8'))
  } catch {
    return null
  }
}).filter(Boolean)

for (const agent of agentDocs) {
  const rel = `agents/${agent.name}.yaml`

  // Check tools references
  for (const toolRef of (agent.tools || [])) {
    const toolFile = path.join(TOOLS_DIR, `${toolRef}.yaml`)
    const toolFileYml = path.join(TOOLS_DIR, `${toolRef}.yml`)
    if (!fs.existsSync(toolFile) && !fs.existsSync(toolFileYml)) {
      fail(rel, `tool '${toolRef}' referenced but agents/tools/${toolRef}.yaml not found`)
    }
  }

  // Check skills references
  for (const skillRef of (agent.skills || [])) {
    const skillMd = path.join(SKILLS_DIR, skillRef, 'SKILL.md')
    if (!fs.existsSync(skillMd)) {
      fail(rel, `skill '${skillRef}' referenced but skills/${skillRef}/SKILL.md not found`)
    }
  }
}

// Check eval agent references
for (const { rel, doc } of evalDocs) {
  if (!agentNames.has(doc.agent)) {
    fail(rel, `agent '${doc.agent}' referenced in eval but no agents/${doc.agent}.yaml found`)
  }
}

// ─── 5. Output ────────────────────────────────────────────────────────────────

// Print passing files
for (const f of passed) {
  // Group eval count on the first eval file line
  if (f.startsWith('agents/evals/') && evalFileCount > 0 && f === passed.find(p => p.startsWith('agents/evals/'))) {
    console.log(`✓ ${f} (${evalFileCount} eval files)`)
  } else if (f.startsWith('agents/evals/')) {
    // suppress individual eval lines — already summarized
  } else {
    console.log(`✓ ${f}`)
  }
}

// If there were eval files but none passed, still note the count
if (evalFileCount > 0 && !passed.some(p => p.startsWith('agents/evals/'))) {
  // errors will cover it
}

const line = '─'.repeat(60)
if (errors.length > 0) {
  console.error(`\n${line}`)
  for (const { file, message } of errors) {
    console.error(`✗ ${file} — ${message}`)
  }
  console.error(`\n${errors.length} error${errors.length === 1 ? '' : 's'}. Validation failed.`)
  process.exit(1)
}

const totalFiles = agentFiles.length + toolFiles.length + evalFileCount
console.log(`\n${line}`)
console.log(`✓ ${totalFiles} file${totalFiles === 1 ? '' : 's'} validated (${agentFiles.length} agents, ${toolFiles.length} tools, ${evalFileCount} evals). All OK.`)
