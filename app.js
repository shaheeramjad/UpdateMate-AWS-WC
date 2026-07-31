const notes = document.querySelector('#notes');
const count = document.querySelector('#count');
const generateButton = document.querySelector('#generate-button');
const exampleButton = document.querySelector('#example-button');
const result = document.querySelector('#result');
const copyButton = document.querySelector('#copy-button');
const error = document.querySelector('#error');

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

function showResult(update) {
  result.classList.remove('empty');
  result.textContent = update;
  copyButton.disabled = false;
}

async function generateUpdate() {
  const rawNotes = notes.value.trim();
  if (!rawNotes) {
    setError('Add at least one note before generating your update.');
    notes.focus();
    return;
  }
  if (!window.UPDATEMATE_API_URL) {
    setError('Add your Lambda Function URL to app-config.js before deploying this app.');
    return;
  }

  setError();
  generateButton.disabled = true;
  generateButton.querySelector('span').textContent = 'Generating…';
  try {
    const response = await fetch(window.UPDATEMATE_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: rawNotes, tone: selectedTone() })
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || 'The update could not be generated. Please try again.');
    showResult(body.update);
  } catch (requestError) {
    setError(requestError.message || 'Could not reach the update service. Check the Function URL and try again.');
  } finally {
    generateButton.disabled = false;
    generateButton.querySelector('span').textContent = 'Generate update';
  }
}

notes.addEventListener('input', updateCount);
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
