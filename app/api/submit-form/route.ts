import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { contactSchiff } from '../../utils/fillOutForms.ts';
import {
  getContactForm,
  getPrefix,
  getFirstName,
  getLastName,
  getStreetAddressOne,
  getStreetAddressTwo,
  getCity,
  getState,
  getZipCode,
  getPhoneNumber,
  getEmailInput,
  getEmailConfirmationInput,
  getSubjectInput,
  getMessageTopic,
  getMessage
} from '../../../lib/selectors';




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
  { dev: false});
    
    return NextResponse.json({ 
      message: 'Suckcess' 
    });
  } catch (_erorr) {
    return NextResponse.json(
      { error: 'Failed to process request or open browser' },
      { status: 500 }
    );
  }
} 