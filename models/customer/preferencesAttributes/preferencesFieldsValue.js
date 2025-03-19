const mongoose = require("mongoose");

const preferencesFieldsValueSchema = new mongoose.Schema({
  preferencesGroupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PreferencesGroup",
    required: true,
  },
  preferencesFieldId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PreferencesFields",
    required: true,
  },
  value: {
    type: String,
    required: true,
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true,
  },
}, { timestamps: true });

const PreferencesFieldsValue = mongoose.model("PreferencesFieldsValue", preferencesFieldsValueSchema);

module.exports = PreferencesFieldsValue;
