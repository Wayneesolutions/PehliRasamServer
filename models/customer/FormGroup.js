const mongoose = require("mongoose");

const formGroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
}, { timestamps: true });

const FormGroup = mongoose.model("FormGroup", formGroupSchema);

module.exports = FormGroup;
