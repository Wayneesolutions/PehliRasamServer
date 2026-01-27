const mongoose = require("mongoose");

const matchGroupValueSchema = new mongoose.Schema({
  matchGroupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "MatchGroup",
    required: true,
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
  },
  matchCustomerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
  },
  matchingDescription: {
    type: String,
    default: "",
  },
  notes: {
    type: String,
    default: "",
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
  },
  editedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

const MatchGroupValue = mongoose.model("MatchGroupValue", matchGroupValueSchema);
module.exports = MatchGroupValue;
