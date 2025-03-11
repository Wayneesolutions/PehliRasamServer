const mongoose = require("mongoose");

const AdminSchema = new mongoose.Schema({
  fistName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  number: {
    type: Number,
    // unique: true
  },
  profilePic: {
    type: String
  },
  autoassignClient: {
    type: Boolean,
    default: false
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ["super_admin", "admin"],
    default: "admin"
  },
  permissions: {
    Activity: {
      Read: { type: Boolean, default: false },
      Agency: { type: Boolean, default: false },
      Import: { type: Boolean, default: false },
      Export: { type: Boolean, default: false },
      View: { type: Boolean, default: false },
      Manage: { type: Boolean, default: false }
    },
    User: {
      Read: { type: Boolean, default: false },
      Create: { type: Boolean, default: false },
      Delete: { type: Boolean, default: false }
    },
    Automation: {
      Read: { type: Boolean, default: false },
      Create: { type: Boolean, default: false },
      Delete: { type: Boolean, default: false }
    },
    EmailTemplate: {
      Read: { type: Boolean, default: false },
      Create: { type: Boolean, default: false },
      Update: { type: Boolean, default: false },
      Delete: { type: Boolean, default: false }
    },
    Client: {
      Read: { type: Boolean, default: false },
      Create: { type: Boolean, default: false },
      Update: { type: Boolean, default: false },
      Delete: { type: Boolean, default: false },
      Assign: { type: Boolean, default: false }
    },
    Image: {
      Read: { type: Boolean, default: false },
      Create: { type: Boolean, default: false },
      Delete: { type: Boolean, default: false }
    },
    Video: {
      Read: { type: Boolean, default: false },
      Create: { type: Boolean, default: false },
      Delete: { type: Boolean, default: false }
    },
    ClientInvoice: {
      Read: { type: Boolean, default: false },
      Create: { type: Boolean, default: false },
      Delete: { type: Boolean, default: false }
    },
    Contract: {
      Read: { type: Boolean, default: false },
      Create: { type: Boolean, default: false },
      Delete: { type: Boolean, default: false },
      Freezing: { type: Boolean, default: false }
    },
    Event: {
      Read: { type: Boolean, default: false },
      Create: { type: Boolean, default: false },
      Delete: { type: Boolean, default: false }
    },
    File: {
      Read: { type: Boolean, default: false },
      Create: { type: Boolean, default: false },
      Delete: { type: Boolean, default: false }
    },
    Intro: {
      Read: { type: Boolean, default: false },
      Create: { type: Boolean, default: false },
      Delete: { type: Boolean, default: false }
    },
    Match: {
      Read: { type: Boolean, default: false },
      Create: { type: Boolean, default: false },
      Delete: { type: Boolean, default: false }
    },
    Note: {
      Read: { type: Boolean, default: false },
      Create: { type: Boolean, default: false },
      Delete: { type: Boolean, default: false }
    },
    Report: {
      Read: { type: Boolean, default: false },
      Create: { type: Boolean, default: false },
      Generate: { type: Boolean, default: false },
      Delete: { type: Boolean, default: false },
      Showcase: { type: Boolean, default: false }
    },
    Survey: {
      Read: { type: Boolean, default: false },
      Create: { type: Boolean, default: false }
    },
    Task: {
      Read: { type: Boolean, default: false },
      Create: { type: Boolean, default: false },
      Update: { type: Boolean, default: false },
      Delete: { type: Boolean, default: false }
    }
  },
  notification: {
    newSubmittedClient: {
      email: { type: Boolean, default: false },
      sms: { type: Boolean, default: false },
      web: { type: Boolean, default: false }
    },
    systemMessage: {
      email: { type: Boolean, default: false },
      sms: { type: Boolean, default: false },
      web: { type: Boolean, default: false }
    },
    mentions: {
      email: { type: Boolean, default: false },
      sms: { type: Boolean, default: false },
      web: { type: Boolean, default: false }
    },
    newTaskAssigned: {
      email: { type: Boolean, default: false },
      sms: { type: Boolean, default: false },
      web: { type: Boolean, default: false }
    },
    birthdayReminder: {
      email: { type: Boolean, default: false },
      sms: { type: Boolean, default: false },
      web: { type: Boolean, default: false }
    },
    clientProfileUpdate: {
      email: { type: Boolean, default: false },
      sms: { type: Boolean, default: false },
      web: { type: Boolean, default: false }
    },
    systemError: {
      email: { type: Boolean, default: false },
      sms: { type: Boolean, default: false },
      web: { type: Boolean, default: false }
    },
    incomingTextMessage: {
      email: { type: Boolean, default: false },
      sms: { type: Boolean, default: false },
      web: { type: Boolean, default: false }
    },
    reminder: {
      email: { type: Boolean, default: false },
      sms: { type: Boolean, default: false },
      web: { type: Boolean, default: false }
    }
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ["active", "inactive", "suspended"], // Add other statuses as needed
    default: "active"
  },
  refreshToken: {
    type: String,
    default: null,
  }
}, { timestamps: true });

module.exports = mongoose.model("Admin", AdminSchema);