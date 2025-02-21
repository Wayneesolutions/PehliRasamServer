import mongoose, { Schema } from 'mongoose';

const customerSchema = new Schema(
    {
        name: { type: String, required: true, minlength: 3, maxlength: 50 },
        email: { type: String, required: true, unique: true, minlength: 3, maxlength: 50 },
        contact: {
            type: String,
            required: true,
            minlength: 3,
            maxlength: 20,
            match: /^\+?[1-9]\d{1,14}$/
        },
        location: { type: String, required: true, minlength: 3, maxlength: 100 },
        countryCode: { type: String, required: true, length: 2 },
        latlng: { type: [Number], default: null, required: true },

        // Optional fields
        profileNote: { type: String, default: null },
        profileMadeBy: { type: String, enum: ['Self', 'Father', 'Mother', 'Brother', 'Sister', 'Cousin', 'Friend', 'Relative', 'Uncle', 'Aunty', 'Other'], default: null },
        memberShipType: { type: String, enum: ['Active Client', 'Free Member', 'Inactive', 'Deactivated', 'Refund', 'Old Paid Member', 'Profile on Hold'], default: null },
        registrationDate: { type: Date, default: Date.now },
        specialNotesBoutProfile: { type: String, default: null },
        customerService: { type: String, default: null },
        registeredBy: { type: String, minlength: 3, maxlength: 50, default: null },
        amount: { type: Number, min: 0, default: null },
        appearance: { type: String, enum: ['Hair-cut', 'Turbaned(with trimmed beard)', 'Gursikh', 'Clean Shaven', 'Amrit-Dhari', 'Female Profile'], default: null },
        imgURL: { type: Array, required: true },

        gender: { type: String, enum: ['Male', 'Female'], required: true },
        religion: { type: String, enum: ['Sikh', 'Hindu', 'Jain', 'Muslim', 'Buddhist', 'Spiritual', 'Christain', 'Other'], required: true },
        subcaste: {
            type: String, enum: [
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
            ], default: null
        },
        birthDay: { type: Date, default: null },
        timeofbirth: { type: String, default: null },
        height: {
            type: String,
            match: /^([4-7])'([0-9]|10|11)"$/,
            default: null
        },
        maritalStatus: {
            type: String,
            enum: ['Never Married', 'Divorced', 'Windowed', 'Separated', 'Annulled', 'Divorced(1 child , Living Together)', 'Divorced(2 children , Living Together)', 'Divorced(3 children , Living Together)', 'Awaiting Divorce', 'Widowed(1 child , Living Together)', 'Divorced(Without child)'],
            default: null
        },
        moreAboutMartialStatus: { type: String, default: null },
        vegetarian: { type: String, enum: ['Yes', 'No'], default: null },
        doYouDrinkAlcohol: { type: String, enum: ['Yes,occasionally', 'yes,regularly', 'No'], default: null },
        doYouSmoke: { type: String, enum: ['Yes', 'No'], default: null },
        phoneNumber: { type: Number, default: null },
        userCode: { type: Number, default: null },

        nameOfHighSchool: { type: String, default: null },
        education: { type: String, default: null },
        employment: { type: String, default: null },
        income: { type: Number, min: 0, default: null },
        profession: { type: String, default: null },

        familyAffluenceLevel: { type: String, default: null },
        fatherEmployment: { type: String, default: null },
        motherEmployment: { type: String, default: null },
        otherFamilyDetails: { type: String, default: null },
        fatherName: { type: String, default: null },
        motherName: { type: String, default: null },

        residencyStatus: { type: String, default: null },
        livingInSince: { type: String, default: null },
        countryLiving: { type: String, default: null },
        countryGrewUpIn: { type: String, default: null },
        propertyDetails: { type: String, default: null },

        //match preference
        moreAboutPartnerPreference: { type: String, default: null },
        memeberStatus: { type: String, default: null },
        preferredGender: { type: String, enum: ['Male', 'Female'], required: true },
        preferredAge: {
            min: { type: Number, min: 18, default: null, required: false },
            max: { type: Number, default: null, required: false }
        },
        preferredHeight: {
            min: { type: Number, min: 49, default: null, required: false },
            max: { type: Number, default: null, required: false }
        },
        preferredReligion: { type: String, enum: ['Sikh', 'Hindu', 'Jain', 'Muslim', 'Christain', 'Buddhist', 'Spiritual', 'Not Matter'], required: true },
        preferredSubcaste: {
            type: String, enum: [
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
            ], default: null
        },
        residencyPreferrence: { type: String, default: null },
        countryPreferred: { type: String, default: null },
        cityPreferred: {
            type: String, enum: [
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
            ], default: null
        },
        preferredAppearance: { type: String, enum: ['Hair-cut', 'Turbaned(with trimmed beard)', 'Gursikh', 'Clean Shaven', 'Amrit-Dhari', 'Female Profile'], default: null },
        maritalStatusPreference: {
            type: String,
            enum: ['Never Married', 'Divorced', 'Windowed', 'Separated', 'Annulled', 'Divorced(1 child , Living Together)', 'Divorced(2 children , Living Together)', 'Divorced(3 children , Living Together)', 'Awaiting Divorce', 'Widowed(1 child , Living Together)', 'Divorced(Without child)'],
            default: null
        },
        educationPreferrence: {
            type: String, enum: [
                'High School',
                'Senior Secondary School',
                'Graduation - Bachelor’s degree, BA, BSc, BCom etc.',
                'Post-Graduation - Master’s degree, MA, MSc, MCom etc.',
                'Doctorate - PhD'
            ], default: null
        },
        employmentPreferrence: {
            type: String, enum: ['Private Sector',
                'Government Job',
                'Businessman',
                'Self-Employed',
                'Freelancer',
                'Student',
                'Retired',
                'Homemaker',
                'Consultant',
                'Part-Time Worker'], default: null
        },
        vegetarianPreferrence: { type: String, enum: ['Yes', 'No'], default: null },
        drinkAlcoholPreferrence: { type: String, enum: ['Yes,occasionally', 'yes,regularly', 'No'], default: null },
    },
    {
        timestamps: true,
    }
);

const Customer = mongoose.model('Customers', customerSchema);
export default Customer;
