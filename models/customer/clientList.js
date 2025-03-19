const mongoose = require("mongoose");

const clientListSchema = new mongoose.Schema({
  listName: { 
    type: String, 
    required: [true, "List name is required"], 
    trim: true 
  },
  color: { 
    type: String, 
    required: [true, "Color is required"], 
    trim: true 
  },
  isDeleted: { 
    type: Boolean, 
    default: false 
  },
  status: { 
    type: String, 
    enum: ["active", "inactive"], 
    default: "active" 
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  updatedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User" 
  }
}, { timestamps: true });

const ClientList = mongoose.model("ClientList", clientListSchema);

module.exports = ClientList;
