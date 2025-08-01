import { NextResponse } from 'next/server';
import { contactSchiff } from '../../utils/fillOutForms.ts';
import postMango from '../../utils/mango.ts';

export async function POST(request: Request) {
  try {
    const { 
      subject, 
      body, 
      userInfo,
    } = await request.json();
   
    contactSchiff(
      {
        subject,
        body,
        representative: 'Schiff',

      }, {
        ...userInfo,
    },
  { dev: true});
    
    postMango('Schiff');

    return NextResponse.json({ 
      message: 'Suck less',
      status: 200 
    });
  } catch (_erorr) {
    return NextResponse.json(
      { error: 'Failed to process request or open browser' },
      { status: 500 }
    );
  }
} 