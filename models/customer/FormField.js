const mongoose = require("mongoose");

const formFieldSchema = new mongoose.Schema({
  attributeName: {
    type: String,
    required: true,
  },
  attributeType: {
    type: String,
    enum: ["text", "select", "number", "date", "radio", "checkbox"],
    required: true,
  },
  attributeStatus: {
    type: Boolean,
    default: true, // Active by default
  },
  attributePlaceHolder: {
    type: String,
    default: "",
  },
  attributeEnum: [{
    type: String,
  }],
  attributeOption: [{
    label: String,
    value: String,
  }],
  form_group_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "FormGroup",
    required: true,
  },
  isActive: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

const FormField = mongoose.model("FormField", formFieldSchema);

module.exports = FormField;
