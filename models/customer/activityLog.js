const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true,
    index: true, // Index for faster queries
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "admin",
    index: true, // Index for faster lookups
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

// Compound index for common query patterns (customerId + createdAt for sorting)
activityLogSchema.index({ customerId: 1, createdAt: -1 });
// Index for sorting all logs by createdAt
activityLogSchema.index({ createdAt: -1 });
// Compound index for performedBy queries
activityLogSchema.index({ performedBy: 1, createdAt: -1 });

module.exports = mongoose.model("ActivityLog", activityLogSchema);
