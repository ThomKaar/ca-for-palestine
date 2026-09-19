import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from '@calls/admin-auth';
import { listCallRequests, updateCallRequest } from '@calls/store';
import { nextSafeCallTime } from '@calls/scheduling';
import { SENATOR_NAMES } from '@calls/config';
import { sendModerationDecisionEmail } from '@calls/email';

export const runtime = 'nodejs';

async function authorized(): Promise<boolean> {
  const cookieStore = await cookies();
  return verifyAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
}

export async function GET() {
  try {
    if (!(await authorized())) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }
    const calls = await listCallRequests();
    return NextResponse.json({
      calls: calls.map((call) => ({
        ...call,
        createdAt: call.createdAt.toISOString(),
        purgeAt: call.purgeAt.toISOString(),
        scheduledFor: call.scheduledFor?.toISOString() ?? null,
      })),
    });
  } catch (error) {
    console.error('Failed to list call requests:', error);
    return NextResponse.json({ error: 'Could not load call requests.' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    if (!(await authorized())) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }
    const { id, action } = (await request.json()) as {
      id?: string;
      action?: 'approve' | 'reject' | 'cancel';
    };
    if (!id || !action || !['approve', 'reject', 'cancel'].includes(action)) {
      return NextResponse.json({ error: 'Invalid moderation action.' }, { status: 400 });
    }

    const update = action === 'approve'
      ? { status: 'scheduled' as const, moderationStatus: 'auto_approved' as const, scheduledFor: nextSafeCallTime() }
      : { status: action === 'reject' ? 'rejected' as const : 'canceled' as const };
    const call = await updateCallRequest(id, update);
    if (!call) return NextResponse.json({ error: 'Call request not found.' }, { status: 404 });
    let notificationEmailSent = true;
    try {
      await sendModerationDecisionEmail(
        call.email,
        SENATOR_NAMES[call.senator],
        action,
        call.scheduledFor,
      );
    } catch (emailError) {
      notificationEmailSent = false;
      console.error('Call request was updated but its notification email failed:', emailError);
    }

    return NextResponse.json({
      notificationEmailSent,
      call: {
        ...call,
        createdAt: call.createdAt.toISOString(),
        purgeAt: call.purgeAt.toISOString(),
        scheduledFor: call.scheduledFor?.toISOString() ?? null,
      },
    });
  } catch (error) {
    console.error('Failed to update call request:', error);
    return NextResponse.json({ error: 'Could not update the call request.' }, { status: 500 });
  }
}
