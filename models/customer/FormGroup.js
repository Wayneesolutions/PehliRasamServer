const mongoose = require("mongoose");

const formGroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: false
  },
  editedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
  }
}, { timestamps: true });

const FormGroup = mongoose.model("FormGroup", formGroupSchema);

module.exports = FormGroup;
