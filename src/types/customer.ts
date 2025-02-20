export interface ICustomer {
    name: string;
    email: string;
    contact: string;
    location: string;
    countryCode: string;
    latlng?: [number, number];

    profileNote?: string;
    profileMadeBy?: 'Self' | 'Father' | 'Mother' | 'Brother' | 'Sister' | 'Cousin' | 'Friend' | 'Relative' | 'Uncle' | 'Aunty' | 'Other';
    memberShipType?: 'Active Client' | 'Free Member' | 'Inactive' | 'Deactivated' | 'Refund' | 'Old Paid Member' | 'Profile on Hold';
    registrationDate?: string | Date;
    specialNotesBoutProfile?: string;
    customerService?: string;
    registeredBy?: string;
    amount?: number;
    appearance?: 'Hair-cut' | 'Turbaned(with trimmed beard)' | 'Gursikh' | 'Clean Shaven' | 'Amrit-Dhari' | 'Female Profile';
    imgURL?: string[];
    imageURL: string;

    gender?: 'Male' | 'Female';
    religion?: 'Sikh' | 'Hindu' | 'Jain' | 'Muslim' | 'Christain';
    subcaste?: string;
    birthDay?: string | Date;
    timeofbirth?: string;
    height?: string;
    maritalStatus?: 'Never Married' | 'Divorced' | 'Windowed' | 'Separated' | 'Annulled' |
    'Divorced(1 child , Living Together)' | 'Divorced(2 children , Living Together)' |
    'Divorced(3 children , Living Together)' | 'Awaiting Divorce' |
    'Widowed(1 child , Living Together)' | 'Divorced(Without child)';
    moreAboutMartialStatus?: string;
    vegetarian?: 'Yes' | 'No';
    doYouDrinkAlcohol?: 'Yes' | 'No';
    doYouSmoke?: 'Yes' | 'No';

    phoneNumber?: string;
    userCode?: string;

    nameOfHighSchool?: string;
    education?: string;
    employment?: string;
    income?: number;
    profession?: string;

    familyAffluenceLevel?: string;
    fatherEmployment?: string;
    motherEmployment?: string;
    otherFamilyDetails?: string;
    fatherName?: string;
    motherName?: string;

    residencyStatus?: string;
    livingInSince?: string;
    countryLiving?: string;
    countryGrewUpIn?: string;
    propertyDetails?: string;




    moreAboutPartnerPreference?: string;
    memeberStatus?: string;
    preferredGender?: 'Male' | 'Female';
    preferredAge?: {
        min: number;
        max: number;
    };
    preferredHeight?: {
        min: number;
        max: number;
    };
    preferredReligion?: 'Sikh' | 'Hindu' | 'Jain' | 'Muslim' | 'Christain';
    preferredSubcaste?: string;
    residencyPreferrence?: string;
    countryPreferred?: string;
    cityPreferred?: string;
    preferredAppearance?: 'Hair-cut' | 'Turbaned(with trimmed beard)' | 'Gursikh' | 'Clean Shaven' | 'Amrit-Dhari' | 'Female Profile';
    maritalStatusPreference?: 'Never Married' | 'Divorced' | 'Windowed' | 'Separated' | 'Annulled' |
    'Divorced(1 child , Living Together)' | 'Divorced(2 children , Living Together)' |
    'Divorced(3 children , Living Together)' | 'Awaiting Divorce' |
    'Widowed(1 child , Living Together)' | 'Divorced(Without child)';
    educationPreferrence?: string;
    employmentPreferrence?: string;
    vegetarianPreferrence?: 'Yes' | 'No';
    drinkAlcoholPreferrence?: 'Yes,socially' | 'yes,regularly' | 'No';
}
