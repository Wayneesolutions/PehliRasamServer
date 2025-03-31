const mongoose = require("mongoose");

const fieldTypeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { 
    type: String, 
    required: true, 
    enum: ["string", "integer", "float", "boolean", "image", "file", "date", "time", "select", "multi-select", "long-text"] 
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true },
  editedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

const FieldType = mongoose.model("FieldType", fieldTypeSchema);

module.exports = FieldType;
