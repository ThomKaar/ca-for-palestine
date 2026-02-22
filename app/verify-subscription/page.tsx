'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

function VerifySubscriptionContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            return;
        }
        fetch(`/api/verify-subscription?token=${encodeURIComponent(token)}`)
            .then((res) => {
                if (res.ok) {
                    setStatus('success');
                } else {
                    setStatus('error');
                }
            })
            .catch(() => setStatus('error'));
    }, [token]);

    if (status === 'loading') {
        return <p className="text-gray-600 text-lg">Confirming your subscription...</p>;
    }

    if (status === 'success') {
        return (
            <div className="flex flex-col items-center gap-4">
                <h1 className="text-3xl font-bold text-gray-800">You&apos;re confirmed!</h1>
                <p className="text-gray-600 text-lg text-center max-w-md">
                    Your recurring emails are now scheduled. We&apos;ll automatically submit your email to your representative a few times per week.
                </p>
                <p className="text-gray-500 text-sm text-center max-w-md">
                    Check the confirmation email we sent you for your unsubscribe link — save it somewhere safe.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-4">
            <h1 className="text-3xl font-bold text-gray-800">Something went wrong</h1>
            <p className="text-gray-600 text-lg text-center max-w-md">
                This confirmation link may be invalid or already used. Unverified subscriptions expire after 24 hours.
            </p>
        </div>
    );
}

export default function VerifySubscriptionPage() {
    return (
        <div className="flex items-center justify-center h-screen">
            <Suspense fallback={<p className="text-gray-600 text-lg">Loading...</p>}>
                <VerifySubscriptionContent />
            </Suspense>
        </div>
    );
}
