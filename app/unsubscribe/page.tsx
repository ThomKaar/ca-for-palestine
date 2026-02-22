'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

function UnsubscribeContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            return;
        }
        fetch(`/api/unsubscribe?token=${encodeURIComponent(token)}`)
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
        return <p className="text-gray-600 text-lg">Processing your request...</p>;
    }

    if (status === 'success') {
        return (
            <div className="flex flex-col items-center gap-4">
                <h1 className="text-3xl font-bold text-gray-800">You&apos;ve been unsubscribed</h1>
                <p className="text-gray-600 text-lg text-center max-w-md">
                    Your recurring email submissions have been cancelled. No further automated emails will be sent on your behalf.
                </p>
                <p className="text-gray-500 text-sm text-center max-w-md">
                    Thank you for taking action. You can always come back to send a new email manually.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-4">
            <h1 className="text-3xl font-bold text-gray-800">Something went wrong</h1>
            <p className="text-gray-600 text-lg text-center max-w-md">
                This unsubscribe link may be invalid or already used.
            </p>
        </div>
    );
}

export default function UnsubscribePage() {
    return (
        <div className="flex items-center justify-center h-screen">
            <Suspense fallback={<p className="text-gray-600 text-lg">Loading...</p>}>
                <UnsubscribeContent />
            </Suspense>
        </div>
    );
}
