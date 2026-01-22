const mongoose = require("mongoose");

const formGroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true
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
    default: false
  },
  order: {
    type: Number,
    default: 0
  },
}, { timestamps: true });

const FormGroup = mongoose.model("FormGroup", formGroupSchema);

module.exports = FormGroup;
