import { DEFAULT_CALL_SCRIPT, MAX_SCRIPT_WORDS } from './config';

export type ModerationStatus = 'auto_approved' | 'pending_review';

export interface ModerationResult {
  status: ModerationStatus;
  wordCount: number;
  similarity: number;
}

export function countWords(value: string): number {
  return value.trim() ? value.trim().split(/\s+/).length : 0;
}

function words(value: string): Set<string> {
  return new Set(
    value
      .toLowerCase()
      .replace(/[^a-z0-9'\s]/g, ' ')
      .split(/\s+/)
      .filter(Boolean),
  );
}

export function scriptSimilarity(script: string): number {
  const expected = words(DEFAULT_CALL_SCRIPT);
  const received = words(script);
  const union = new Set(Array.from(expected).concat(Array.from(received)));
  const intersection = Array.from(expected).filter((word) => received.has(word));

  return union.size === 0 ? 1 : intersection.length / union.size;
}

export function classifyScript(script: string): ModerationResult {
  const wordCount = countWords(script);

  if (wordCount === 0) {
    throw new Error('Script is required.');
  }

  if (wordCount > MAX_SCRIPT_WORDS) {
    throw new Error(`Script must be ${MAX_SCRIPT_WORDS} words or fewer.`);
  }

  const similarity = scriptSimilarity(script);
  return {
    status: similarity >= 0.72 ? 'auto_approved' : 'pending_review',
    wordCount,
    similarity,
  };
}
