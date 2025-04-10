const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
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
        // required: true, 
        // trim: true 
    },
    email: { 
        type: String, 
        required: true, 
        unique: true, 
        trim: true, 
        match: [/^\S+@\S+\.\S+$/, "Invalid email format"] 
    },
    activeStatus: { 
        type: Boolean, 
        default: false 
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
        city: { type: String, trim: true, default: null },  // City/Town
        stateOrProvince: { type: String, trim: true, default: null },  // State, province, or region
        country: { 
            type: String, 
            trim: true, 
            // required: true, 
            match: [/^[A-Z]{2,3}$/, "Invalid country code"],
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
