import { NextResponse } from 'next/server';
import { contactSchiff, contactPadilla } from '@/utils/fillOutForms';
import { connectAndPost as postMango } from '@/utils/mango';
import { normalizePhoneNumber } from '@/utils/beCommonUtils';

export async function POST(request: Request) {
  try {
    const { 
      subject, 
      body, 
      userInfo = '',
      rep = 'Schiff',
    } = await request.json();

    userInfo.phoneNumber = normalizePhoneNumber(userInfo.phoneNumber)
   
    if (rep.includes('Schiff')) {
      contactSchiff(
        {
          subject,
          body,
          representative: 'Senator Adam Schiff',

        }, {
          ...userInfo,
      },
      { dev: true });
    
      await postMango('Schiff');
    }

    if (rep.includes('Padilla')) {
      contactPadilla(
        {
          subject,
          body,
          representative: 'Senator Alex Padilla'
        }, {
          ...userInfo
        },
        { dev: true});
      await postMango('Padilla');
    }
    

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