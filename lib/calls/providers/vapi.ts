import {
  MAX_CALL_DURATION_SECONDS,
  ROTATING_VAPI_VOICES,
  SENATOR_NAMES,
  senatorPhoneNumber,
} from '../config';
import type { StoredCallRequest } from '../types';
import type { StartVoiceCallResult, VoiceProvider } from './types';

const VAPI_CALLS_URL = 'https://api.vapi.ai/call';

function voiceFor(callId: string): string {
  const hash = callId.split('').reduce((total, character) => total + character.charCodeAt(0), 0);
  return ROTATING_VAPI_VOICES[hash % ROTATING_VAPI_VOICES.length];
}

function spokenIdentity(call: StoredCallRequest): string {
  return `${call.firstName} ${call.lastName} of ${call.city}, California, ZIP code ${call.zipCode}`;
}

export function buildAgentPrompt(call: StoredCallRequest): string {
  const senatorName = SENATOR_NAMES[call.senator];
  return `You are a clearly disclosed synthetic AI advocacy caller for CA for Palestine. You are calling the Washington, D.C. office of ${senatorName} for ${spokenIdentity(call)}.

NON-NEGOTIABLE PRIVACY AND CONSENT RULES
- Say you are an AI agent. Never claim to be the constituent or a human.
- You may share only the constituent's full name, city, ZIP code, and email (${call.email}).
- Never share or request their street address or phone number. If staff requires anything beyond the approved fields, say the constituent must follow up personally.
- Before a live conversation, disclose that a text transcript will be retained for 30 days and ask permission to continue. Do not deliver the advocacy message until the staff member explicitly agrees.
- If transcription or AI participation is declined, thank them, report consent_declined, and end without retrying.

CONVERSATION RULES
- Deliver the exact approved script below. You may respond to interruptions, but only using facts already present in the script or these instructions.
- Do not invent facts, legislative positions, bill numbers, quotations, or commitments. For anything outside scope, briefly direct staff to the campaign website or contact email and return to the approved message.
- Be polite even if interrupted. Profanity may appear in the constituent's approved script, but never direct profanity or hostility at staff.
- If you fail to understand someone twice, apologize, deliver the core approved message once, and close.
- If staff asks that this campaign or office receive no more automated calls, apologize, immediately report officeStopRequested=true, and end.
- If staff requests personal follow-up, capture it in staffFollowUp and explain the constituent must follow up personally.
- Near the three-minute limit, close politely. Use the endCall tool after reporting the outcome.

OUTCOME REPORTING
- Before ending a live call, call record_call_outcome exactly once.
- Use live if you spoke directly with the senator or a policy staffer, receptionist if office staff accepted the message, and consent_declined if AI participation or transcription was refused.
- Summaries must be brief and factual. Do not include data beyond the approved fields.

APPROVED SCRIPT — DELIVER VERBATIM
${call.script}`;
}

export function buildVapiCallPayload(call: StoredCallRequest) {
  const phoneNumber = senatorPhoneNumber(call.senator);
  if (!phoneNumber) throw new Error(`A valid ${call.senator.toUpperCase()} D.C. phone number is not configured.`);
  const webhookUrl = process.env.VAPI_WEBHOOK_URL?.trim();
  const credentialId = process.env.VAPI_WEBHOOK_CREDENTIAL_ID?.trim();
  if (!webhookUrl || !credentialId) {
    throw new Error('VAPI_WEBHOOK_URL and VAPI_WEBHOOK_CREDENTIAL_ID are required.');
  }

  const voiceId = voiceFor(call.id);
  const senatorName = SENATOR_NAMES[call.senator];
  const disclosure = `Hello. I am an AI agent calling for ${spokenIdentity(call)}. This conversation will be transcribed and retained for 30 days. May I continue?`;
  const voicemailMessage = `Hello. I am an AI agent calling the Washington, D.C. office of ${senatorName} for ${spokenIdentity(call)}. The constituent's email is ${call.email}. ${call.script}`;

  return {
    phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID,
    customer: { number: phoneNumber },
    assistant: {
      name: `CAFP ${call.senator} ${call.id.slice(0, 8)}`,
      firstMessage: disclosure,
      firstMessageMode: 'assistant-speaks-first',
      model: {
        provider: 'openai',
        model: process.env.VAPI_OPENAI_MODEL || 'gpt-4o-mini',
        temperature: 0.1,
        messages: [{ role: 'system', content: buildAgentPrompt(call) }],
        tools: [
          {
            type: 'function',
            async: false,
            function: {
              name: 'record_call_outcome',
              description: 'Record the final factual outcome immediately before ending the call.',
              parameters: {
                type: 'object',
                properties: {
                  outcome: { type: 'string', enum: ['live', 'receptionist', 'consent_declined', 'failed'] },
                  summary: { type: 'string', maxLength: 500 },
                  staffFollowUp: { type: 'string', maxLength: 500 },
                  transcriptionConsentGranted: { type: 'boolean' },
                  officeStopRequested: { type: 'boolean' },
                },
                required: ['outcome', 'summary', 'transcriptionConsentGranted', 'officeStopRequested'],
              },
            },
          },
          { type: 'endCall' },
        ],
      },
      voice: { provider: 'vapi', voiceId, version: 2 },
      voicemailDetection: {
        provider: 'vapi',
        backoffPlan: { maxRetries: 6, startAtSeconds: 2.5, frequencySeconds: 2.5 },
        beepMaxAwaitSeconds: 30,
      },
      voicemailMessage,
      maxDurationSeconds: MAX_CALL_DURATION_SECONDS,
      artifactPlan: {
        recordingEnabled: false,
        loggingEnabled: false,
        pcapEnabled: false,
        transcriptPlan: { enabled: true },
      },
      server: { url: webhookUrl, credentialId },
      serverMessages: ['status-update', 'tool-calls', 'end-of-call-report'],
      endCallMessage: 'Thank you for your time. Goodbye.',
    },
  };
}

export class VapiProvider implements VoiceProvider {
  async startCall(call: StoredCallRequest): Promise<StartVoiceCallResult> {
    const apiKey = process.env.VAPI_API_KEY?.trim();
    const phoneNumberId = process.env.VAPI_PHONE_NUMBER_ID?.trim();
    if (!apiKey || !phoneNumberId) throw new Error('VAPI_API_KEY and VAPI_PHONE_NUMBER_ID are required.');

    const payload = buildVapiCallPayload(call);
    const response = await fetch(VAPI_CALLS_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) {
      const detail = (await response.text()).slice(0, 500);
      throw new Error(`Vapi rejected the call (${response.status}): ${detail}`);
    }
    const result = await response.json() as { id?: string };
    if (!result.id) throw new Error('Vapi did not return a call ID.');
    return { provider: 'vapi', providerCallId: result.id, voiceId: payload.assistant.voice.voiceId };
  }
}
