const mongoose = require("mongoose");

const preferencesFieldsSchema = new mongoose.Schema({
  label: {
    type: String,
    required: true,
  },
  profileField: {
    type: String,
    required: true,
  },
  clientTypes: {
    type: String,
    default: "General",
  },
  weight: {
    type: String,
    enum: ["Low", "Medium", "High"],
    default: "Medium",
  },
  useInMatch: {
    type: Boolean,
    default: false,
  },
  choices: {
    type: [String],
  },
  helpText: {
    type: String,
    default: "",
  },
  dealBreak: {
    type: Boolean,
    default: false,
  },
  preferencesGroupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PreferencesGroup",
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
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
}, { timestamps: true });

const PreferencesFields = mongoose.model("PreferencesFields", preferencesFieldsSchema);

module.exports = PreferencesFields;
