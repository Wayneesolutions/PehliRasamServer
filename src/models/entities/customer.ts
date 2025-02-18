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
        imgURL: { type: String, default: null },
        imageURL: { type: String, default: null },

        gender: { type: String, enum: ['Male', 'Female'], default: null },
        religion: { type: String, enum: ['Sikh', 'Hindu', 'Jain', 'Muslim', 'Christain'], default: null },
        subcaste: { type: String, default: null },
        birthDay: { type: Date, default: null },
        timeofbirth: { type: String, default: null },
        height: { type: Number, min: 0, default: null },
        maritalStatus: {
            type: String,
            enum: ['Never Married', 'Divorced', 'Windowed', 'Separated', 'Annulled', 'Divorced(1 child , Living Together)', 'Divorced(2 children , Living Together)', 'Divorced(3 children , Living Together)', 'Awaiting Divorce', 'Widowed(1 child , Living Together)', 'Divorced(Without child)'],
            default: null
        },
        moreAboutMartialStatus: { type: String, default: null },
        vegetarian: { type: String, enum: ['Yes', 'No'], default: null },
        doYouDrinkAlcohol: { type: String, enum: ['Yes', 'No'], default: null },
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
        propertyDetails: { type: String, default: null }
    },
    {
        timestamps: true,
    }
);

const Customer = mongoose.model('Customers', customerSchema);
export default Customer;
