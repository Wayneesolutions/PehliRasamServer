const mongoose = require("mongoose");

const submissionFormSchema = new mongoose.Schema({
  formName: { 
    type: String, 
    // required: [true, "Form name is required"], 
    trim: true 
  },
  BasicDetail: {
    firstName: { 
      type: String, 
      dedault: null,
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
      // required: true, 
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
      // required: true, 
      unique: true, 
      trim: true, 
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"] 
  },
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
  },
  ProfileDetails: [{  
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FormGroup",
      required: true,
    },
    fields: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "FormField",
    }]
  }],
  matchDetails: [{  
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PreferencesGroup",
      required: true,
    },
    fields: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "PreferencesFields",
    }]
  }],
  status: { 
    type: String, 
    enum: ["active", "inactive"], 
    default: "active" 
  },
  isDeleted: { 
    type: Boolean, 
    default: false 
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  updatedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User" 
  }
}, { timestamps: true });

const SubmissionForm = mongoose.model("SubmissionForm", submissionFormSchema);

module.exports = SubmissionForm;



