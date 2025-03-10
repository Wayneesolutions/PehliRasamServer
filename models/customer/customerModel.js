const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    fistName: { type: String, required: true, minlength: 3, maxlength: 50, trim: true },
    lastName: { type: String, required: true, minlength: 3, maxlength: 50, trim: true },
    email: { type: String, required: true, trim: true, match: /\S+@\S+\.\S+/ },
//    personalDetails: {
//        fullName: { type: String, required: true, minlength: 3, maxlength: 50, trim: true },
//        email: { type: String, required: true, trim: true, match: /\S+@\S+\.\S+/ },
//        contactNumber: { type: String, required: true, trim: true, match: /^\d{10,15}$/ },
//        country: { type: String, required: true, trim: true },
//        location: { type: String, required: true, trim: true },
//    },
//    matchPreferences: {
//         preferredGender: { type: String, enum: ['Male', 'Female', 'Other'] },
//         preferredReligion: { type: String },
//         preferredAgeRange: {
//             min: { type: Number, min: 18, max: 100 },  // Example: 25
//             max: { type: Number, min: 18, max: 100 }   // Example: 30
//         },
//         preferredHeight: {
//             min: { type: Number, min: 100, max: 250 },  // Example: height in cm (like 150)
//             max: { type: Number, min: 100, max: 250 }   // Example: 180
//         },
//         caste: { type: String },
//         cityPreferred: { type: String },
//         preferredAppearance: { type: String },
//         maritalStatusPreference: { type: String, enum: ['Single', 'Married', 'Divorced', 'Widowed', 'Any'] },
//         educationPreference: { type: String },
//         employmentPreference: { type: String },
//         vegetarianPreference: { type: Boolean },
//         drinkAlcohol: { type: Boolean }
//     },
    isDeleted: {type: Boolean, default: false}
//    allDetails: [dynamicFieldSchema] // Flexible array of dynamic fields
}, { timestamps: true });


module.exports = mongoose.model('Customer', customerSchema);