export interface ICustomer {
    name: string;
    email: string;
    contact: string;
    location: string;
    latlng: [number, number];
    countryCode: string;

    profileNote: string;
    profileMadeBy: 'Self' | 'Father' | 'Mother' | 'Brother' | 'Sister' | 'Cousin' | 'Friend' | 'Relative' | 'Uncle' | 'Aunty' | 'Other';
    memberShipType: 'Active Client' | 'Free Member' | 'Inactive' | 'Deactivated' | 'Refund' | 'Old Paid Member' | 'Profile on Hold';
    registrationDate: Date;
    specialNotesBoutProfile: string;
    customerService: string;
    registeredBy: string;
    amount: number;
    appearance: 'Hair-cut' | 'Turbaned(with trimmed beard)' | 'Gursikh' | 'Clean Shaven' | 'Amrit-Dhari' | 'Female Profile';
    imgURL: string;
    imageURL: string;

    gender: 'Male' | 'Female';
    caste: 'Sikh' | 'Hindu' | 'Jain' | 'Muslim' | 'Christain';
    subcaste: string;
    birthDay: Date;
    timeofbirth: string;
    height: number;
    maritalStatus: 'Never Married' | 'Divorced' | 'Windowed' | 'Separated' | 'Annulled' | 'Divorced(1 child , Living Together)' | 'Divorced(2 children , Living Together)' | 'Divorced(3 children , Living Together)' | 'Awaiting Divorce' | 'Widowed(1 child , Living Together)' | 'Divorced(Without child)'
    



}
