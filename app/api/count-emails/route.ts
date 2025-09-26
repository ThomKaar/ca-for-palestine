import { NextResponse, NextRequest } from 'next/server';
import { connectAndCountReps  as getMango } from '@/utils/mango';
import { REPS } from '@/utils/beCommonUtils';

export async function GET(request: NextRequest) {
  try {
    console.log("HIIIII")
    const rep = request.nextUrl.searchParams.get('rep');
    if (!rep) throw Error('Missing rep');

    let reps: string[] =[];
    if (!rep.includes(',')) {
      console.log('not ehre')
      if (!REPS.includes(rep)) {
          throw new Error(`Invalid rep: ${rep}.`);
      }
      reps.push(rep);
    } else { // multiple reps
      console.log('but here')
      rep.split(',').forEach((r) => {
        if (!r || !REPS.includes(r)) {
            throw new Error(`Invalid rep: ${r}.`);
        } else {
          reps.push(r);
        }
      });
    }
    console.log('and here')
    let counts: { [s: string]: number } = {};
    REPS.forEach((r) => {
        counts[r] = 0;
    });
    console.log('calling getMango')
    reps.forEach(async (r) => {
      counts[r] = await getMango(r);
    });
    console.log(counts);

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