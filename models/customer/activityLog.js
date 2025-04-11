const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
  },
  actionType: {
    type: String,
    enum: ["Created", "Updated", "Deleted", "Viewed", "Matched"],
  },
  sourceModel: {
    type: String, // e.g., "Customer", "FormFieldsValue", "PreferencesFieldsValue"
  },
  sourceField: {
    type: String, // Specific field name that changed, if any
  },
  previousValue: {
    type: mongoose.Schema.Types.Mixed,
  },
  newValue: {
    type: mongoose.Schema.Types.Mixed,
  },
  description: {
    type: String,
    default: ""
  },
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: "changedByModel",
  },
  changedByModel: {
    type: String,
    enum: ["Admin", "Customer"],
  },
  timestamp: {
    type: Date,
    default: Date.now,
  }
}, { timestamps: true });

module.exports = mongoose.model("ActivityLog", activityLogSchema);
