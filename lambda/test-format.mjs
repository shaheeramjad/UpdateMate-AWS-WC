import assert from 'node:assert/strict';
import { cpSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
cpSync(join(here, '..', 'formatter.js'), join(here, 'formatter.js'));

const { formatUpdate, handler } = await import('./index.mjs');

const notes = 'Fixed login bug\nReviewed two pull requests\nStarted learning AWS Lambda\nBlocked by database issue';

assert.equal(
  formatUpdate(notes),
  'This week, I fixed a login bug, reviewed two pull requests, and started learning AWS Lambda. I am currently blocked by a database issue.'
);
assert.equal(
  formatUpdate('Reviewed docs\nWaiting on design approval', 'short'),
  'This week: Reviewed docs.\nBlocker: Design approval.'
);
assert.equal(
  formatUpdate(notes, 'short'),
  'This week: Fixed a login bug, reviewed two pull requests, and started learning AWS Lambda.\nBlocker: A database issue.'
);
assert.equal(formatUpdate('Deployed the site', 'casual'), 'Quick update: I deployed the site.');
assert.equal(
  formatUpdate(notes, 'slack'),
  '*This week*\n• Fixed a login bug\n• Reviewed two pull requests\n• Started learning AWS Lambda\n\n*Blocker*\n• A database issue'
);
assert.equal(formatUpdate('Blocked by an open incident'), 'I am currently blocked by an open incident.');
assert.equal(formatUpdate('Fixed login bugs'), 'This week, I fixed login bugs.');

const consoleTest = await handler({ notes: 'Fixed login bug', tone: 'professional' });
assert.equal(consoleTest.statusCode, 200);
assert.equal(JSON.parse(consoleTest.body).update, 'This week, I fixed a login bug.');

const slackTest = await handler({
  body: JSON.stringify({ notes: 'Merged the pull request', tone: 'slack' })
});
assert.equal(slackTest.statusCode, 200);
assert.equal(JSON.parse(slackTest.body).update, '*This week*\n• Merged the pull request');

const invalid = await handler({ notes: 'ok', tone: 'poetic' });
assert.equal(invalid.statusCode, 400);

console.log('Formatting tests passed.');
