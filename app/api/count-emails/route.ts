import { NextResponse, NextRequest } from 'next/server';
import { connectAndCountReps  as getMango } from '@/utils/mango';
import { REPS } from '@/utils/beCommonUtils';

export async function GET(request: NextRequest) {
  try {
    const rep = request.nextUrl.searchParams.get('rep');
    if (!rep) throw Error('Missing rep');

    const reps: string[] =[];
    if (!rep.includes(',')) {
      if (!REPS.includes(rep)) {
          throw new Error(`Invalid rep: ${rep}.`);
      }
      reps.push(rep);
    } else { // multiple reps
      rep.split(',').forEach((r) => {
        if (!r || !REPS.includes(r)) {
            throw new Error(`Invalid rep: ${r}.`);
        } else {
          reps.push(r);
        }
      });
    }
    const counts: { [s: string]: number } = {};
    REPS.forEach((r) => {
        counts[r] = 0;
    });
    const dbResponse = await Promise.all(reps.map((r) => getMango(r)));
    dbResponse.forEach((count, i) => {
      counts[reps[i]] = count;
    });
    return NextResponse.json({ 
      counts,
      status: 200,
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to process request or open browser: ' + err },
      { status: 500 }
    );
  }
}