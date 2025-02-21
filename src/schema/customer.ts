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
    imgURL: z.array(z.string().min(2).max(150)),
    imageURL: z.string(),

    gender: z.enum(['Male', 'Female']),
    religion: z.enum(['Sikh', 'Hindu', 'Jain', 'Buddhist', 'Spiritual', 'Muslim', 'Christain', 'Other']),
    subcaste: z.enum([
        'Ad Dharmi',
        'Ahluwalia',
        'Arora',
        'Baazigar',
        'Bhatia',
        'Bhatra',
        'Brahmin',
        'Baniya',
        'Chimba',
        'Ghumar',
        'Gujjar',
        'Sunyar (Gold Smith)',
        'Hindu Punjabi',
        'Intercaste',
        'Jatt (Sikh)',
        'Julahe',
        'Jain',
        'Jaat (Hindu)',
        'Kabir Panthi',
        'Kamboj',
        'Kashyap Rajput',
        'Khatri',
        'Kshatriya',
        'Lubana',
        'Mahajan',
        'Maid Rajput',
        'Mair Rajput',
        'Majabi',
        'Nai',
        'Parjapat',
        'Rai',
        'Rajput',
        'Ramdasia',
        'Ramgharia',
        'Ravidasia',
        'Saini',
        'Tonk Khatriya',
        'Other'
    ]).optional(),
    birthDay: z.union([z.date(), z.string().datetime()]),
    timeofbirth: z.string().optional(),
    height: z
        .string()
        .regex(/^([4-7])'([0-9]|10|11)"$/, "Invalid height format")
        .optional(),
    maritalStatus: z.enum([
        'Never Married', 'Divorced', 'Windowed', 'Separated', 'Annulled',
        'Divorced(1 child , Living Together)', 'Divorced(2 children , Living Together)', 'Divorced(3 children , Living Together)',
        'Awaiting Divorce', 'Widowed(1 child , Living Together)', 'Divorced(Without child)'
    ]),
    moreAboutMartialStatus: z.string().optional(),
    vegetarian: z.enum(['Yes', 'No']).optional(),
    doYouDrinkAlcohol: z.enum(['Yes,occasionally', 'yes,regularly', 'No']).optional(),
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
    propertyDetails: z.string().optional(),

    moreAboutPartnerPreference: z.string().optional(),
    memeberStatus: z.string().optional(),
    preferredGender: z.enum(['Male', 'Female']),
    preferredAge: z.object({
        min: z.number()
            .min(18, "Minimum age must be 18")
            .optional(),
        max: z.number()
            .min(18, "Minimum age must be 18")
            .optional()
    }).superRefine(({ min, max }, ctx) => {
        if (min !== undefined && max !== undefined && max < min) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Max age must be greater than or equal to min age",
                path: ["max"]
            });
        }
    }).optional(),

    preferredHeight: z.object({
        min: z.number()
            .min(48, "Minimum height should be 4'0\" (48 inches)")
            .max(96, "Maximum height should be 8'0\" (96 inches)")
            .optional(),
        max: z.number()
            .min(48, "Minimum height should be 4'0\" (48 inches)")
            .max(96, "Maximum height should be 8'0\" (96 inches)")
            .optional()
    }).superRefine(({ min, max }, ctx) => {
        if (min !== undefined && max !== undefined && max < min) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Max height must be greater than or equal to min height",
                path: ["max"]
            });
        }
    }).optional(),

    preferredReligion: z.enum(['Sikh', 'Hindu', 'Jain', 'Muslim', 'Buddhist', 'Spiritual', 'Christain', 'Not Matter']),
    preferredSubcaste: z.enum([
        'Ad Dharmi',
        'Ahluwalia',
        'Arora',
        'Baazigar',
        'Bhatia',
        'Bhatra',
        'Brahmin',
        'Baniya',
        'Chimba',
        'Ghumar',
        'Gujjar',
        'Sunyar (Gold Smith)',
        'Hindu Punjabi',
        'Intercaste',
        'Jatt (Sikh)',
        'Julahe',
        'Jain',
        'Jaat (Hindu)',
        'Kabir Panthi',
        'Kamboj',
        'Kashyap Rajput',
        'Khatri',
        'Kshatriya',
        'Lubana',
        'Mahajan',
        'Maid Rajput',
        'Mair Rajput',
        'Majabi',
        'Nai',
        'Parjapat',
        'Rai',
        'Rajput',
        'Ramdasia',
        'Ramgharia',
        'Ravidasia',
        'Saini',
        'Tonk Khatriya',
        'Other'
    ]).optional(),
    residencyPreferrence: z.string().optional(),
    countryPreferred: z.string().optional(),
    cityPreferred: z.enum([
        'Amritsar',
        'Barnala',
        'Bathinda',
        'Dera Bassi',
        'Delhi',
        'Chandigarh',
        'Faridkot',
        'Fatehgarh Sahib',
        'Firozpur',
        'Gurdaspur',
        'Gujarat',
        'Hoshiarpur',
        'Himachal Pradesh',
        'Haryana',
        'Jalandhar',
        'Jammu and Kashmir',
        'Kapurthala',
        'Khanna',
        'Ludhiana',
        'Mansa',
        'Moga',
        'Muktsar(Sri Muktsar Sahib)',
        'Nakodar',
        'Patiala',
        'Phagwara',
        'Rupnagar',
        'Rajasthan',
        '(Mohali)Sahibzada Ajit Singh Nagar',
        'Sangrur',
        '(Nawanshahr)Shahid Bhagat Singh Nagar',
        'Tarn Taran',
        'Uttarakhand',
        'Uttar Pradesh',
        'Zirakpur'
    ]).optional(),
    preferredAppearance: z.enum(['Hair-cut', 'Turbaned(with trimmed beard)', 'Gursikh', 'Clean Shaven', 'Amrit-Dhari', 'Female Profile']).optional(),
    maritalStatusPreference: z.enum([
        'Never Married', 'Divorced', 'Windowed', 'Separated', 'Annulled',
        'Divorced(1 child , Living Together)', 'Divorced(2 children , Living Together)', 'Divorced(3 children , Living Together)',
        'Awaiting Divorce', 'Widowed(1 child , Living Together)', 'Divorced(Without child)'
    ]).optional(),
    educationPreferrence: z.enum([
        'High School',
        'Senior Secondary School',
        'Graduation - Bachelor’s degree, BA, BSc, BCom etc.',
        'Post-Graduation - Master’s degree, MA, MSc, MCom etc.',
        'Doctorate - PhD'
    ]).optional(),
    employmentPreferrence: z.enum(['Private Sector',
        'Government Job',
        'Businessman',
        'Self-Employed',
        'Freelancer',
        'Student',
        'Retired',
        'Homemaker',
        'Consultant',
        'Part-Time Worker']).optional(),
    vegetarianPreferrence: z.enum(['Yes', 'No']).optional(),
    drinkAlcoholPreferrence: z.enum(['Yes,occasionally', 'yes,regularly', 'No']).optional(),

});
