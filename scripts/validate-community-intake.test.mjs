import assert from 'node:assert/strict';
import test from 'node:test';

import { validateIntakeRows } from './validate-community-intake.mjs';

test('validateIntakeRows accepts a complete community skill intake row', () => {
  const errors = validateIntakeRows([
    {
      name: 'example-community-skill',
      source_url: 'https://github.com/example/repo/tree/main/skills/example-community-skill',
      license: 'MIT',
      status: 'reviewing',
      owner: 'Ben',
      reviewed_on: '2026-05-12',
      decision: 'sandbox',
    },
  ]);

  assert.deepEqual(errors, []);
});

test('validateIntakeRows reports required fields and enum violations', () => {
  const errors = validateIntakeRows([
    {
      name: 'bad-community-skill',
      source_url: 'not-a-url',
      license: '',
      status: 'approved',
      owner: '',
      reviewed_on: '05/12/2026',
      decision: 'maybe',
    },
  ]);

  assert.deepEqual(errors, [
    'bad-community-skill: source_url must be a valid http(s) URL',
    "bad-community-skill: missing required field 'license'",
    "bad-community-skill: status 'approved' must be one of discovered, reviewing, sandboxed, forked, promoted, rejected",
    "bad-community-skill: missing required field 'owner'",
    "bad-community-skill: reviewed_on '05/12/2026' must be YYYY-MM-DD",
    "bad-community-skill: decision 'maybe' must be one of sandbox, fork, promote, reject, defer",
  ]);
});

test('validateIntakeRows requires the manifest to be an array', () => {
  assert.deepEqual(validateIntakeRows({}), [
    'community/intake.json: expected an array of intake rows',
  ]);
});
