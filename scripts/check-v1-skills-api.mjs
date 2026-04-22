#!/usr/bin/env node
/**
 * Monthly check: does Anthropic's /v1/skills API support Teams Org panel
 * provisioning yet?
 *
 * Status as of 2026-04-21: the endpoint exists with beta header
 * `skills-2025-10-02` but is scoped to Messages API code-execution, NOT the
 * Teams Org panel. This script pings the endpoint, records the response
 * shape, and posts to Slack. If the shape changes materially (new fields,
 * new status enums, a Teams scope), we know it's time to test Org panel
 * provisioning and potentially replace the manual upload runbook with an
 * auto-upload step in the release workflow.
 *
 * Requires env: ANTHROPIC_API_KEY.
 * Optional env: SLACK_WEBHOOK_URL (posts summary if set).
 */

const API_KEY = process.env.ANTHROPIC_API_KEY;
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

if (!API_KEY) {
  console.error('ANTHROPIC_API_KEY not set.');
  process.exit(1);
}

const BETA_HEADER = 'skills-2025-10-02';

async function pingList() {
  const res = await fetch('https://api.anthropic.com/v1/skills?limit=5', {
    method: 'GET',
    headers: {
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': BETA_HEADER,
    },
  });
  const status = res.status;
  let body;
  try {
    body = await res.json();
  } catch {
    body = { error: 'non-JSON response' };
  }
  return { status, body };
}

function summariseShape(body) {
  if (!body || typeof body !== 'object') return 'empty or non-object body';
  const keys = Object.keys(body).sort();
  const shape = keys.map((k) => {
    const v = body[k];
    const t = Array.isArray(v) ? `array(${v.length})` : typeof v;
    return `${k}: ${t}`;
  });
  return shape.join(', ');
}

function detectsTeamsScope(body) {
  const json = JSON.stringify(body).toLowerCase();
  return /team|organization|org[_-]panel|workspace/.test(json);
}

async function postSlack(text) {
  if (!SLACK_WEBHOOK_URL) return;
  await fetch(SLACK_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-type': 'application/json' },
    body: JSON.stringify({
      text: 'v1/skills API monthly check',
      blocks: [
        { type: 'header', text: { type: 'plain_text', text: 'v1/skills API monthly check' } },
        { type: 'section', text: { type: 'mrkdwn', text: text } },
      ],
    }),
  });
}

async function main() {
  const today = new Date().toISOString().slice(0, 10);
  console.log(`v1/skills API check — ${today}`);

  const { status, body } = await pingList();
  console.log(`Status: ${status}`);
  console.log(`Response keys: ${summariseShape(body)}`);

  // Dump every skill's name + description so we can audit what's on the
  // Anthropic account. These come from /v1/skills, which is Messages-API
  // scoped — unrelated to the Claude.ai Teams Org panel. Useful to know
  // what's there though, so flag anything unexpected.
  if (Array.isArray(body?.data)) {
    console.log(`\nSkills on this Anthropic account (${body.data.length}):`);
    for (const s of body.data) {
      const id = s.id || s.name || '(no id)';
      const name = s.display_name || s.name || '(unnamed)';
      const desc = (s.description || '').slice(0, 160);
      console.log(`  · ${id} — ${name}${desc ? `\n      ${desc}` : ''}`);
    }
  }

  const teamsHint = detectsTeamsScope(body);
  const verdict =
    status === 200
      ? teamsHint
        ? 'POSSIBLE Teams scope detected — investigate! Time to test auto-provisioning.'
        : 'Reachable but no Teams/Org signal. Messages-API-scoped as expected.'
      : `Not reachable (HTTP ${status}). Beta header ${BETA_HEADER} may have changed.`;

  const skillsList = Array.isArray(body?.data)
    ? body.data.map((s) => `• \`${s.id || s.name || '(no id)'}\` — ${s.display_name || s.name || '(unnamed)'}`).join('\n')
    : '(no data array in response)';

  const lines = [
    `*Date:* ${today}`,
    `*Status:* HTTP ${status}`,
    `*Response shape:* \`${summariseShape(body)}\``,
    `*Teams scope hint:* ${teamsHint ? 'yes' : 'no'}`,
    `*Verdict:* ${verdict}`,
    `*Skills on account:*\n${skillsList}`,
  ];

  if (status !== 200) {
    lines.push(`*Raw body:* \`\`\`${JSON.stringify(body).slice(0, 500)}\`\`\``);
  }

  const message = lines.join('\n');
  console.log('\n' + message);

  if (SLACK_WEBHOOK_URL) {
    await postSlack(message);
    console.log('\nPosted to Slack.');
  } else {
    console.log('\nSLACK_WEBHOOK_URL not set — log-only run.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
