export const TONES = ['professional', 'short', 'casual', 'slack'];

const BLOCKER_PATTERN = /^(blocked(?:\s+by)?|blocker|waiting\s+(?:on|for)|awaiting|stuck(?:\s+on)?|can't\s+proceed|cannot\s+proceed)\b\s*[:\-]?\s*/i;
const BULLET_PATTERN = /^(?:[-*•]|\d+[.)])\s*/;
const DETERMINER = /^(a|an|the|my|our|their|its|this|that|these|those|some|any|no|each|every|several|both|few|many|more|most|\d+|one|two|three|four|five|six|seven|eight|nine|ten)\b/i;
const ACTION_VERBS = /^(fixed|fix|closed|resolved|shipped|deployed|built|added|updated|removed|deleted|wrote|created|implemented|migrated|refactored|documented|reviewed|tested|merged|released|improved|finished|completed)\s+/i;
const COUNTABLE = /\b(issue|bug|error|problem|outage|incident|timeout|ticket|blocker|regression|failure|crash)\b/i;

export function cleanNote(note) {
  return note.replace(BULLET_PATTERN, '').trim().replace(/\s+/g, ' ').replace(/[.]+$/, '');
}

function sentenceCase(text) {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}

function lowerFirst(text) {
  return text ? text.charAt(0).toLowerCase() + text.slice(1) : text;
}

function looksPlural(text) {
  const last = text.trim().split(/\s+/).pop() || '';
  if (/ies$/i.test(last)) return true;
  return /s$/i.test(last) && !/(ss|us|is|as|os)$/i.test(last);
}

export function addArticle(text) {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;
  if (DETERMINER.test(trimmed)) return trimmed;
  if (looksPlural(trimmed)) return trimmed;
  if (!COUNTABLE.test(trimmed)) return trimmed;
  const word = trimmed.split(/\s+/)[0];
  return /^[aeiou]/i.test(word) ? `an ${trimmed}` : `a ${trimmed}`;
}

function polishAction(note) {
  const match = note.match(ACTION_VERBS);
  if (!match) return note;
  const verb = match[0].trimEnd();
  const rest = note.slice(match[0].length);
  return `${verb} ${addArticle(rest)}`.replace(/\s+/g, ' ');
}

export function joinItems(items) {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items.at(-1)}`;
}

function listPhrase(items) {
  if (!items.length) return '';
  return joinItems([sentenceCase(items[0]), ...items.slice(1).map(lowerFirst)]);
}

export function classifyNotes(rawNotes) {
  return rawNotes
    .split(/\r?\n/)
    .map(cleanNote)
    .filter(Boolean)
    .reduce((groups, note) => {
      const blocker = note.match(BLOCKER_PATTERN);
      if (blocker) {
        groups.blockers.push(addArticle(cleanNote(note.slice(blocker[0].length)) || 'unresolved issue'));
      } else {
        groups.progress.push(polishAction(note));
      }
      return groups;
    }, { progress: [], blockers: [] });
}

export function formatUpdate(rawNotes, tone = 'professional') {
  const { progress, blockers } = classifyNotes(rawNotes);
  if (!progress.length && !blockers.length) throw new Error('Please provide at least one usable note.');

  const progressText = listPhrase(progress);
  const blockerText = listPhrase(blockers);
  const narrativeProgress = joinItems(progress.map(lowerFirst));
  const narrativeBlockers = joinItems(blockers.map(lowerFirst));

  if (tone === 'slack') {
    const lines = [];
    if (progress.length) {
      lines.push('*This week*');
      for (const item of progress) lines.push(`• ${sentenceCase(item)}`);
    }
    if (blockers.length) {
      if (lines.length) lines.push('');
      lines.push(blockers.length === 1 ? '*Blocker*' : '*Blockers*');
      for (const item of blockers) lines.push(`• ${sentenceCase(item)}`);
    }
    return lines.join('\n');
  }

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
