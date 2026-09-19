import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { estimatedCallReservationUsd, SENATOR_NAMES } from '@calls/config';
import { sendRetryScheduledEmail } from '@calls/email';
import { liveVoiceCallsEnabled, voiceProvider } from '@calls/providers';
import { easternDateKey, nextSafeCallTime } from '@calls/scheduling';
import {
  claimNextDueCall,
  refundDailyBudget,
  releaseClaimForBudget,
  reserveDailyBudget,
  updateCallRequest,
} from '@calls/store';
import { retryOrFailCall } from '@calls/workflow';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function authorized(request: Request): boolean {
  const expected = process.env.CALLS_WORKER_SECRET;
  const received = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!expected || !received || expected.length !== received.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(received));
}

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  if (!liveVoiceCallsEnabled()) {
    return NextResponse.json({ error: 'Live voice calls are disabled.' }, { status: 503 });
  }

  const now = new Date();
  const call = await claimNextDueCall(now);
  if (!call) return NextResponse.json({ status: 'idle' });
  const reservation = estimatedCallReservationUsd();
  const dayKey = easternDateKey(now);

  if (!(await reserveDailyBudget(dayKey, reservation))) {
    const rescheduledFor = nextSafeCallTime(new Date(now.getTime() + 16 * 60 * 60_000));
    await releaseClaimForBudget(call.id, rescheduledFor);
    await sendRetryScheduledEmail(call.email, SENATOR_NAMES[call.senator], rescheduledFor, call.attempts);
    return NextResponse.json({ status: 'budget_deferred', callId: call.id, rescheduledFor });
  }

  try {
    const started = await voiceProvider().startCall(call);
    await updateCallRequest(call.id, {
      provider: started.provider,
      providerCallId: started.providerCallId,
      voiceId: started.voiceId,
      reservedCostUsd: (call.reservedCostUsd ?? 0) + reservation,
    });
    return NextResponse.json({ status: 'dialing', callId: call.id, providerCallId: started.providerCallId });
  } catch (error) {
    await refundDailyBudget(dayKey, reservation);
    const reason = error instanceof Error ? `provider-start-failed: ${error.message}` : 'provider-start-failed';
    await retryOrFailCall(call, reason, now);
    console.error('Voice provider failed to start call:', error);
    return NextResponse.json({ error: 'Provider could not start the call.' }, { status: 502 });
  }
}
