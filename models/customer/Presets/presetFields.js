const mongoose = require("mongoose");

const presetFieldsSchema = new mongoose.Schema({
  // For regular FormFields, use ObjectId
  fieldsId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "FormField",
    default: null,
    required: false,
  },
  // For basic info fields, use a separate string field
  basicInfoFieldKey: {
    type: String,
    default: null,
  },
  fieldsFor: {
    type: String,
    // ref: "PreferencesFields",
  },
  // Add field to identify if this is a basic info field
  isBasicInfo: {
    type: Boolean,
    default: false,
  },
  AllowEdit: {
    type: Boolean,
    default: true,
  },
  isRequired: {
    type: Boolean,
    default: false,
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
  presetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Preset", // Refers to the Preset model
  },
  order: {
    type: Number,
    default: 0
  }
}, { 
  timestamps: true
});

const PresetFields = mongoose.model("PresetFields", presetFieldsSchema);

module.exports = PresetFields;
