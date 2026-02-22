import { NextRequest, NextResponse } from 'next/server';
import { verifySubscriber } from '@/utils/subscribers';

export async function GET(req: NextRequest) {
    const token = req.nextUrl.searchParams.get('token');
    if (!token) {
        return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }

    const success = await verifySubscriber(token);
    if (!success) {
        return NextResponse.json({ error: 'Invalid or already verified token' }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
}
