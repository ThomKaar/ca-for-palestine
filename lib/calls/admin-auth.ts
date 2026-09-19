import { createHmac, timingSafeEqual } from 'node:crypto';

export const ADMIN_SESSION_COOKIE = 'calls_admin_session';
const SESSION_TTL_SECONDS = 12 * 60 * 60;

function sessionSecret(): string {
  const secret = process.env.CALLS_SESSION_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV !== 'production') return 'development-admin-session-secret';
  throw new Error('CALLS_SESSION_SECRET is required in production.');
}

function sign(value: string): string {
  return createHmac('sha256', sessionSecret()).update(value).digest('base64url');
}

export function configuredAdminEmail(): string | null {
  const configured = process.env.CALLS_ADMIN_EMAIL?.trim().toLowerCase();
  if (configured) return configured;
  return process.env.NODE_ENV !== 'production' ? 'admin@example.com' : null;
}

export function productionSecurityIsConfigured(): boolean {
  return Boolean(
    process.env.CALLS_CODE_SECRET &&
    process.env.CALLS_CODE_SECRET.length >= 32 &&
    process.env.CALLS_SESSION_SECRET &&
    process.env.CALLS_SESSION_SECRET.length >= 32,
  );
}

export function createAdminSession(email: string): string {
  const payload = Buffer.from(
    JSON.stringify({ email: email.trim().toLowerCase(), expiresAt: Date.now() + SESSION_TTL_SECONDS * 1000 }),
  ).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

export function verifyAdminSession(token: string | undefined): boolean {
  if (!token) return false;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return false;

  const expected = sign(payload);
  const givenBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (givenBuffer.length !== expectedBuffer.length || !timingSafeEqual(givenBuffer, expectedBuffer)) {
    return false;
  }

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString()) as {
      email: string;
      expiresAt: number;
    };
    return data.email === configuredAdminEmail() && data.expiresAt > Date.now();
  } catch {
    return false;
  }
}

export const adminSessionMaxAge = SESSION_TTL_SECONDS;
