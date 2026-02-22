import { NextRequest, NextResponse } from 'next/server';
import { inngest } from '@/inngest/client';

export async function GET(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await inngest.send({ name: 'app/send-scheduled-emails', data: {} });

    return NextResponse.json({ ok: true });
}
