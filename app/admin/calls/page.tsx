import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import CallAdmin, { type AdminCall } from '../../components/CallAdmin';
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from '@calls/admin-auth';
import { listCallRequests } from '@calls/store';

export const metadata: Metadata = {
  title: 'Call administration | CA for Palestine',
};

export default async function CallAdminPage() {
  const cookieStore = await cookies();
  const authenticated = verifyAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
  const calls: AdminCall[] = authenticated
    ? (await listCallRequests()).map((call) => ({
        id: call.id,
        firstName: call.firstName,
        lastName: call.lastName,
        city: call.city,
        zipCode: call.zipCode,
        email: call.email,
        senator: call.senator,
        script: call.script,
        status: call.status,
        scheduledFor: call.scheduledFor?.toISOString() ?? null,
        createdAt: call.createdAt.toISOString(),
        attempts: call.attempts,
        reportedOutcome: call.reportedOutcome,
        endedReason: call.endedReason,
        summary: call.summary,
        officeStopRequested: call.officeStopRequested,
      }))
    : [];

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-stone-100 px-4 py-10 sm:px-6">
      <CallAdmin initialAuthenticated={authenticated} initialCalls={calls} />
    </main>
  );
}
