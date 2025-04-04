const mongoose = require("mongoose");

const submissionFormSchema = new mongoose.Schema({
  formName: { 
    type: String, 
    required: [true, "Form name is required"], 
    trim: true 
  },
  clientDetails: [{  
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



