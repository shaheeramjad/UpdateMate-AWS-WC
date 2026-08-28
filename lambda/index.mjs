// CORS is configured on the Lambda Function URL. Do not add CORS headers here:
// Function URLs append them automatically, and duplicate headers break browsers.
import { TONES, formatUpdate } from './formatter.js';

const RESPONSE_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8'
};

export { formatUpdate };

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
    if (!TONES.includes(tone)) throw new Error('Choose a valid tone.');
    return { statusCode: 200, headers: RESPONSE_HEADERS, body: JSON.stringify({ update: formatUpdate(notes, tone) }) };
  } catch (error) {
    return { statusCode: 400, headers: RESPONSE_HEADERS, body: JSON.stringify({ error: error.message || 'Invalid request.' }) };
  }
}
