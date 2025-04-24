const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true,
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "admin",
    // required: true,
  },
  // sendBy: {
  //   type: String,
  //   default: "admin",
  //   // required: true,
  // },
  action: {
    type: String,
    required: true,
  },
  changeSummary: {
    type: String,
    default: "",
  }
}, { timestamps: true });

module.exports = mongoose.model("ActivityLog", activityLogSchema);
