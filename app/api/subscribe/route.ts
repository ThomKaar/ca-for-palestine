import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { createSubscriber } from '@/utils/subscribers';
import { sendConfirmationEmail } from '@/utils/mailer';
import { normalizePhoneNumber } from '@/utils/beCommonUtils';
import type { UserInfo } from '@/types/main';

export async function POST(req: NextRequest) {
    try {
        const { userInfo, rep, emailSubject, emailBody, sendsPerWeek } = await req.json() as {
            userInfo: UserInfo;
            rep: 'Schiff' | 'Padilla';
            emailSubject: string;
            emailBody: string;
            sendsPerWeek: 2 | 3;
        };

        if (!userInfo || !rep || !emailSubject || !emailBody || !sendsPerWeek) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const normalizedUserInfo = {
            ...userInfo,
            phoneNumber: normalizePhoneNumber(userInfo.phoneNumber),
        };

        const verifyToken = randomUUID();
        const unsubscribeToken = randomUUID();
        const now = new Date();
        // nextSendAt is set after verification; use a placeholder far in the future
        const nextSendAt = new Date('9999-12-31');

        await createSubscriber({
            userInfo: normalizedUserInfo,
            rep,
            emailSubject,
            emailBody,
            sendsPerWeek,
            active: true,
            verified: false,
            verifyToken,
            unsubscribeToken,
            lastSentAt: null,
            nextSendAt,
            createdAt: now,
        });

        const repLabel = rep === 'Schiff' ? 'Senator Adam Schiff' : 'Senator Alex Padilla';
        await sendConfirmationEmail(
            userInfo.email,
            userInfo.firstName,
            repLabel,
            verifyToken,
            unsubscribeToken
        );

        return NextResponse.json({ unsubscribeToken });
    } catch (err) {
        console.error('Error in /api/subscribe:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
