import assert from 'node:assert/strict';
import test from 'node:test';
import { createAdminSession, verifyAdminSession } from './admin-auth';

test('accepts a valid administrator session and rejects a tampered signature', () => {
  const previousAdmin = process.env.CALLS_ADMIN_EMAIL;
  process.env.CALLS_ADMIN_EMAIL = 'owner@example.com';

  try {
    const session = createAdminSession('owner@example.com');
    assert.equal(verifyAdminSession(session), true);
    assert.equal(verifyAdminSession(`${session.slice(0, -1)}x`), false);
  } finally {
    if (previousAdmin === undefined) delete process.env.CALLS_ADMIN_EMAIL;
    else process.env.CALLS_ADMIN_EMAIL = previousAdmin;
  }
});
