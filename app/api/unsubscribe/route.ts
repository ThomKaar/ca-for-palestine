import { NextRequest, NextResponse } from 'next/server';
import { unsubscribe } from '@/utils/subscribers';

export async function GET(req: NextRequest) {
    const token = req.nextUrl.searchParams.get('token');
    if (!token) {
        return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }

    const success = await unsubscribe(token);
    if (!success) {
        return NextResponse.json({ error: 'Token not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
}
