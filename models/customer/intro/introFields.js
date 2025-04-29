const mongoose = require("mongoose");

const introFieldsSchema = new mongoose.Schema({
  fieldId: {
    type: mongoose.Schema.Types.ObjectId,
    // ref: "FormField",
  },
  fieldsFor: {
    type: String,
    // Optionally validate against enums or define related model
  },
  editedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  introId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Intro", // Refers to the Intro model
  }
}, { timestamps: true });

const IntroFields = mongoose.model("IntroFields", introFieldsSchema);

module.exports = IntroFields;
