import { randomInt } from 'node:crypto';
import { NextResponse } from 'next/server';
import { sendVerificationEmail, productionEmailIsConfigured } from '@calls/email';
import { saveVerificationCode, hasDurableCallStore } from '@calls/store';
import { VERIFICATION_CODE_TTL_MINUTES } from '@calls/config';
import { productionSecurityIsConfigured } from '@calls/admin-auth';

export const runtime = 'nodejs';

function validEmail(value: unknown): value is string {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!validEmail(body.email)) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
    }

    if (process.env.NODE_ENV === 'production') {
      if (!hasDurableCallStore() || !productionEmailIsConfigured() || !productionSecurityIsConfigured()) {
        return NextResponse.json(
          { error: 'Call verification is not configured for production yet.' },
          { status: 503 },
        );
      }
    }

    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    const expiresAt = new Date(Date.now() + VERIFICATION_CODE_TTL_MINUTES * 60_000);
    await saveVerificationCode(body.email, code, expiresAt);
    await sendVerificationEmail(body.email, code);

    return NextResponse.json({
      message: 'Verification code sent.',
      expiresInMinutes: VERIFICATION_CODE_TTL_MINUTES,
      ...(process.env.NODE_ENV !== 'production' ? { developmentCode: code } : {}),
    });
  } catch (error) {
    console.error('Failed to create call verification code:', error);
    return NextResponse.json({ error: 'Could not send a verification code.' }, { status: 500 });
  }
}
