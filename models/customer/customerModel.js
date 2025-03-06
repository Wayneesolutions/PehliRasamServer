const mongoose = require('mongoose');


// Dynamic field schema that allows different data types.
const dynamicFieldSchema = new mongoose.Schema({
   groupId: {
       type: mongoose.Schema.Types.ObjectId,
       ref: "FormGroup",
       required: true,
   },
   fieldId: {
       type: mongoose.Schema.Types.ObjectId,
       ref: "FormField",
       required: true,
   },
   value: {
       type: mongoose.Schema.Types.Mixed, // Accepts String, Number, Date, etc.
       required: true,
   }
}, { _id: false }); // _id is optional inside subdocuments if unnecessary


// Main Customer Schema
const customerSchema = new mongoose.Schema({
   personalDetails: {
       fullName: { type: String, required: true, minlength: 3, maxlength: 50, trim: true },
       email: { type: String, required: true, trim: true, match: /\S+@\S+\.\S+/ },
       contactNumber: { type: String, required: true, trim: true, match: /^\d{10,15}$/ },
       country: { type: String, required: true, trim: true },
       location: { type: String, required: true, trim: true },
   },
   matchPreferences: {
        preferredGender: { type: String, enum: ['Male', 'Female', 'Other'] },
        preferredReligion: { type: String },
        preferredAgeRange: {
            min: { type: Number, min: 18, max: 100 },  // Example: 25
            max: { type: Number, min: 18, max: 100 }   // Example: 30
        },
        preferredHeight: {
            min: { type: Number, min: 100, max: 250 },  // Example: height in cm (like 150)
            max: { type: Number, min: 100, max: 250 }   // Example: 180
        },
        caste: { type: String },
        cityPreferred: { type: String },
        preferredAppearance: { type: String },
        maritalStatusPreference: { type: String, enum: ['Single', 'Married', 'Divorced', 'Widowed', 'Any'] },
        educationPreference: { type: String },
        employmentPreference: { type: String },
        vegetarianPreference: { type: Boolean },
        drinkAlcohol: { type: Boolean }
    },
   allDetails: [dynamicFieldSchema] // Flexible array of dynamic fields
}, { timestamps: true });


module.exports = mongoose.model('Customer', customerSchema);