// CORS is configured on the Lambda Function URL. Do not add CORS headers here:
// Function URLs append them automatically, and duplicate headers break browsers.
const RESPONSE_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8'
};

const BLOCKER_PATTERN = /^(blocked(?:\s+by)?|blocker|waiting\s+(?:on|for)|awaiting|stuck(?:\s+on)?|can't\s+proceed|cannot\s+proceed)\b\s*[:\-]?\s*/i;
const BULLET_PATTERN = /^(?:[-*•]|\d+[.)])\s*/;

function cleanNote(note) {
  return note.replace(BULLET_PATTERN, '').trim().replace(/\s+/g, ' ').replace(/[.]+$/, '');
}

function sentenceCase(text) {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}

function lowerFirst(text) {
  return text ? text.charAt(0).toLowerCase() + text.slice(1) : text;
}

function joinItems(items) {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items.at(-1)}`;
}

function classifyNotes(rawNotes) {
  return rawNotes
    .split(/\r?\n/)
    .map(cleanNote)
    .filter(Boolean)
    .reduce((groups, note) => {
      const blocker = note.match(BLOCKER_PATTERN);
      if (blocker) groups.blockers.push(cleanNote(note.slice(blocker[0].length)) || 'an unresolved issue');
      else groups.progress.push(note);
      return groups;
    }, { progress: [], blockers: [] });
}

export function formatUpdate(rawNotes, tone = 'professional') {
  const { progress, blockers } = classifyNotes(rawNotes);
  if (!progress.length && !blockers.length) throw new Error('Please provide at least one usable note.');

  const progressText = joinItems(progress.map(sentenceCase));
  const blockerText = joinItems(blockers.map(sentenceCase));
  const narrativeProgress = joinItems(progress.map(lowerFirst));
  const narrativeBlockers = joinItems(blockers.map(lowerFirst));

  if (tone === 'short') {
    const lines = [];
    if (progressText) lines.push(`This week: ${progressText}.`);
    if (blockerText) lines.push(`Blocker: ${blockerText}.`);
    return lines.join('\n');
  }
  if (tone === 'casual') {
    const lines = [];
    if (narrativeProgress) lines.push(`Quick update: I ${narrativeProgress}.`);
    if (narrativeBlockers) lines.push(`The main thing holding me up is ${narrativeBlockers}.`);
    return lines.join(' ');
  }

  const lines = [];
  if (narrativeProgress) lines.push(`This week, I ${narrativeProgress}.`);
  if (narrativeBlockers) lines.push(`I am currently blocked by ${narrativeBlockers}.`);
  return lines.join(' ');
}

export async function handler(event) {
  if (event.requestContext?.http?.method === 'OPTIONS') {
    return { statusCode: 204, headers: RESPONSE_HEADERS, body: '' };
  }
  try {
    // Function URLs provide a JSON string in event.body. The Lambda console's
    // Test tab passes the sample event directly, so supporting both makes local
    // and console testing straightforward.
    const payload = typeof event.body === 'string'
      ? JSON.parse(event.body || '{}')
      : (event.body || event);
    const { notes, tone = 'professional' } = payload;
    if (typeof notes !== 'string' || notes.length > 5000) throw new Error('Notes must be a text field of 5,000 characters or fewer.');
    if (!['professional', 'short', 'casual'].includes(tone)) throw new Error('Choose a valid tone.');
    return { statusCode: 200, headers: RESPONSE_HEADERS, body: JSON.stringify({ update: formatUpdate(notes, tone) }) };
  } catch (error) {
    return { statusCode: 400, headers: RESPONSE_HEADERS, body: JSON.stringify({ error: error.message || 'Invalid request.' }) };
  }
}
