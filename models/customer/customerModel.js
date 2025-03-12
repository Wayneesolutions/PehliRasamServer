const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    firstName: { 
        type: String, 
        required: true, 
        minlength: 3, 
        maxlength: 50, 
        trim: true 
    },
    lastName: { 
        type: String, 
        required: true, 
        minlength: 3, 
        maxlength: 50, 
        trim: true 
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
