const mongoose = require("mongoose");

const matchGroupSchema = new mongoose.Schema({
  groupName: {
    type: String,
    required: true,
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

const MatchGroup = mongoose.model("MatchGroup", matchGroupSchema);
module.exports = MatchGroup;
