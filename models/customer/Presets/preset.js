const mongoose = require("mongoose");

const presetSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
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
  order: {
    type: Number,
    default: 0
  },
}, { timestamps: true });

const Preset = mongoose.model("Preset", presetSchema);

module.exports = Preset;
