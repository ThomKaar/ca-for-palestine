'use client';

import '../styles/page.css';
import { useState } from 'react';
import type { Representative, EmailContent, UserInfo } from '../types/main.ts';
import { inlcudeName } from '@/utils/commonUtils';

const REPRESENTATIVES: Representative[] = [
  {
    name: 'Senator Adam Schiff',
    countField: 'schiff',
    email: 'adam.schiff@mail.house.gov',
    buttonColor: 'bg-black',
    hoverColor: 'hover:bg-gray-800',
  },
  {
    name: 'Senator Alex Padilla',
    countField: 'padilla',
    email: 'alex.padilla@mail.house.gov',
    buttonColor: 'bg-red-700',
    hoverColor: 'hover:bg-red-500',
  }
];

const inputClasses = 'w-full px-3 py-2 border rounded-md';
const labelClasses = 'block text-sm font-medium mb-1';

type SubState = 'idle' | 'subscribing' | 'pending_confirm' | 'confirmed';

export default function Form({ env = 'development' }: { env?: string }) {
    const [, setEmailGenerated] = useState(false);
    const [isGenerating, setIsGenerating] = useState<string | null>(null);
    const [counts, setCounts] = useState<Record<string, number | null>>({});
    const [loadingCounts, setLoadingCounts] = useState<Record<string, boolean>>({});
    const [selectedRep, setSelectedRep] = useState<string | null>(null);
    const [emailContent, setEmailContent] = useState<EmailContent | null>(null);
    const [, setSelectedRepresentative] = useState<Representative | null>(null);
    const [userInfo, setUserInfo] = useState<UserInfo>({
        firstName: '',
        lastName: '',
        addressOne: '',
        addressTwo: '',
        city: '',
        state: 'California',
        zipCode: '',
        phoneNumber: '',
        email: '',
    });
    const [missingInfo, setMissingInfo] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    // Opt-in state
    const [sentEmailData, setSentEmailData] = useState<{ subject: string; body: string; rep: string } | null>(null);
    const [sendsPerWeek, setSendsPerWeek] = useState<2 | 3>(2);
    const [subState, setSubState] = useState<SubState>('idle');
    const [unsubscribeToken, setUnsubscribeToken] = useState<string | null>(null);


    const fetchCounts = async () => {
        if (loadingCounts.all || counts.schiff !== undefined) return;
        setLoadingCounts(prev => ({ ...prev, all: true }));
        try {
            const res = await fetch('/api/count-emails?rep=Schiff,Padilla');
            const data = await res.json();
            setCounts({
                schiff: data.counts?.Schiff ?? 0,
                padilla: data.counts?.Padilla ?? 0,
            });
        } catch {
            setCounts({ schiff: 0, padilla: 0 });
        } finally {
            setLoadingCounts(prev => ({ ...prev, all: false }));
        }
    };

    const launchEmail = async ({ emailContent, userInfo, rep }: { emailContent: EmailContent, userInfo: UserInfo, rep: string }) => {
        const { subject, body } = emailContent;
        if (isMissingUserInfo(userInfo)) {
            setMissingInfo(true);
            return;
        }

        const bodyWithName = inlcudeName(body, userInfo.firstName, userInfo.lastName);
        const response = await fetch('/api/submit-form', {
            method: 'POST',
            body: JSON.stringify({ subject, body: bodyWithName, userInfo, rep }),
        });
        if (response.ok) {
            setSentEmailData({ subject, body: bodyWithName, rep });
            setEmailContent(null);
            setEmailSent(true);
        }
        return;
    };

    const isMissingUserInfo = (userInfo: UserInfo): boolean => {
        return !(!!(userInfo.addressOne && userInfo.city && userInfo.email && userInfo.firstName && userInfo.lastName && userInfo.zipCode));
    };

    const generateEmail = async (rep: Representative) => {
        setIsGenerating(rep.name);
        setSelectedRep(rep.name);
        let response;
        const isDev = env === 'development';
        try {
            if (!isDev) {
                response = await fetch('/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ representative: rep.name }),
                });
            }

            if (!isDev && !response?.ok ) {
                throw new Error('Failed to generate email');
            }

            const data = !isDev && await response?.json();
            setEmailContent({
                subject: isDev ?  'test subject' : data.subject,
                body: isDev ? 'test body' : data.body,
                representative: rep.name,
            });
            setEmailGenerated(true);
        } catch (error) {
            console.error('Error generating email:', error);

        } finally {
            setIsGenerating(null);
        }
    };

    const handleSubscribe = async () => {
        if (!sentEmailData || !userInfo) return;
        setSubState('subscribing');

        const repShort = sentEmailData.rep.includes('Schiff') ? 'Schiff' : 'Padilla';

        try {
            const res = await fetch('/api/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userInfo,
                    rep: repShort,
                    emailSubject: sentEmailData.subject,
                    emailBody: sentEmailData.body,
                    sendsPerWeek,
                }),
            });

            if (!res.ok) throw new Error('Subscribe failed');

            const data = await res.json();
            setUnsubscribeToken(data.unsubscribeToken);
            setSubState('pending_confirm');
        } catch (err) {
            console.error('Subscribe error:', err);
            setSubState('idle');
        }
    };

