import { MAX_ATTEMPTS, SENATOR_NAMES } from './config';
import { sendCallFailedEmail, sendRetryScheduledEmail } from './email';
import { nextRetryCallTime } from './scheduling';
import { updateCallRequest } from './store';
import type { StoredCallRequest } from './types';

export async function retryOrFailCall(
  call: StoredCallRequest,
  endedReason: string,
  now = new Date(),
): Promise<'scheduled' | 'failed'> {
  const nextAttempt = nextRetryCallTime(now);
  const canRetry = call.attempts < MAX_ATTEMPTS && nextAttempt <= call.retryDeadline;

  if (canRetry) {
    await updateCallRequest(call.id, {
      status: 'scheduled',
      scheduledFor: nextAttempt,
      endedReason,
      providerCallId: undefined,
    });
    await sendRetryScheduledEmail(call.email, SENATOR_NAMES[call.senator], nextAttempt, call.attempts);
    return 'scheduled';
  }

  await updateCallRequest(call.id, {
    status: 'failed',
    endedReason,
    completedAt: now,
    reportedOutcome: 'failed',
  });
  await sendCallFailedEmail(call.email, SENATOR_NAMES[call.senator], call.attempts);
  return 'failed';
}
