import z from 'zod';

export const customerSchema = z.object({
    name: z.string().min(3).max(50),
    email: z.string().email().min(3).max(50),
    contact: z.string().min(3).max(20).regex(/^\+?[1-9]\d{1,14}$/),
    location: z.string().min(3).max(100),
    countryCode: z.string().length(2),
    latlng: z.tuple([z.number(), z.number()]),

    // Optional fields
    profileNote: z.string().optional(),
    profileMadeBy: z.enum(['Self', 'Father', 'Mother', 'Brother', 'Sister', 'Cousin', 'Friend', 'Relative', 'Uncle', 'Aunty', 'Other']).optional(),
    memberShipType: z.enum(['Active Client', 'Free Member', 'Inactive', 'Deactivated', 'Refund', 'Old Paid Member', 'Profile on Hold']).optional(),
    registrationDate: z.union([z.date(), z.string().datetime()]).optional(),
    specialNotesBoutProfile: z.string().optional(),
    customerService: z.string().optional(),
    registeredBy: z.string().min(3).max(50).optional(),
    amount: z.number().nonnegative().optional(),
    appearance: z.enum(['Hair-cut', 'Turbaned(with trimmed beard)', 'Gursikh', 'Clean Shaven', 'Amrit-Dhari', 'Female Profile']).optional(),
    imgURL: z.string().url().optional(),
    imageURL: z.string().url().optional(),

    gender: z.enum(['Male', 'Female']).optional(),
    religion: z.enum(['Sikh', 'Hindu', 'Jain', 'Muslim', 'Christain']).optional(),
    subcaste: z.string().optional(),
    birthDay: z.union([z.date(), z.string().datetime()]).optional(),
    timeofbirth: z.string().optional(),
    height: z.number().positive().optional(),
    maritalStatus: z.enum([
        'Never Married', 'Divorced', 'Windowed', 'Separated', 'Annulled',
        'Divorced(1 child , Living Together)', 'Divorced(2 children , Living Together)', 'Divorced(3 children , Living Together)',
        'Awaiting Divorce', 'Widowed(1 child , Living Together)', 'Divorced(Without child)'
    ]).optional(),
    moreAboutMartialStatus: z.string().optional(),
    vegetarian: z.enum(['Yes', 'No']).optional(),
    doYouDrinkAlcohol: z.enum(['Yes', 'No']).optional(),
    doYouSmoke: z.enum(['Yes', 'No']).optional(),

    phoneNumber: z.string().min(7).max(15).regex(/^\d+$/).optional(),
    userCode: z.string().min(1).max(10).regex(/^\d+$/).optional(),

    nameOfHighSchool: z.string().optional(),
    education: z.string().optional(),
    employment: z.string().optional(),
    income: z.number().nonnegative().optional(),
    profession: z.string().optional(),

    familyAffluenceLevel: z.string().optional(),
    fatherEmployment: z.string().optional(),
    motherEmployment: z.string().optional(),
    otherFamilyDetails: z.string().optional(),
    fatherName: z.string().optional(),
    motherName: z.string().optional(),

    residencyStatus: z.string().optional(),
    livingInSince: z.string().optional(),
    countryLiving: z.string().optional(),
    countryGrewUpIn: z.string().optional(),
    propertyDetails: z.string().optional()
});
