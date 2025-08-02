import { NextResponse } from 'next/server';
import { contactSchiff } from '../../utils/fillOutForms';
import postMango from '../../utils/mango';

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
        representative: 'Senator Adam Schiff',

      }, {
        ...userInfo,
    },
  { dev: false });
    
    postMango('Schiff');

    return NextResponse.json({ 
      message: 'Suck less',
      status: 200 
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to process request or open browser: ' + err },
      { status: 500 }
    );
  }
} 