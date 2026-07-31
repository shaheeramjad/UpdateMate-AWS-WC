import assert from 'node:assert/strict';
import { formatUpdate, handler } from './index.mjs';

const notes = 'Fixed login bug\nReviewed two pull requests\nStarted learning AWS Lambda\nBlocked by database issue';
assert.equal(
  formatUpdate(notes),
  'This week, I fixed login bug, reviewed two pull requests, and started learning AWS Lambda. I am currently blocked by database issue.'
);
assert.equal(formatUpdate('Reviewed docs\nWaiting on design approval', 'short'), 'This week: Reviewed docs.\nBlocker: Design approval.');
assert.equal(formatUpdate('Deployed the site', 'casual'), 'Quick update: I deployed the site.');

const consoleTest = await handler({ notes: 'Fixed login bug', tone: 'professional' });
assert.equal(consoleTest.statusCode, 200);
assert.equal(JSON.parse(consoleTest.body).update, 'This week, I fixed login bug.');
console.log('Formatting tests passed.');
