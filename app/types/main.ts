type RepName = 'Senator Adam Schiff' | 'Liccardo' | 'Senator Alex Padilla';
export interface Representative {
    name: RepName;
    email: string;
    buttonColor: string;
    hoverColor: string;
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