import { NextResponse } from 'next/server';
import {
  ADMIN_SESSION_COOKIE,
  adminSessionMaxAge,
  configuredAdminEmail,
  createAdminSession,
} from '@calls/admin-auth';
import { consumeVerificationCode } from '@calls/store';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const { email, code } = (await request.json()) as { email?: string; code?: string };
    const normalizedEmail = email?.trim().toLowerCase();
    if (!normalizedEmail || normalizedEmail !== configuredAdminEmail() || !code) {
      return NextResponse.json({ error: 'Invalid administrator credentials.' }, { status: 401 });
    }

    const valid = await consumeVerificationCode(normalizedEmail, code, 'admin');
    if (!valid) {
      return NextResponse.json({ error: 'The code is invalid or expired.' }, { status: 401 });
    }

    const response = NextResponse.json({ message: 'Signed in.' });
    response.cookies.set(ADMIN_SESSION_COOKIE, createAdminSession(normalizedEmail), {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: adminSessionMaxAge,
    });
    return response;
  } catch (error) {
    console.error('Failed to sign in administrator:', error);
    return NextResponse.json({ error: 'Could not sign in.' }, { status: 500 });
  }
}
