import { NextResponse } from 'next/server';
import { contactSchiff } from '@/utils/fillOutForms';
import postMango from '@/utils/mango';
import { normalizePhoneNumber } from '@/utils/beCommonUtils';

export async function POST(request: Request) {
  try {
    const { 
      subject, 
      body, 
      userInfo = '',
    } = await request.json();

    userInfo.phoneNumber = normalizePhoneNumber(userInfo.phoneNumber)
   
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