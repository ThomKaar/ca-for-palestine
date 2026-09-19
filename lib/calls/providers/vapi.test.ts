import assert from 'node:assert/strict';
import test from 'node:test';
import { buildAgentPrompt, buildVapiCallPayload } from './vapi';
import type { StoredCallRequest } from '../types';

function exampleCall(): StoredCallRequest {
  const now = new Date('2026-09-08T15:00:00.000Z');
  return {
    id: 'call-example-123',
    firstName: 'Amina',
    lastName: 'Example',
    city: 'Oakland',
    zipCode: '94612',
    email: 'amina@example.com',
    senators: ['schiff'],
    senator: 'schiff',
    script: 'Please support the approved campaign request.',
    status: 'dialing',
    moderationStatus: 'auto_approved',
    scheduledFor: now,
    authorizationDay: '2026-09-08',
    createdAt: now,
    purgeAt: new Date('2026-10-08T15:00:00.000Z'),
    retryDeadline: new Date('2026-09-09T21:00:00.000Z'),
    attempts: 1,
  };
}

test('agent prompt enforces disclosure, consent, privacy, and exact script boundaries', () => {
  const prompt = buildAgentPrompt(exampleCall());
  assert.match(prompt, /synthetic AI advocacy caller/i);
  assert.match(prompt, /ask permission to continue/i);
  assert.match(prompt, /Never share or request their street address or phone number/i);
  assert.match(prompt, /APPROVED SCRIPT — DELIVER VERBATIM/);
  assert.match(prompt, /Please support the approved campaign request/);
});

test('Vapi payload disables audio artifacts and configures full voicemail delivery', () => {
  const previous = {
    phone: process.env.SCHIFF_DC_PHONE_E164,
    phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID,
    webhookUrl: process.env.VAPI_WEBHOOK_URL,
    credentialId: process.env.VAPI_WEBHOOK_CREDENTIAL_ID,
  };
  process.env.SCHIFF_DC_PHONE_E164 = '+12025550123';
  process.env.VAPI_PHONE_NUMBER_ID = 'phone-number-id';
  process.env.VAPI_WEBHOOK_URL = 'https://example.com/api/calls/webhooks/vapi';
  process.env.VAPI_WEBHOOK_CREDENTIAL_ID = 'credential-id';
  try {
    const payload = buildVapiCallPayload(exampleCall());
    assert.equal(payload.customer.number, '+12025550123');
    assert.equal(payload.assistant.maxDurationSeconds, 180);
    assert.equal(payload.assistant.artifactPlan.recordingEnabled, false);
    assert.equal(payload.assistant.artifactPlan.pcapEnabled, false);
    assert.equal(payload.assistant.artifactPlan.loggingEnabled, false);
    assert.equal(payload.assistant.artifactPlan.transcriptPlan.enabled, true);
    assert.match(payload.assistant.voicemailMessage, /Please support the approved campaign request/);
    assert.match(payload.assistant.firstMessage, /I am an AI agent/i);
  } finally {
    if (previous.phone === undefined) delete process.env.SCHIFF_DC_PHONE_E164;
    else process.env.SCHIFF_DC_PHONE_E164 = previous.phone;
    if (previous.phoneNumberId === undefined) delete process.env.VAPI_PHONE_NUMBER_ID;
    else process.env.VAPI_PHONE_NUMBER_ID = previous.phoneNumberId;
    if (previous.webhookUrl === undefined) delete process.env.VAPI_WEBHOOK_URL;
    else process.env.VAPI_WEBHOOK_URL = previous.webhookUrl;
    if (previous.credentialId === undefined) delete process.env.VAPI_WEBHOOK_CREDENTIAL_ID;
    else process.env.VAPI_WEBHOOK_CREDENTIAL_ID = previous.credentialId;
  }
});
