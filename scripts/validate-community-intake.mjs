#!/usr/bin/env node
/**
 * Validate community skill intake rows before any imported skill is trusted.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const INTAKE_STATUSES = Object.freeze([
  'discovered',
  'reviewing',
  'sandboxed',
  'forked',
  'promoted',
  'rejected',
]);

export const INTAKE_DECISIONS = Object.freeze([
  'sandbox',
  'fork',
  'promote',
  'reject',
  'defer',
]);

const REQUIRED_FIELDS = Object.freeze([
  'name',
  'source_url',
  'license',
  'status',
  'owner',
  'reviewed_on',
  'decision',
]);

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function validateIntakeRows(rows) {
  if (!Array.isArray(rows)) {
    return ['community/intake.json: expected an array of intake rows'];
  }

  const errors = [];
  rows.forEach((row, index) => {
    if (!row || typeof row !== 'object' || Array.isArray(row)) {
      errors.push(`row ${index + 1}: row must be an object`);
      return;
    }

    const label = nonEmptyString(row.name) ? row.name.trim() : `row ${index + 1}`;
    for (const field of REQUIRED_FIELDS) {
      if (!nonEmptyString(row[field])) {
        errors.push(`${label}: missing required field '${field}'`);
        continue;
      }

      if (field === 'source_url' && !isHttpUrl(row.source_url)) {
        errors.push(`${label}: source_url must be a valid http(s) URL`);
      }

      if (field === 'status' && !INTAKE_STATUSES.includes(row.status)) {
        errors.push(
          `${label}: status '${row.status}' must be one of ${INTAKE_STATUSES.join(', ')}`
        );
      }

      if (field === 'reviewed_on' && !ISO_DATE.test(row.reviewed_on)) {
        errors.push(`${label}: reviewed_on '${row.reviewed_on}' must be YYYY-MM-DD`);
      }

      if (field === 'decision' && !INTAKE_DECISIONS.includes(row.decision)) {
        errors.push(
          `${label}: decision '${row.decision}' must be one of ${INTAKE_DECISIONS.join(', ')}`
        );
      }
    }
  });

  return errors;
}

function nonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function readManifest(manifestPath) {
  try {
    return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { __readError: message };
  }
}

function runCli() {
  const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
  const manifestPath = path.join(root, 'community', 'intake.json');
  const rows = readManifest(manifestPath);
  const errors =
    rows && typeof rows === 'object' && '__readError' in rows
      ? [`community/intake.json: ${rows.__readError}`]
      : validateIntakeRows(rows);

  if (errors.length) {
    console.error(`Community intake validation failed with ${errors.length} error${errors.length === 1 ? '' : 's'}:`);
    for (const error of errors) console.error(`  - ${error}`);
    process.exit(1);
  }

  console.log(`✓ community intake manifest valid (${rows.length} row${rows.length === 1 ? '' : 's'}).`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCli();
}
