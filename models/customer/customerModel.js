const mongoose = require('mongoose');


const allowedCities = [
    "Amritsar",
    "Barnala",
    "Bathinda",
    "Dera Bassi",
    "Delhi",
    "Chandigarh",
    "Faridkot",
    "Fatehgarh Sahib",
    "Firozpur",
    "Gurdaspur",
    "Gujarat",
    "Hoshiarpur",
    "Himachal Pradesh",
    "Haryana",
    "Jalandhar",
    "Jammu and Kashmir",
    "Kapurthala",
    "Khanna",
    "Ludhiana",
    "Mansa",
    "Moga",
    "Muktsar(Sri Muktsar Sahib)",
    "Nakodar",
    "Patiala",
    "Phagwara",
    "Rupnagar",
    "Rajasthan",
    "(Mohali)Sahibzada Ajit Singh Nagar",
    "Sangrur",
    "(Nawanshahr)Shahid Bhagat Singh Nagar",
    "Tarn Taran",
    "Uttarakhand",
    "Uttar Pradesh",
    "Zirakpur"
  ];
  

const customerSchema = new mongoose.Schema({
    entryName: {
        type: String,
        trim: true,
        maxlength: 100,
        default: null
    },
    firstName: { 
        type: String, 
        required: true, 
        minlength: 3, 
        maxlength: 50, 
        trim: true 
    },
    middelName: { 
        type: String, 
        minlength: 3, 
        maxlength: 50, 
        trim: true,
        Default: null
    },
    lastName: { 
        type: String, 
        required: true, 
        minlength: 3, 
        maxlength: 50, 
        trim: true 
    },
    Number: { 
        type: Number,
        Default: null 
        // required: true, 
        // trim: true 
    },
    email: { 
        type: String, 
        Default: null,
        // unique: true, 
        trim: true, 
        match: [/^\S+@\S+\.\S+$/, "Invalid email format"] 
    },
    activeStatus: { 
        type: Boolean, 
        default: true 
    },
    isPinned: {
        type: Boolean,
        default: false
    },
    pinnedAt: {
        type: Date,
        default: null
    },
    imagePath: { 
        type: String, 
        trim: true, 
        default: null // Store the image URL or file path
    },
    photos: [
        {
            url: { type: String, trim: true }
        }
    ],
    address: { 
        street: { type: String, trim: true, default: null },  // Street address, including unit/apartment number
        city: {
            type: String,
            trim: true,
            default: ''
        },
        state: { type: String, trim: true, default: null },  // State, province, or region
        country: { 
            type: String, 
            trim: true, 
            // required: true, 
            // match: [/^[A-Z]{2,3}$/, "Invalid country code"],
            Default: null
        },
        postalCode: { 
            type: String, 
            trim: true, 
            default: null 
        }
    },
    isDeleted: { 
        type: Boolean, 
        default: false 
    },
    createdBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Admin", 
        // required: true 
    },
    updatedBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Admin"
    }
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);
