'use client';

import { useState } from 'react';
import type { SenatorId } from '../../lib/calls/config';
import type { CallStatus } from '../../lib/calls/types';

export interface AdminCall {
  id: string;
  firstName: string;
  lastName: string;
  city: string;
  zipCode: string;
  email: string;
  senator: SenatorId;
  script: string;
  status: CallStatus;
  scheduledFor: string | null;
  createdAt: string;
  attempts: number;
  reportedOutcome?: string;
  endedReason?: string;
  summary?: string;
  officeStopRequested?: boolean;
}

function readableDate(value: string | null): string {
  if (!value) return 'Not assigned';
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/New_York',
  }).format(new Date(value));
}

export default function CallAdmin({
  initialAuthenticated = false,
  initialCalls = [],
}: {
  initialAuthenticated?: boolean;
  initialCalls?: AdminCall[];
}) {
  const [email, setEmail] = useState('admin@example.com');
  const [code, setCode] = useState('');
  const [developmentCode, setDevelopmentCode] = useState<string | null>(null);
  const [codeRequested, setCodeRequested] = useState(false);
  const [authenticated, setAuthenticated] = useState(initialAuthenticated);
  const [calls, setCalls] = useState<AdminCall[]>(initialCalls);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCalls = async () => {
    const response = await fetch('/api/calls/admin/requests');
    if (response.status === 401) {
      setAuthenticated(false);
      return;
    }
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Could not load call requests.');
    setAuthenticated(true);
    setCalls(data.calls);
  };

  const requestCode = async () => {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch('/api/calls/admin/request-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not request a code.');
      setCodeRequested(true);
      setDevelopmentCode(data.developmentCode ?? null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not request a code.');
    } finally {
      setBusy(false);
    }
  };

  const signIn = async () => {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch('/api/calls/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not sign in.');
      await loadCalls();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not sign in.');
    } finally {
      setBusy(false);
    }
  };

  const moderate = async (id: string, action: 'approve' | 'reject' | 'cancel') => {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch('/api/calls/admin/requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not update the request.');
      setCalls((current) => current.map((call) => (call.id === id ? data.call : call)));
      if (data.notificationEmailSent === false) {
        setError('The request was updated, but its notification email could not be delivered.');
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not update the request.');
    } finally {
      setBusy(false);
    }
  };

  if (!authenticated) {
    return (
      <section className="mx-auto max-w-md rounded-3xl border border-stone-200 bg-white p-7 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Private administration</p>
        <h1 className="mt-3 text-3xl font-bold text-stone-900">Call review sign-in</h1>
        <p className="mt-3 text-sm leading-6 text-stone-600">Use the configured administrator email. Development defaults to admin@example.com.</p>
        <label className="mt-6 block">
          <span className="text-sm font-semibold text-stone-700">Administrator email</span>
          <input
            type="email"
            value={email}
            disabled={codeRequested}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-2.5 disabled:bg-stone-100"
          />
        </label>
        {!codeRequested ? (
          <button onClick={requestCode} disabled={busy} className="mt-5 w-full rounded-xl bg-stone-900 px-5 py-3 font-bold text-white disabled:opacity-50">
            {busy ? 'Sending…' : 'Email me a sign-in code'}
          </button>
        ) : (
          <div className="mt-5">
            <label>
              <span className="text-sm font-semibold text-stone-700">Six-digit code</span>
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
                className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-2.5 text-lg tracking-[0.3em]"
              />
            </label>
            {developmentCode && <p className="mt-2 text-xs text-stone-600">Development code: <strong>{developmentCode}</strong></p>}
            <button onClick={signIn} disabled={busy || code.length !== 6} className="mt-4 w-full rounded-xl bg-stone-900 px-5 py-3 font-bold text-white disabled:opacity-50">
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </div>
        )}
        {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      </section>
    );
  }

  const pendingCount = calls.filter((call) => call.status === 'pending_review').length;

  return (
    <div className="mx-auto max-w-6xl">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Private administration</p>
          <h1 className="mt-2 text-4xl font-bold text-stone-900">Call queue</h1>
          <p className="mt-2 text-stone-600">{pendingCount} request{pendingCount === 1 ? '' : 's'} waiting for review</p>
        </div>
        <button onClick={() => loadCalls()} className="rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700">Refresh</button>
      </header>

      {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}

      <div className="mt-7 space-y-4">
        {calls.length === 0 && (
          <div className="rounded-3xl border border-stone-200 bg-white p-8 text-center text-stone-600">No call requests yet.</div>
        )}
        {calls.map((call) => (
          <article key={call.id} className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-bold text-stone-900">{call.firstName} {call.lastName} · {call.senator === 'schiff' ? 'Schiff' : 'Padilla'}</p>
                <p className="mt-1 text-sm text-stone-500">{call.city}, {call.zipCode} · {call.email}</p>
              </div>
              <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-stone-700">{call.status.replaceAll('_', ' ')}</span>
            </div>
            <p className="mt-4 whitespace-pre-wrap rounded-2xl bg-stone-50 p-4 text-sm leading-6 text-stone-700">{call.script}</p>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-stone-500">
              <span>Submitted {readableDate(call.createdAt)} · Scheduled {readableDate(call.scheduledFor)} · {call.attempts}/3 attempts</span>
              <div className="flex gap-2">
                {call.status === 'pending_review' && (
                  <>
                    <button disabled={busy} onClick={() => moderate(call.id, 'approve')} className="rounded-lg bg-emerald-700 px-3 py-2 font-semibold text-white disabled:opacity-50">Approve</button>
                    <button disabled={busy} onClick={() => moderate(call.id, 'reject')} className="rounded-lg bg-red-700 px-3 py-2 font-semibold text-white disabled:opacity-50">Reject</button>
                  </>
                )}
                {(call.status === 'scheduled' || call.status === 'pending_review') && (
                  <button disabled={busy} onClick={() => moderate(call.id, 'cancel')} className="rounded-lg border border-stone-300 px-3 py-2 font-semibold text-stone-700 disabled:opacity-50">Cancel</button>
                )}
              </div>
            </div>
            {(call.summary || call.endedReason || call.officeStopRequested) && (
              <div className="mt-4 rounded-2xl border border-stone-200 p-4 text-sm text-stone-700">
                {call.officeStopRequested && <p className="font-bold text-red-700">Office stop request received — this senator’s queue is paused.</p>}
                {call.summary && <p>{call.summary}</p>}
                {call.endedReason && <p className="mt-1 text-xs text-stone-500">Provider outcome: {call.endedReason}</p>}
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
