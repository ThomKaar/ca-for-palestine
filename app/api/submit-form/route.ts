import { NextResponse } from 'next/server';
import { contactSchiff, contactPadilla } from '@/utils/fillOutForms';
import { connectAndPost as postMango, connectAndPostExperiment } from '@/utils/mango';
import { normalizePhoneNumber } from '@/utils/beCommonUtils';
import type { EmailContent, UserInfo } from '@/types/main';
import { assignFormFillVariant, type FormFillVariant } from '../../../lib/jev/experiment';
import { submitWithJevUltrafast, type SupportedSenator } from '../../../lib/jev/form-runner';
import { tagMessageTopics } from '../../../lib/jev/topics';

interface SubmissionBody {
  subject?: unknown;
  body?: unknown;
  userInfo?: Partial<UserInfo>;
  rep?: unknown;
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${field} is required`);
  return value;
}

function parseUserInfo(value: Partial<UserInfo> | undefined): UserInfo {
  if (!value || typeof value !== 'object') throw new Error('userInfo is required');
  return {
    firstName: requireString(value.firstName, 'firstName'),
    lastName: requireString(value.lastName, 'lastName'),
    addressOne: requireString(value.addressOne, 'addressOne'),
    addressTwo: typeof value.addressTwo === 'string' ? value.addressTwo : '',
    city: requireString(value.city, 'city'),
    state: requireString(value.state, 'state'),
    zipCode: requireString(value.zipCode, 'zipCode'),
    phoneNumber: typeof value.phoneNumber === 'string' ? normalizePhoneNumber(value.phoneNumber) : '',
    alternatePhoneNumber: typeof value.alternatePhoneNumber === 'string'
      ? normalizePhoneNumber(value.alternatePhoneNumber)
      : '',
    email: requireString(value.email, 'email'),
  };
}

function requestedSenators(rep: string): SupportedSenator[] {
  const senators: SupportedSenator[] = [];
  if (rep.includes('Schiff')) senators.push('Schiff');
  if (rep.includes('Padilla')) senators.push('Padilla');
  if (!senators.length) throw new Error('A supported senator is required');
  return senators;
}

async function submitLegacy(senator: SupportedSenator, email: EmailContent, userInfo: UserInfo) {
  if (senator === 'Schiff') return contactSchiff(email, userInfo, { dev: false });
  return contactPadilla(email, userInfo, { dev: false });
}

async function submitForm(
  senator: SupportedSenator,
  email: EmailContent,
  userInfo: UserInfo,
  variant: FormFillVariant,
) {
  const startedAt = Date.now();
  if (variant === 'jev_ultrafast') await submitWithJevUltrafast(senator, email, userInfo);
  else await submitLegacy(senator, email, userInfo);
  return Date.now() - startedAt;
}

export async function POST(request: Request) {
  try {
    const payload = await request.json() as SubmissionBody;
    const subject = requireString(payload.subject, 'subject');
    const body = requireString(payload.body, 'body');
    const rep = requireString(payload.rep, 'rep');
    const userInfo = parseUserInfo(payload.userInfo);
    const senators = requestedSenators(rep);
    const variant = assignFormFillVariant(userInfo.email);

    const taggingPromise = process.env.TYPESAFE_API_KEY
      ? tagMessageTopics(body).catch((error) => {
          console.error('Jev topic tagging failed:', error);
          return null;
        })
      : Promise.resolve(null);

    const attempts: Array<{
      senator: SupportedSenator;
      durationMs: number;
      outcome: 'success' | 'failure';
      errorType?: string;
    }> = [];
    let submissionError: unknown = null;
    for (const senator of senators) {
      const email: EmailContent = {
        subject,
        body,
        representative: senator === 'Schiff' ? 'Senator Adam Schiff' : 'Senator Alex Padilla',
      };
      const startedAt = Date.now();
      try {
        await submitForm(senator, email, userInfo, variant);
        attempts.push({ senator, durationMs: Date.now() - startedAt, outcome: 'success' });
      } catch (error) {
        submissionError = error;
        attempts.push({
          senator,
          durationMs: Date.now() - startedAt,
          outcome: 'failure',
          errorType: error instanceof Error ? error.name : 'UnknownError',
        });
        break;
      }
    }

    const tagging = await taggingPromise;
    await Promise.all(attempts.flatMap(({ senator, durationMs, outcome, errorType }) => {
      const topicMetric = {
        topics: tagging?.tags ?? [],
        topicModel: tagging?.model,
        topicTaggingStatus: tagging ? 'tagged' as const : 'unavailable' as const,
      };
      const writes: Promise<unknown>[] = [connectAndPostExperiment({
        rep: senator,
        variant,
        outcome,
        durationMs,
        errorType,
        ...topicMetric,
      })];
      if (outcome === 'success') writes.push(postMango(senator, { variant, durationMs, ...topicMetric }));
      return writes;
    }));

    if (submissionError) throw submissionError;

    return NextResponse.json({ 
      message: 'Message submitted',
      variant,
      topics: tagging?.tags ?? [],
      topicTaggingStatus: tagging ? 'tagged' : 'unavailable',
    });
  } catch (err) {
    console.error('Submit form failed:', err);
    return NextResponse.json(
      { error: 'Failed to submit the senator contact form.' },
      { status: 500 }
    );
  }
}
