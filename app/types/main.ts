import type { ObjectId } from 'mongodb';

type RepName = 'Senator Adam Schiff' | 'Liccardo' | 'Senator Alex Padilla';
export interface Representative {
    name: RepName;
    email: string;
    buttonColor: string;
    hoverColor: string;
    countField?: 'schiff' | 'padilla';
}

export interface EmailContent {
    subject: string;
    body: string;
    representative: RepName;
}

export interface UserInfo {
    firstName: string;
    lastName: string;
    addressOne: string;
    addressTwo: string;
    city: string;
    state: string;
    zipCode: string;
    phoneNumber: string;
    email: string;
}

export interface Subscriber {
    _id?: ObjectId;
    userInfo: UserInfo;
    rep: 'Schiff' | 'Padilla';
    emailSubject: string;
    emailBody: string;
    sendsPerWeek: 2 | 3;
    active: boolean;
    verified: boolean;
    verifyToken: string;
    unsubscribeToken: string;
    lastSentAt: Date | null;
    nextSendAt: Date;
    createdAt: Date;
}