import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { SENATOR_NAMES } from '@calls/config';
import { sendCallCompletedEmail, sendCallFailedEmail } from '@calls/email';
import { findCallByProviderId, pauseSenatorQueue, updateCallRequest } from '@calls/store';
import type { DeliveryOutcome, StoredCallRequest } from '@calls/types';
import { retryOrFailCall } from '@calls/workflow';

export const runtime = 'nodejs';

interface VapiToolCall {
  id?: string;
  name?: string;
  parameters?: unknown;
  function?: { name?: string; arguments?: string | Record<string, unknown> };
}

interface VapiMessage {
  type?: string;
  status?: string;
  endedReason?: string;
  call?: { id?: string; cost?: number };
  artifact?: { transcript?: string };
  toolCallList?: VapiToolCall[];
  toolWithToolCallList?: Array<{ name?: string; toolCall?: VapiToolCall }>;
}

function authorized(request: Request): boolean {
  const expected = process.env.VAPI_WEBHOOK_BEARER_TOKEN;
  const received = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!expected || !received || expected.length !== received.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(received));
}

function parametersOf(toolCall: VapiToolCall): Record<string, unknown> {
  const raw = toolCall.parameters ?? toolCall.function?.arguments ?? {};
  if (typeof raw === 'string') {
    try { return JSON.parse(raw) as Record<string, unknown>; } catch { return {}; }
  }
  return raw && typeof raw === 'object' ? raw as Record<string, unknown> : {};
}

function isOutcome(value: unknown): value is DeliveryOutcome {
  return ['live', 'receptionist', 'consent_declined', 'failed'].includes(String(value));
}

async function handleOutcomeTool(message: VapiMessage, call: StoredCallRequest) {
  const calls = message.toolCallList ?? message.toolWithToolCallList?.map((item) => ({
    ...item.toolCall,
    name: item.name ?? item.toolCall?.name,
  })) ?? [];
  const results = [];

  for (const toolCall of calls) {
    const name = toolCall.name ?? toolCall.function?.name;
    if (name !== 'record_call_outcome') continue;
    const parameters = parametersOf(toolCall);
    const outcome = isOutcome(parameters.outcome) ? parameters.outcome : 'failed';
    const officeStopRequested = parameters.officeStopRequested === true;
    await updateCallRequest(call.id, {
      reportedOutcome: outcome,
      summary: typeof parameters.summary === 'string' ? parameters.summary.slice(0, 500) : undefined,
      staffFollowUp: typeof parameters.staffFollowUp === 'string' ? parameters.staffFollowUp.slice(0, 500) : undefined,
      transcriptionConsentGranted: parameters.transcriptionConsentGranted === true,
      officeStopRequested,
    });
    if (officeStopRequested) {
      await pauseSenatorQueue(call.senator, 'Senate staff requested that automated calls stop.');
    }
    results.push({
      name: 'record_call_outcome',
      toolCallId: toolCall.id,
      result: JSON.stringify({ recorded: true }),
    });
  }
  return NextResponse.json({ results });
}

async function notifyWithoutBreakingWebhook(task: Promise<void>): Promise<void> {
  try { await task; } catch (error) { console.error('Call outcome email failed:', error); }
}

async function handleEndReport(message: VapiMessage, call: StoredCallRequest) {
  if (call.status !== 'dialing') return NextResponse.json({ received: true, duplicate: true });
  const now = new Date();
  const endedReason = message.endedReason || 'unknown';
  const transcript = message.artifact?.transcript?.slice(0, 100_000);
  const actualCostUsd = typeof message.call?.cost === 'number' ? message.call.cost : undefined;

  if (['customer-busy', 'customer-did-not-answer'].includes(endedReason)) {
    await updateCallRequest(call.id, { transcript, actualCostUsd });
    await notifyWithoutBreakingWebhook(retryOrFailCall(call, endedReason, now).then(() => undefined));
    return NextResponse.json({ received: true, outcome: 'retry_or_failed' });
  }

  const latest = await findCallByProviderId(message.call?.id ?? '') ?? call;
  const outcome: DeliveryOutcome = endedReason === 'voicemail'
    ? 'voicemail'
    : latest.reportedOutcome ?? 'failed';

  if (outcome === 'failed') {
    await updateCallRequest(call.id, {
      status: 'failed', reportedOutcome: 'failed', endedReason, transcript, actualCostUsd, completedAt: now,
    });
    await notifyWithoutBreakingWebhook(sendCallFailedEmail(call.email, SENATOR_NAMES[call.senator], call.attempts));
    return NextResponse.json({ received: true, outcome: 'failed' });
  }

  const status = outcome === 'voicemail'
    ? 'delivered_voicemail'
    : outcome === 'receptionist'
      ? 'delivered_receptionist'
      : outcome === 'live'
        ? 'delivered_live'
        : 'consent_declined';
  await updateCallRequest(call.id, {
    status,
    reportedOutcome: outcome,
    endedReason,
    transcript,
    actualCostUsd,
    completedAt: now,
  });
  await notifyWithoutBreakingWebhook(sendCallCompletedEmail(
    call.email,
    SENATOR_NAMES[call.senator],
    outcome,
    now,
    latest.summary,
    latest.staffFollowUp,
  ));
  return NextResponse.json({ received: true, outcome });
}

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const body = await request.json() as { message?: VapiMessage };
  const message = body.message;
  const providerCallId = message?.call?.id;
  if (!message?.type || !providerCallId) {
    return NextResponse.json({ error: 'Invalid Vapi event.' }, { status: 400 });
  }
  const call = await findCallByProviderId(providerCallId);
  if (!call) return NextResponse.json({ received: true, ignored: 'unknown_call' });

  if (message.type === 'tool-calls') return handleOutcomeTool(message, call);
  if (message.type === 'end-of-call-report') return handleEndReport(message, call);
  return NextResponse.json({ received: true });
}
