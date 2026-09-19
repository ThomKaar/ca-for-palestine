import { NextResponse } from 'next/server';
import { deliveredCallCounts } from '@calls/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return NextResponse.json({ delivered: await deliveredCallCounts() });
  } catch (error) {
    console.error('Failed to load public call totals:', error);
    return NextResponse.json({ error: 'Could not load call totals.' }, { status: 500 });
  }
}
