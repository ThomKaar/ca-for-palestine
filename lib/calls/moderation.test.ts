import assert from 'node:assert/strict';
import test from 'node:test';
import { DEFAULT_CALL_SCRIPT } from './config';
import { classifyScript, countWords } from './moderation';

test('the vetted script is automatically approved', () => {
  const result = classifyScript(DEFAULT_CALL_SCRIPT);
  assert.equal(result.status, 'auto_approved');
  assert.equal(result.wordCount, countWords(DEFAULT_CALL_SCRIPT));
});

test('a substantially different script requires review', () => {
  const result = classifyScript(
    'Please ask the office to return my email and discuss an unrelated local zoning question.',
  );
  assert.equal(result.status, 'pending_review');
});

test('scripts over 250 words are rejected', () => {
  assert.throws(
    () => classifyScript(Array.from({ length: 251 }, () => 'word').join(' ')),
    /250 words or fewer/,
  );
});
