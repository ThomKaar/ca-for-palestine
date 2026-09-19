export function productionEmailIsConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.CALLS_EMAIL_FROM);
}

async function sendEmail(to: string, subject: string, text: string): Promise<void> {
  if (process.env.NODE_ENV !== 'production') {
    console.info(`[calls] Development email: ${subject}`);
    return;
  }

  if (!productionEmailIsConfigured()) {
    throw new Error('RESEND_API_KEY and CALLS_EMAIL_FROM are required for production email.');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
      'User-Agent': 'ca-for-palestine/0.1',
    },
    body: JSON.stringify({
      from: process.env.CALLS_EMAIL_FROM,
      to: [to],
      subject,
      text,
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('Resend verification email failed:', response.status, errorBody.slice(0, 500));
    throw new Error('The verification email provider rejected the request.');
  }
}

export async function sendVerificationEmail(email: string, code: string): Promise<void> {
  if (process.env.NODE_ENV !== 'production') {
    console.info(`[calls] Development verification code: ${code}`);
    return;
  }

  await sendEmail(
    email,
    'Your CA for Palestine verification code',
    `Your verification code is ${code}. It expires in 10 minutes.\n\nIf you did not request this code, you can ignore this email.`,
  );
}

interface ScheduledEmailCall {
  senatorName: string;
  scheduledFor: Date | null;
}

export async function sendCallRequestConfirmation(
  email: string,
  calls: ScheduledEmailCall[],
  pendingReview: boolean,
): Promise<void> {
  const details = calls
    .map((call) => {
      if (!call.scheduledFor) return `- ${call.senatorName}: pending script review`;
      return `- ${call.senatorName}: ${call.scheduledFor.toLocaleString('en-US', {
        timeZone: 'America/New_York',
        dateStyle: 'full',
        timeStyle: 'short',
      })} Eastern`;
    })
    .join('\n');

  await sendEmail(
    email,
    pendingReview ? 'Your call request is awaiting review' : 'Your advocacy call is scheduled',
    pendingReview
      ? `Your customized script was sent for review. You can expect a decision within 24 hours.\n\n${details}`
      : `Your constituent-authorized AI call has been added to the queue.\n\n${details}\n\nWe will email you if the time changes and after each call is delivered or exhausts its attempts.`,
  );
}

export async function sendModerationDecisionEmail(
  email: string,
  senatorName: string,
  action: 'approve' | 'reject' | 'cancel',
  scheduledFor: Date | null,
): Promise<void> {
  const subject = action === 'approve'
    ? `Your call to ${senatorName} was approved`
    : `Update about your call to ${senatorName}`;
  const text = action === 'approve' && scheduledFor
    ? `Your script was approved. The call is scheduled for ${scheduledFor.toLocaleString('en-US', {
        timeZone: 'America/New_York',
        dateStyle: 'full',
        timeStyle: 'short',
      })} Eastern.`
    : action === 'reject'
      ? 'Your customized script was not approved. To try again, please create a new submission using the vetted campaign script.'
      : 'This call request was canceled by the campaign administrator.';

  await sendEmail(email, subject, text);
}

export async function sendRetryScheduledEmail(
  email: string,
  senatorName: string,
  scheduledFor: Date,
  attempt: number,
): Promise<void> {
  await sendEmail(
    email,
    `Your call to ${senatorName} has a new time`,
    `Attempt ${attempt} did not connect. The call was moved to ${scheduledFor.toLocaleString('en-US', {
      timeZone: 'America/New_York',
      dateStyle: 'full',
      timeStyle: 'short',
    })} Eastern. We will try no more than three times within the two-business-day window.`,
  );
}

export async function sendCallCompletedEmail(
  email: string,
  senatorName: string,
  outcome: 'live' | 'receptionist' | 'voicemail' | 'consent_declined',
  completedAt: Date,
  summary?: string,
  staffFollowUp?: string,
): Promise<void> {
  const delivered = outcome !== 'consent_declined';
  await sendEmail(
    email,
    delivered ? `Your call to ${senatorName} was delivered` : `Update about your call to ${senatorName}`,
    [
      delivered
        ? `Your AI advocacy call was delivered by ${outcome} at ${completedAt.toLocaleString('en-US', { timeZone: 'America/New_York', dateStyle: 'full', timeStyle: 'short' })} Eastern.`
        : 'The office did not consent to continue with an AI-transcribed call. We will not retry this call; personal follow-up is required.',
      summary ? `Summary: ${summary}` : '',
      staffFollowUp ? `Staff requested personal follow-up: ${staffFollowUp}` : '',
      'The transcript is retained for 30 days. Protected transcript delivery will be enabled before live launch.',
    ].filter(Boolean).join('\n\n'),
  );
}

export async function sendCallFailedEmail(
  email: string,
  senatorName: string,
  attempts: number,
): Promise<void> {
  await sendEmail(
    email,
    `Your call to ${senatorName} could not be delivered`,
    `The AI call could not be delivered after ${attempts} attempt${attempts === 1 ? '' : 's'} within the safe calling window. No more attempts will be made for this authorization.`,
  );
}
