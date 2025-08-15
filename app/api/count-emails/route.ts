import { NextResponse, NextRequest } from 'next/server';
import { connectAndCountReps  as getMango } from '@/utils/mango';
import { REPS } from '@/utils/beCommonUtils';

export async function GET(request: NextRequest) {
  try {
    const rep = request.nextUrl.searchParams.get('rep'); 
    if (!rep || !REPS.includes(rep)) {
        throw new Error(`Invalid rep: ${rep}.`);
    }
    const count = await getMango(rep);

    return NextResponse.json({ 
      count,
      status: 200,
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to process request or open browser: ' + err },
      { status: 500 }
    );
  }
} 