return (
    <div className="h-full">
        {!emailContent && (
            <div className="flex flex-col items-center justify-center p-8 bg-gray-50 relative h-full" >
                <div className="max-w-3xl w-full text-center space-y-8">
                <div>
                <h1 className="text-4xl font-bold text-gray-700 mb-4">
                    Contact our California Representatives to stop the genocide of Palestinian people.
                </h1>

                <p className="text-lg text-gray-700 mb-8">
                    Generate emails to our representatives calling to stop the genocide of Palestinians.
                </p>

            <div className="flex flex-col gap-4">

                {!emailSent && REPRESENTATIVES.map((rep) => (
                <div key={rep.name} className="group flex flex-col items-center gap-2" onMouseEnter={fetchCounts}>
                    <button
                        onClick={() => {
                            setSelectedRepresentative(rep);
                            generateEmail(rep);
                        }}
                        disabled={isGenerating !== null}
                        className={`flex-1 ${rep.buttonColor} ${rep.hoverColor} text-white font-bold py-4 px-8 rounded-lg text-lg transition-colors duration-200 flex items-center justify-center gap-2 active:scale-95 active:brightness-90${isGenerating !== null ? ' opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <span>Send an Email to {rep.name}</span>
                        {isGenerating === rep.name ? (
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                        ) : (
                            ''
                        )}
                    </button>
                    <span className="text-gray-500 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 h-5">
                        {loadingCounts.all
                            ? null
                            : rep.countField && counts[rep.countField] !== undefined
                                ? <>Together we&apos;ve sent {counts[rep.countField]} emails to {rep.name} so far.</>
                                : null}
                    </span>
                </div>
                ))}
                {emailSent && (
                    <div className="flex flex-col gap-6">
                        <h3 className="font-bold text-2xl text-gray-700">Email Sent — Thanks!</h3>

                        {subState === 'idle' && (
                            <div className="bg-white rounded-lg shadow-md p-6 text-left flex flex-col gap-4 max-w-md mx-auto w-full">
                                <h4 className="font-semibold text-lg text-gray-800">Keep the pressure up</h4>
                                <p className="text-gray-600 text-sm">
                                    Set up recurring sends and your approved email will be automatically re-submitted to {sentEmailData?.rep ?? 'your representative'} a few times per week — no extra effort required.
                                </p>
                                <div>
                                    <p className="text-sm font-medium text-gray-700 mb-2">How often?</p>
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="sendsPerWeek"
                                                value={2}
                                                checked={sendsPerWeek === 2}
                                                onChange={() => setSendsPerWeek(2)}
                                            />
                                            <span className="text-sm text-gray-700">2&times;/week</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="sendsPerWeek"
                                                value={3}
                                                checked={sendsPerWeek === 3}
                                                onChange={() => setSendsPerWeek(3)}
                                            />
                                            <span className="text-sm text-gray-700">3&times;/week</span>
                                        </label>
                                    </div>
                                </div>
                                <button
                                    onClick={handleSubscribe}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                                >
                                    Set up recurring sends
                                </button>
                            </div>
                        )}

                        {subState === 'subscribing' && (
                            <p className="text-gray-500">Setting up your subscription...</p>
                        )}

                        {subState === 'pending_confirm' && (
                            <div className="bg-white rounded-lg shadow-md p-6 text-left flex flex-col gap-3 max-w-md mx-auto w-full">
                                <h4 className="font-semibold text-lg text-gray-800">Check your inbox</h4>
                                <p className="text-gray-600 text-sm">
                                    We sent a confirmation email to <strong>{userInfo.email}</strong>. Click the link to activate your recurring sends.
                                </p>
                                {unsubscribeToken && (
                                    <div className="bg-gray-50 rounded p-3">
                                        <p className="text-xs font-medium text-gray-700 mb-1">Save your unsubscribe link:</p>
                                        <p className="text-xs text-gray-500 break-all">
                                            {`${process.env.NEXT_PUBLIC_BASE_URL ?? 'https://ca-for-palestine.com'}/unsubscribe?token=${unsubscribeToken}`}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {subState === 'confirmed' && (
                            <p className="text-green-700 font-semibold">You&apos;re all set! Sends are scheduled.</p>
                        )}
                    </div>
                )}
            </div>
                </div>
            </div>
            </div>
            )}
        {emailContent && (
            <div className="text-left text-gray-700 w-full my-4 lg:px-6 flex justify-center">
            <div className="pg-white-100 flex flex-col gap-4 p-6 overflow-auto rounded-lg shadow-md z-3 opacity-100 bg-white lg:w-3/5 w-4/5">
                <h3 className="text-center text-lg" >Nice! We&apos;ve generated an email for you, feel free to edit though and sign your name at the end.</h3>
                <div>
                <label htmlFor="subject" className="block text-sm font-medium">
                    Subject
                </label>
                <input
                    type="text"
                    id="subject"
                    value={emailContent.subject}
                    onChange={(e) => setEmailContent({ ...emailContent, subject: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                </div>
                <div>
                <label htmlFor="body" className="block text-sm font-medium">
                    Email Body
                </label>
                <textarea
                    id="body"
                    value={emailContent.body}
                    onChange={(e) => setEmailContent({ ...emailContent, body: e.target.value })}
                    rows={12}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                </div>
                <h3 className="text-center text-lg">
                Last step. We also have to prove to representatives that you&apos;re actually one of their constituents, so you&apos;ll have to fill out some info below.
                <br/>
                We don&apos;t store any of your personal information, but we do count how many times we successfully email reps.
                </h3>
                <div className="flex flex-row gap-5">
                    <div className="inline-block flex-1">
                    <label htmlFor="firstName"  className={`${labelClasses} ${ missingInfo && !userInfo.firstName ? 'text-red-300 font-semibold': 'text-gray-700'}`}>
                        First Name *
                    </label>
                    <input
                        type="text"
                        id="firstName"
                        required
                        value={userInfo.firstName}
                        onChange={(e) => {
                        setUserInfo({ ...userInfo, firstName: e.target.value });
                        if (missingInfo && !isMissingUserInfo(userInfo)) {
                            setMissingInfo(false);
                        }
                        }}
                        className={`${inputClasses} ${missingInfo && !userInfo.firstName ? 'border-red-300' : 'border-gray-300'}`}
                    />
                    </div>
                    <div className="inline-block flex-1">
                    <label htmlFor="lastName"  className={`${labelClasses} ${ missingInfo && !userInfo.lastName ? 'text-red-300 font-semibold': 'text-gray-700'}`}>
                        Last Name *
                    </label>
                    <input
                        type="text"
                        id="lastName"
                        required
                        value={userInfo.lastName}
                        onChange={(e) => {
                        setUserInfo({ ...userInfo, lastName: e.target.value });
                        if (missingInfo && !isMissingUserInfo(userInfo)) {
                            setMissingInfo(false);
                        }
                        }}
                        className={`${inputClasses} ${missingInfo && !userInfo.lastName ? 'border-red-300' : 'border-gray-300'}`}
                    />
                    </div>
                </div>
                <div>
                <label htmlFor="email" className={`${labelClasses} ${ missingInfo && !userInfo.email ? 'text-red-300 font-semibold': 'text-gray-700'}`}>
                    Email Address *
                </label>
                <input
                    type="email"
                    id="email"
                    required
                    value={userInfo.email}
                    onChange={(e) => {
                    setUserInfo({ ...userInfo, email: e.target.value });
                    if (missingInfo && !isMissingUserInfo(userInfo)) {
                        setMissingInfo(false);
                    }
                    }}
                    className={`${inputClasses} ${missingInfo && !userInfo.email ? 'border-red-300' : 'border-gray-300'}`}
                />
                </div>
                <div>
                    <label htmlFor="address" className={`${labelClasses} ${ missingInfo && !userInfo.addressOne ? 'text-red-300 font-semibold': 'text-gray-700'}`}>
                    Address *
                    </label>
                    <input
                    type="text"
                    id="name"
                    required
                    value={userInfo.addressOne}
                    onChange={(e) => {
                        setUserInfo({ ...userInfo, addressOne: e.target.value });
                        if (missingInfo && !isMissingUserInfo(userInfo)) {
                        setMissingInfo(false);
                        }
                    }}
                    className={`${inputClasses} ${missingInfo && !userInfo.addressOne ? 'border-red-300' : 'border-gray-300'}`}
                    />
                </div>
                <div>
                    <label htmlFor="address2" className="block text-sm font-medium text-gray-700 mb-1">
                    Address Line 2 (optional)
                    </label>
                    <input
                    type="text"
                    id="address2"
                    value={userInfo.addressTwo}
                    onChange={(e) => {
                        setUserInfo({ ...userInfo, addressTwo: e.target.value });
                    }}
                    className={`${inputClasses} border-gray-300`}
                    />
                </div>
                <div>
                <label htmlFor="city" className={`${labelClasses} ${ missingInfo && !userInfo.city ? 'text-red-300 font-semibold': 'text-gray-700'}`}>
                    City *
                </label>
                <input
                    type="text"
                    id="city"
                    required
                    value={userInfo.city}
                    onChange={(e) => {
                    setUserInfo({ ...userInfo, city: e.target.value });
                    if (missingInfo && !isMissingUserInfo(userInfo)) {
                        setMissingInfo(false);
                    }
                    }}
                    className={`${inputClasses} ${missingInfo && !userInfo.city ? 'border-red-300' : 'border-gray-300'}`}
                />
                </div>
                <div>
                <label htmlFor="zip" className={`${labelClasses} ${ missingInfo && !userInfo.zipCode ? 'text-red-300 font-semibold': 'text-gray-700'}`}>
                    ZipCode *
                </label>
                <input
                    type="text"
                    id="zip"
                    placeholder='Zip Code (e.g. 94040)'
                    required
                    value={userInfo.zipCode}
                    onChange={(e) => {
                    setUserInfo({ ...userInfo, zipCode: e.target.value });
                    if (missingInfo && !isMissingUserInfo(userInfo)) {
                        setMissingInfo(false);
                    }
                    }}
                    className={`${inputClasses} ${missingInfo && !userInfo.zipCode ? 'border-red-300' : 'border-gray-300'}`}
                />
                </div>
                <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                </label>
                <input
                    type="text"
                    id="phone"
                    pattern="^\+?[1-9]\d{1,14}$"
                    placeholder="If you don't include a phone number, we'll use the number of the person who built this site."
                    value={userInfo.phoneNumber}
                    onChange={(e) => {
                    setUserInfo({ ...userInfo, phoneNumber: e.target.value });
                    if (missingInfo && !isMissingUserInfo(userInfo)) {
                        setMissingInfo(false);
                    }
                    }}
                    className={`${inputClasses} border-gray-300`}
                />
                </div>
                <button
                onClick={() => launchEmail({ emailContent, userInfo, rep: selectedRep || '' })}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors duration-200 flex items-center justify-center gap-2"
                >
                <span>Send Email</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                </button>
            </div>
            </div>
        )}
    </div>);
};
