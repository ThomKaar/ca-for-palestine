'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_CALL_SCRIPT,
  MAX_SCRIPT_WORDS,
  SENATOR_NAMES,
  type SenatorId,
} from '../../lib/calls/config';
import { countWords } from '../../lib/calls/moderation';

interface Identity {
  firstName: string;
  lastName: string;
  city: string;
  zipCode: string;
  email: string;
}

interface ScheduledCall {
  id: string;
  senator: SenatorId;
  senatorName: string;
  scheduledFor: string | null;
}

interface ScheduleResult {
  status: 'scheduled' | 'pending_review';
  message: string;
  calls: ScheduledCall[];
  confirmationEmailSent?: boolean;
}

const INITIAL_IDENTITY: Identity = {
  firstName: '',
  lastName: '',
  city: '',
  zipCode: '',
  email: '',
};

const CONSENT_ITEMS = [
  {
    id: 'aiCaller',
    label: 'I authorize a clearly identified AI agent to make this call on my behalf.',
  },
  {
    id: 'dataDisclosure',
    label: 'I authorize the agent to share my name, city, ZIP code, and email with Senate staff.',
  },
  {
    id: 'transcription',
    label: 'I consent to live transcription. Raw call audio will not be saved.',
  },
  {
    id: 'retries',
    label: 'I authorize up to three attempts for busy signals or unanswered calls.',
  },
] as const;

type ConsentId = (typeof CONSENT_ITEMS)[number]['id'];
type ConsentState = Record<ConsentId, boolean>;

const INITIAL_CONSENT: ConsentState = {
  aiCaller: false,
  dataDisclosure: false,
  transcription: false,
  retries: false,
};

function formatScheduledTime(value: string): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/Los_Angeles',
    timeZoneName: 'short',
  }).format(new Date(value));
}

