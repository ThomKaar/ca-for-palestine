'use client';

import './styles/page.css';
import { useState } from 'react';
import type { Representative, EmailContent, UserInfo } from './types/main.ts';
const env = process.env.NODE_ENV || 'development';

const REPRESENTATIVES: Representative[] = [
  {
    name: 'Sam Liccardo CA-16 District Rep',
    email: 'sam.liccardo@sanjoseca.gov',
    buttonColor: 'bg-green-600',
    id: 'sLiccardo',
    hoverColor: 'hover:bg-green-500',
  },
  {
    name: 'Senator Adam Schiff',
    email: 'adam.schiff@mail.house.gov',
    buttonColor: 'bg-black',
    id: 'aSchiff',
    hoverColor: 'hover:bg-gray-800',
  },
  {
    name: 'Senator Alex Padilla',
    email: 'alex.padilla@senate.gov',
    buttonColor: 'bg-red-600',
    id: 'aPadilla',
    hoverColor: 'hover:bg-red-500',
  },
];

const launchEmail = async ({ emailContent, userInfo }: { emailContent: EmailContent, userInfo: UserInfo }) => {
  const { subject, body } = emailContent;

  const response = await fetch('/api/submit-form', {
    method: 'POST',
    body: JSON.stringify({ subject, body, userInfo }),
  });
};

export default function Home() {
  const [, setEmailGenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [emailContent, setEmailContent] = useState<EmailContent | null>(null);
  const [, setSelectedRepresentative] = useState<Representative | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo>({
    firstName: '',
    lastName: '',
    addressOne: '',
    addressTwo: '',
    city: '',
    state: 'California',
    zipCode: '',
    phoneNumber: '',
    email: '',
  });

  const generateEmail = async (rep: Representative) => {
    setIsGenerating(rep.name);
    let response;
    // const isDev = env === 'development';
    const isDev = false;
    try {
      if (!isDev) {
        response = await fetch('/api/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ representative: rep.name }),
        });
      }

      if (!isDev && !response?.ok ) {
        throw new Error('Failed to generate email');
      }

      const data = !isDev && await response?.json();
      setEmailContent({
        subject: isDev ?  'test subject' : data.subject,
        body: isDev ? 'test body' : data.body,
        representative: rep.name,
      });
      setEmailGenerated(true);
    } catch (error) {
      console.error('Error generating email:', error);

    } finally {
      setIsGenerating(null);
    }
  };

  return (
     <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50 relative">
      <div className="max-w-2xl w-full text-center space-y-8">
        {!emailContent && (
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Contact Mountain View Representatives to Stop the Genocide in Palestine
          </h1>
        
        <p className="text-lg text-gray-700 mb-8">
          Use ChatGPT to generate emails to our representatives calling to stop the genocide of Palestinians.
        </p>

        <div className="flex flex-col gap-4">
          {REPRESENTATIVES.map((rep) => (
            <div key={rep.name} className="flex items-center gap-2">
              <button
                onClick={() => {
                  setSelectedRepresentative(rep);
                  generateEmail(rep);
                }}
                disabled={isGenerating !== null}
                className={`flex-1 ${rep.buttonColor} ${rep.hoverColor} text-white font-bold py-4 px-8 rounded-lg text-lg transition-colors duration-200 flex items-center justify-center gap-2 ${isGenerating !== null ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span>Send an Email to {rep.name}</span>
                {isGenerating === rep.name ? (
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                )}
              </button>
            </div>
          ))}
        </div>
          </div>
        )}
        

        {emailContent && (
          <div className="mt-8 space-y-4 text-left text-gray-700 absolute top-0  z-2 left-0 w-full p-6 shadow-lg rounded-lg bg-black opacity-50 flex items-center justify-center">
            <div className="pg-white-100 p-6 rounded-lg shadow-md z-3 opacity-100 bg-white w-3/5">
              <div className="space-y-2">
                <label htmlFor="subject" className="block text-sm font-medium">
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  value={emailContent.subject}
                  onChange={(e) => setEmailContent({ ...emailContent, subject: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="body" className="block text-sm font-medium">
                  Email Body
                </label>
                <textarea
                  id="body"
                  value={emailContent.body}
                  onChange={(e) => setEmailContent({ ...emailContent, body: e.target.value })}
                  rows={12}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    id="firstName"                  
                    required
                    value={userInfo.firstName}
                    onChange={(e) => setUserInfo({ ...userInfo, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
              </div>
              <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    required
                    value={userInfo.lastName}
                    onChange={(e) => setUserInfo({ ...userInfo, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  value={userInfo.email}
                  onChange={(e) => setUserInfo({ ...userInfo, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                    Address *
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    value={userInfo.addressOne}
                    onChange={(e) => setUserInfo({ ...userInfo, addressOne: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
              </div>
              <div>
                  <label htmlFor="address2" className="block text-sm font-medium text-gray-700 mb-1">
                    Address Line 2 (optional)
                  </label>
                  <input
                    type="text"
                    id="address2"
                    value={userInfo.addressTwo}
                    onChange={(e) => setUserInfo({ ...userInfo, addressTwo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
              </div>
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  id="city"
                  required
                  value={userInfo.city}
                  onChange={(e) => setUserInfo({ ...userInfo, city: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label htmlFor="zip" className="block text-sm font-medium text-gray-700 mb-1">
                  ZipCode *
                </label>
                <input
                  type="text"
                  id="zip"
                  placeholder='Zip Code (e.g. 94040)'
                  required
                  value={userInfo.zipCode}
                  onChange={(e) => setUserInfo({ ...userInfo, zipCode: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  id="phone"
                  pattern="^\+?[1-9]\d{1,14}$"
                  placeholder="If you don't include a phone number, we'll use an anonymous number."
                  value={userInfo.phoneNumber}
                  onChange={(e) => setUserInfo({ ...userInfo, phoneNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <button
                onClick={() => launchEmail({ emailContent, userInfo })}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <span>Send Email</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};
