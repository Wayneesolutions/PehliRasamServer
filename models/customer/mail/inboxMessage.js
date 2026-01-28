const mongoose = require('mongoose');

const inboxMessageSchema = new mongoose.Schema({
  // Email identifiers
  messageId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  
  // Sender information
  from: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  fromName: {
    type: String,
    default: ''
  },
  
  // Recipient information
  to: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  cc: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  
  // Email content
  subject: {
    type: String,
    default: '',
    trim: true
  },
  body: {
    type: String,
    default: ''
  },
  textBody: {
    type: String,
    default: ''
  },
  
  // Dates
  receivedAt: {
    type: Date,
    default: Date.now
  },
  emailDate: {
    type: Date,
    default: null
  },
  
  // Customer relationship
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    default: null
  },
  customerMatched: {
    type: Boolean,
    default: false
  },
  
  // Email threading
  inReplyTo: {
    type: String,
    default: null
  },
  references: [{
    type: String
  }],
  
  // Status tracking
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  },
  readBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  },
  
  // Auto-reply tracking
  hasAutoReplied: {
    type: Boolean,
    default: false
  },
  autoRepliedAt: {
    type: Date,
    default: null
  },
  
  // Attachments
  attachments: [{
    fileName: {
      type: String,
      trim: true
    },
    fileSize: {
      type: Number,
      default: 0
    },
    mimeType: {
      type: String,
      trim: true
    },
    contentId: {
      type: String,
      default: null
    },
    // For future implementation: store file path or URL
    fileUrl: {
      type: String,
      default: null
    }
  }],
  
  // Raw email data
  rawHeaders: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Flags
  isStarred: {
    type: Boolean,
    default: false
  },
  isImportant: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  },
  
  // Notes from admin
  adminNotes: {
    type: String,
    default: ''
  }
}, { 
  timestamps: true,
  collection: 'inboxmessages'
});

// Indexes for better query performance
inboxMessageSchema.index({ messageId: 1 }, { unique: true });
inboxMessageSchema.index({ from: 1 });
inboxMessageSchema.index({ customerId: 1 });
inboxMessageSchema.index({ isRead: 1 });
inboxMessageSchema.index({ receivedAt: -1 });
inboxMessageSchema.index({ isDeleted: 1 });

// Virtual for customer name
inboxMessageSchema.virtual('customerName').get(function() {
  if (this.customerId && this.customerId.firstName && this.customerId.lastName) {
    return `${this.customerId.firstName} ${this.customerId.lastName}`;
  }
  return this.fromName || this.from;
});

// Method to mark as read
inboxMessageSchema.methods.markAsRead = async function(adminId) {
  this.isRead = true;
  this.readAt = new Date();
  this.readBy = adminId;
  return await this.save();
};

// Method to mark as unread
inboxMessageSchema.methods.markAsUnread = async function() {
  this.isRead = false;
  this.readAt = null;
  this.readBy = null;
  return await this.save();
};

// Static method to get unread count
inboxMessageSchema.statics.getUnreadCount = async function() {
  return await this.countDocuments({ isRead: false, isDeleted: false });
};

// Static method to find by customer
inboxMessageSchema.statics.findByCustomer = async function(customerId) {
  return await this.find({ 
    customerId, 
    isDeleted: false 
  }).sort({ receivedAt: -1 });
};

module.exports = mongoose.model('InboxMessage', inboxMessageSchema);

