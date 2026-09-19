import { NextResponse } from 'next/server';
import { isSenatorId, SENATOR_NAMES } from '@calls/config';
import { classifyScript } from '@calls/moderation';
import { easternDateKey, nextSafeCallTime } from '@calls/scheduling';
import {
  consumeVerificationCode,
  createCallRequests,
  DuplicateCallError,
} from '@calls/store';
import type { CallRequestInput } from '@calls/types';
import { sendCallRequestConfirmation } from '@calls/email';

export const runtime = 'nodejs';

interface ScheduleBody extends CallRequestInput {
  verificationCode: string;
  consent: {
    aiCaller: boolean;
    dataDisclosure: boolean;
    transcription: boolean;
    retries: boolean;
  };
}

function invalidIdentity(body: Partial<ScheduleBody>): string | null {
  if (!body.firstName?.trim() || !body.lastName?.trim()) return 'First and last name are required.';
  if (!body.city?.trim()) return 'City is required.';
  if (!body.zipCode || !/^\d{5}(?:-\d{4})?$/.test(body.zipCode.trim())) {
    return 'Enter a valid ZIP code.';
  }
  if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())) {
    return 'Enter a valid email address.';
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<ScheduleBody>;
    const identityError = invalidIdentity(body);
    if (identityError) return NextResponse.json({ error: identityError }, { status: 400 });

    const senators = Array.from(new Set(body.senators ?? []));
    if (senators.length === 0 || !senators.every(isSenatorId)) {
      return NextResponse.json({ error: 'Select at least one senator.' }, { status: 400 });
    }

    if (!body.consent || Object.values(body.consent).some((value) => value !== true)) {
      return NextResponse.json(
        { error: 'All authorization and disclosure statements must be accepted.' },
        { status: 400 },
      );
    }

    if (!body.verificationCode || !/^\d{6}$/.test(body.verificationCode)) {
      return NextResponse.json({ error: 'Enter the six-digit verification code.' }, { status: 400 });
    }

    const verified = await consumeVerificationCode(body.email!, body.verificationCode);
    if (!verified) {
      return NextResponse.json({ error: 'The verification code is invalid or expired.' }, { status: 401 });
    }

    const moderation = classifyScript(body.script ?? '');
    const scheduledTimes: Array<Date | null> = [];
    let after = new Date();

    for (let index = 0; index < senators.length; index += 1) {
      if (moderation.status === 'pending_review') {
        scheduledTimes.push(null);
        continue;
      }
      const scheduledFor = nextSafeCallTime(after);
      scheduledTimes.push(scheduledFor);
      after = scheduledFor;
    }

    const input: CallRequestInput = {
      firstName: body.firstName!.trim(),
      lastName: body.lastName!.trim(),
      city: body.city!.trim(),
      zipCode: body.zipCode!.trim(),
      email: body.email!.trim().toLowerCase(),
      senators,
      script: body.script!.trim(),
    };
    const calls = await createCallRequests(input, {
      moderationStatus: moderation.status,
      scheduledTimes,
      authorizationDay: easternDateKey(new Date()),
    });
    let confirmationEmailSent = true;
    try {
      await sendCallRequestConfirmation(
        input.email,
        calls.map((call) => ({
          senatorName: SENATOR_NAMES[call.senator],
          scheduledFor: call.scheduledFor,
        })),
        moderation.status === 'pending_review',
      );
    } catch (emailError) {
      confirmationEmailSent = false;
      console.error('Call request was stored but its confirmation email failed:', emailError);
    }

    return NextResponse.json({
      status: moderation.status === 'auto_approved' ? 'scheduled' : 'pending_review',
      message:
        moderation.status === 'auto_approved'
          ? 'Your call request is scheduled.'
          : 'Your script was sent for review. You will receive an email within 24 hours.',
      confirmationEmailSent,
      calls: calls.map((call) => ({
        id: call.id,
        senator: call.senator,
        senatorName: SENATOR_NAMES[call.senator],
        scheduledFor: call.scheduledFor?.toISOString() ?? null,
      })),
    });
  } catch (error) {
    if (error instanceof DuplicateCallError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof Error && error.message.startsWith('Script')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('Failed to schedule call request:', error);
    return NextResponse.json({ error: 'Could not schedule the call request.' }, { status: 500 });
  }
}