export default function CallScheduler() {
  const [senators, setSenators] = useState<SenatorId[]>(['schiff', 'padilla']);
  const [script, setScript] = useState(DEFAULT_CALL_SCRIPT);
  const [identity, setIdentity] = useState<Identity>(INITIAL_IDENTITY);
  const [consent, setConsent] = useState<ConsentState>(INITIAL_CONSENT);
  const [verificationCode, setVerificationCode] = useState('');
  const [codeRequested, setCodeRequested] = useState(false);
  const [developmentCode, setDevelopmentCode] = useState<string | null>(null);
  const [result, setResult] = useState<ScheduleResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [delivered, setDelivered] = useState<Record<SenatorId, number>>({ schiff: 0, padilla: 0 });

  useEffect(() => {
    fetch('/api/calls/stats')
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('stats unavailable')))
      .then((data) => setDelivered(data.delivered))
      .catch(() => undefined);
  }, []);

  const wordCount = useMemo(() => countWords(script), [script]);
  const estimatedSeconds = Math.max(1, Math.ceil((wordCount / 145) * 60));
  const allConsentGiven = Object.values(consent).every(Boolean);

  const toggleSenator = (senator: SenatorId) => {
    setSenators((current) =>
      current.includes(senator)
        ? current.filter((item) => item !== senator)
        : [...current, senator],
    );
  };

  const requestCode = async () => {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch('/api/calls/request-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: identity.email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not send a verification code.');
      setCodeRequested(true);
      setDevelopmentCode(data.developmentCode ?? null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  const scheduleCalls = async () => {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch('/api/calls/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...identity,
          senators,
          script,
          consent,
          verificationCode,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not schedule your request.');
      setResult(data);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  if (result) {
    return (
      <section className="mx-auto max-w-2xl rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
          {result.status === 'scheduled' ? 'Authorized and queued' : 'Review requested'}
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-stone-900">Thank you for speaking up.</h1>
        <p className="mt-3 text-stone-600">{result.message}</p>
        {result.confirmationEmailSent === false && (
          <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
            Your request was saved, but its confirmation email could not be delivered. Please keep this page for your records.
          </p>
        )}
        <div className="mt-8 space-y-3">
          {result.calls.map((call) => (
            <div key={call.id} className="rounded-2xl bg-stone-50 p-4">
              <p className="font-semibold text-stone-900">{call.senatorName}</p>
              <p className="mt-1 text-sm text-stone-600">
                {call.scheduledFor
                  ? formatScheduledTime(call.scheduledFor)
                  : 'Pending script review — expect an email within 24 hours.'}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-sm text-stone-500">
          The call runner is disabled until the campaign completes launch review and explicitly enables live telephony.
        </p>
      </section>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Constituent-authorized advocacy</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-stone-900 sm:text-5xl">
          Schedule an AI-assisted call to your senators
        </h1>
        <p className="mt-5 text-lg leading-8 text-stone-600">
          Approve exactly what the agent may say. We assign a safe D.C. office-hours slot and email you the outcome.
        </p>
      </header>

      <div className="mx-auto mt-8 grid max-w-xl grid-cols-2 gap-3" aria-label="Delivered advocacy calls">
        {(Object.keys(SENATOR_NAMES) as SenatorId[]).map((senator) => (
          <div key={senator} className="rounded-2xl border border-stone-200 bg-white p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-emerald-800">{delivered[senator].toLocaleString()}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-stone-500">delivered to {senator === 'schiff' ? 'Schiff' : 'Padilla'}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        <strong>Development preview:</strong> scheduling, review, and the call runner are implemented, but live dialing is intentionally switched off pending launch review and credentials.
      </div>

      <div className="mt-6 space-y-6">
        <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-bold text-stone-900">1. Choose who to call</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {(Object.keys(SENATOR_NAMES) as SenatorId[]).map((senator) => (
              <label key={senator} className="flex cursor-pointer items-center gap-3 rounded-2xl border border-stone-200 p-4 hover:border-emerald-500">
                <input
                  type="checkbox"
                  checked={senators.includes(senator)}
                  onChange={() => toggleSenator(senator)}
                  className="h-5 w-5 accent-emerald-700"
                />
                <span className="font-semibold text-stone-800">{SENATOR_NAMES[senator]}</span>
              </label>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-stone-900">2. Approve your message</h2>
              <p className="mt-1 text-sm text-stone-600">Large changes may require review within 24 hours.</p>
            </div>
            <p className={`text-sm font-medium ${wordCount > MAX_SCRIPT_WORDS ? 'text-red-700' : 'text-stone-500'}`}>
              {wordCount}/{MAX_SCRIPT_WORDS} words · about {estimatedSeconds} seconds
            </p>
          </div>
          <textarea
            value={script}
            onChange={(event) => setScript(event.target.value)}
            rows={9}
            className="mt-5 w-full rounded-2xl border border-stone-300 px-4 py-3 leading-7 text-stone-800 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            aria-label="Approved call script"
          />
          <button
            type="button"
            onClick={() => setScript(DEFAULT_CALL_SCRIPT)}
            className="mt-3 text-sm font-semibold text-emerald-700 hover:text-emerald-900"
          >
            Restore vetted script
          </button>
        </section>

        <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-bold text-stone-900">3. Tell the office who you are</h2>
          <p className="mt-1 text-sm text-stone-600">The AI may share these four fields with Senate staff. We do not ask for your street address or phone number.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {([
              ['firstName', 'First name', 'text'],
              ['lastName', 'Last name', 'text'],
              ['city', 'City', 'text'],
              ['zipCode', 'ZIP code', 'text'],
              ['email', 'Email address', 'email'],
            ] as const).map(([field, label, type]) => (
              <label key={field} className={field === 'email' ? 'sm:col-span-2' : ''}>
                <span className="text-sm font-semibold text-stone-700">{label}</span>
                <input
                  type={type}
                  value={identity[field]}
                  disabled={field === 'email' && codeRequested}
                  onChange={(event) => setIdentity((current) => ({ ...current, [field]: event.target.value }))}
                  className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-2.5 text-stone-900 outline-none disabled:bg-stone-100 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                />
              </label>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-bold text-stone-900">4. Review and authorize</h2>
          <div className="mt-5 rounded-2xl bg-stone-50 p-4 text-sm leading-6 text-stone-700">
            The caller will say it is an AI agent acting for you and that the conversation will be transcribed. It will ask permission before continuing. Staff may end the call or request that automated calls stop.
          </div>
          <div className="mt-5 space-y-4">
            {CONSENT_ITEMS.map((item) => (
              <label key={item.id} className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={consent[item.id]}
                  onChange={(event) => setConsent((current) => ({ ...current, [item.id]: event.target.checked }))}
                  className="mt-1 h-5 w-5 shrink-0 accent-emerald-700"
                />
                <span className="text-sm leading-6 text-stone-700">{item.label}</span>
              </label>
            ))}
          </div>

          {!codeRequested ? (
            <button
              type="button"
              onClick={requestCode}
              disabled={busy || !identity.email}
              className="mt-7 w-full rounded-xl bg-emerald-800 px-5 py-3 font-bold text-white transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? 'Sending…' : 'Email me a verification code'}
            </button>
          ) : (
            <div className="mt-7 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <label>
                <span className="text-sm font-semibold text-emerald-950">Six-digit verification code</span>
                <input
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, ''))}
                  className="mt-2 w-full rounded-xl border border-emerald-300 bg-white px-3 py-2.5 text-lg tracking-[0.3em] text-stone-900 outline-none focus:border-emerald-700"
                />
              </label>
              {developmentCode && (
                <p className="mt-2 text-xs text-emerald-900">Development code: <strong>{developmentCode}</strong></p>
              )}
              <button
                type="button"
                onClick={scheduleCalls}
                disabled={busy || verificationCode.length !== 6 || !allConsentGiven || senators.length === 0 || wordCount === 0 || wordCount > MAX_SCRIPT_WORDS}
                className="mt-4 w-full rounded-xl bg-emerald-800 px-5 py-3 font-bold text-white transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? 'Authorizing…' : `Authorize ${senators.length === 1 ? 'call' : 'calls'} and schedule`}
              </button>
            </div>
          )}

          {error && (
            <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-800">{error}</p>
          )}
        </section>
      </div>
    </div>
  );
}
