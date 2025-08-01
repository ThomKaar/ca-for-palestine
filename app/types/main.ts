export interface Representative {
    name: string;
    email: string;
    buttonColor: string;
    hoverColor: string;
}

export interface EmailContent {
    subject: string;
    body: string;
    representative: 'Schiff' | 'Liccardo' | 'Padilla';
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