const mongoose = require("mongoose");

const presetFieldsSchema = new mongoose.Schema({
  fieldsId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "FormField",
  },
  fieldsFor: {
    type: String,
    // ref: "PreferencesFields",
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
  }
}, { timestamps: true });

const PresetFields = mongoose.model("PresetFields", presetFieldsSchema);

module.exports = PresetFields;
