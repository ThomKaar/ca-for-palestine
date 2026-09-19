import { randomInt } from 'node:crypto';
import { NextResponse } from 'next/server';
import { configuredAdminEmail, productionSecurityIsConfigured } from '@calls/admin-auth';
import { VERIFICATION_CODE_TTL_MINUTES } from '@calls/config';
import { productionEmailIsConfigured, sendVerificationEmail } from '@calls/email';
import { hasDurableCallStore, saveVerificationCode } from '@calls/store';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const { email } = (await request.json()) as { email?: string };
    const normalizedEmail = email?.trim().toLowerCase();
    const adminEmail = configuredAdminEmail();

    if (!normalizedEmail || !adminEmail || normalizedEmail !== adminEmail) {
      return NextResponse.json({ error: 'This email is not configured as an administrator.' }, { status: 403 });
    }

    if (
      process.env.NODE_ENV === 'production' &&
      (!hasDurableCallStore() || !productionEmailIsConfigured() || !productionSecurityIsConfigured())
    ) {
      return NextResponse.json({ error: 'Administrator login is not configured.' }, { status: 503 });
    }

    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    const expiresAt = new Date(Date.now() + VERIFICATION_CODE_TTL_MINUTES * 60_000);
    await saveVerificationCode(normalizedEmail, code, expiresAt, 'admin');
    await sendVerificationEmail(normalizedEmail, code);

    return NextResponse.json({
      message: 'Administrator code sent.',
      ...(process.env.NODE_ENV !== 'production' ? { developmentCode: code } : {}),
    });
  } catch (error) {
    console.error('Failed to create administrator code:', error);
    return NextResponse.json({ error: 'Could not send an administrator code.' }, { status: 500 });
  }
}
