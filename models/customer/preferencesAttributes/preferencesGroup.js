const mongoose = require("mongoose");

const preferencesGroupSchema = new mongoose.Schema({
  name: {
    type: String,
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

const PreferencesGroup = mongoose.model("PreferencesGroup", preferencesGroupSchema);

module.exports = PreferencesGroup;
