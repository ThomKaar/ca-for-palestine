import assert from 'node:assert/strict';
import test from 'node:test';
import { isSafeCallTime, nextSafeCallTime } from './scheduling';

test('accepts weekday D.C. office hours', () => {
  assert.equal(isSafeCallTime(new Date('2026-09-04T14:00:00.000Z')), true);
});

test('rejects weekends and federal holidays', () => {
  assert.equal(isSafeCallTime(new Date('2026-09-05T14:00:00.000Z')), false);
  assert.equal(isSafeCallTime(new Date('2026-09-07T14:00:00.000Z')), false);
});

test('moves an after-hours Friday past Labor Day', () => {
  const result = nextSafeCallTime(new Date('2026-09-04T21:30:00.000Z'));
  assert.equal(result.toISOString(), '2026-09-08T13:00:00.000Z');
});
