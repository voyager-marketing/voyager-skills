#!/usr/bin/env node
/**
 * POST a sync payload to the Portal /api/agents/sync endpoint,
 * signed with HMAC-SHA256 using the VOYAGER_SKILLS_SYNC_SECRET.
 *
 * Usage:
 *   node scripts/sync-to-portal.mjs '<json-payload>' '<portal-url>' '<sync-secret>'
 *
 * The payload argument is the JSON string produced by collect-sync-payload.mjs.
 * PORTAL_URL and VOYAGER_SKILLS_SYNC_SECRET can also be provided as env vars.
 */

import crypto from 'node:crypto'

const payloadStr = process.argv[2]
const portalUrl = process.argv[3] || process.env.PORTAL_URL
const syncSecret = process.argv[4] || process.env.VOYAGER_SKILLS_SYNC_SECRET

if (!payloadStr) {
  console.error('Error: payload argument is required.')
  console.error('Usage: node scripts/sync-to-portal.mjs <json-payload> <portal-url> <sync-secret>')
  process.exit(1)
}

if (!portalUrl) {
  console.error('Error: PORTAL_URL is required (argument or env var).')
  process.exit(1)
}

if (!syncSecret) {
  console.error('Error: VOYAGER_SKILLS_SYNC_SECRET is required (argument or env var).')
  process.exit(1)
}

// Generate HMAC-SHA256 signature over the raw payload body
const signature = crypto
  .createHmac('sha256', syncSecret)
  .update(payloadStr, 'utf8')
  .digest('hex')

const endpoint = `${portalUrl.replace(/\/$/, '')}/api/agents/sync`

console.log(`Syncing to ${endpoint} ...`)

let res
try {
  res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-voyager-signature': `sha256=${signature}`,
    },
    body: payloadStr,
  })
} catch (e) {
  console.error(`Network error posting to Portal: ${e.message}`)
  process.exit(1)
}

const responseText = await res.text()

if (!res.ok) {
  console.error(`Portal sync failed: HTTP ${res.status}`)
  console.error(responseText)
  process.exit(1)
}

console.log(`Portal sync succeeded: HTTP ${res.status}`)
try {
  const data = JSON.parse(responseText)
  if (data.agents_upserted !== undefined) {
    console.log(`  agents_upserted: ${data.agents_upserted}`)
  }
  if (data.tools_upserted !== undefined) {
    console.log(`  tools_upserted: ${data.tools_upserted}`)
  }
  if (data.evals_upserted !== undefined) {
    console.log(`  evals_upserted: ${data.evals_upserted}`)
  }
} catch {
  console.log(responseText)
}
