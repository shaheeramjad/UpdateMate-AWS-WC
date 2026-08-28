import { formatUpdate } from './formatter.js';

const notes = document.querySelector('#notes');
const count = document.querySelector('#count');
const generateButton = document.querySelector('#generate-button');
const exampleButton = document.querySelector('#example-button');
const result = document.querySelector('#result');
const copyButton = document.querySelector('#copy-button');
const error = document.querySelector('#error');
const source = document.querySelector('#source');
const historyList = document.querySelector('#history-list');
const historyEmpty = document.querySelector('#history-empty');

const HISTORY_KEY = 'updatemate-history-v1';
const example = `Fixed login bug\nReviewed two pull requests\nStarted learning AWS Lambda\nBlocked by database issue`;

function selectedTone() {
  return document.querySelector('input[name="tone"]:checked').value;
}

function setError(message = '') {
  error.hidden = !message;
  error.textContent = message;
}

function updateCount() {
  count.textContent = `${notes.value.length} / 5000`;
}

function showResult(update, origin) {
  result.classList.remove('empty');
  result.textContent = update;
  copyButton.disabled = false;
  source.hidden = false;
  source.textContent = origin === 'lambda'
    ? 'Formatted by AWS Lambda'
    : 'Formatted on this device · same rules as Lambda';
}

function readHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  } catch {
    return [];
  }
}

function renderHistory() {
  const items = readHistory();
  historyList.replaceChildren();
  if (!items.length) {
    historyList.hidden = true;
    historyEmpty.hidden = false;
    return;
  }
  historyEmpty.hidden = true;
  historyList.hidden = false;
  for (const item of items) {
    const li = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'history-item';
    const tone = document.createElement('b');
    tone.textContent = item.tone;
    const preview = document.createElement('span');
    preview.textContent = item.update.replace(/\s+/g, ' ').slice(0, 92);
    button.append(tone, preview);
    button.addEventListener('click', () => {
      notes.value = item.notes;
      const toneInput = document.querySelector(`input[name="tone"][value="${item.tone}"]`);
      if (toneInput) toneInput.checked = true;
      updateCount();
      showResult(item.update, 'local');
      notes.focus();
    });
    li.append(button);
    historyList.append(li);
  }
}

function saveHistory(rawNotes, tone, update) {
  const items = readHistory().filter((item) => item.update !== update);
  items.unshift({ notes: rawNotes, tone, update, at: Date.now() });
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 5)));
  renderHistory();
}

async function generateFromLambda(rawNotes, tone) {
  const response = await fetch(window.UPDATEMATE_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes: rawNotes, tone })
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || 'The update could not be generated. Please try again.');
  if (typeof body.update !== 'string') throw new Error('The update service returned an empty result.');
  return body.update;
}

async function generateUpdate() {
  const rawNotes = notes.value.trim();
  if (!rawNotes) {
    setError('Add at least one note before generating your update.');
    notes.focus();
    return;
  }

  const tone = selectedTone();
  let localUpdate;
  try {
    localUpdate = formatUpdate(rawNotes, tone);
  } catch (formatError) {
    setError(formatError.message);
    return;
  }

  setError();
  generateButton.disabled = true;
  generateButton.querySelector('span').textContent = 'Generating…';
  try {
    if (!window.UPDATEMATE_API_URL) {
      showResult(localUpdate, 'local');
      saveHistory(rawNotes, tone, localUpdate);
      return;
    }
    try {
      const remoteUpdate = await generateFromLambda(rawNotes, tone);
      showResult(remoteUpdate, 'lambda');
      saveHistory(rawNotes, tone, remoteUpdate);
    } catch {
      showResult(localUpdate, 'local');
      saveHistory(rawNotes, tone, localUpdate);
    }
  } finally {
    generateButton.disabled = false;
    generateButton.querySelector('span').textContent = 'Generate update';
  }
}

notes.addEventListener('input', updateCount);
notes.addEventListener('keydown', (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    event.preventDefault();
    generateUpdate();
  }
});
exampleButton.addEventListener('click', () => { notes.value = example; updateCount(); notes.focus(); });
generateButton.addEventListener('click', generateUpdate);
copyButton.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(result.textContent);
    copyButton.querySelector('span').textContent = 'Copied!';
    setTimeout(() => { copyButton.querySelector('span').textContent = 'Copy update'; }, 1600);
  } catch {
    setError('Copy was blocked by this browser. Select the text above and copy it manually.');
  }
});
renderHistory();
