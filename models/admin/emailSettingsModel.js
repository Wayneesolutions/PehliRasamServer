const mongoose = require('mongoose');

const emailSettingsSchema = new mongoose.Schema({
  sendingMethod: {
    type: String,
    enum: ['default', 'smtp'],
    default: 'default'
  },
  smtpSettings: {
    host: { type: String, default: '' },
    port: { type: String, default: '' },
    username: { type: String, default: '' },
    password: { type: String, default: '' },
    connectionType: { type: String, default: '' },
    sender: { type: String, default: '' }
  },
  replyToEmail: {
    type: String,
    default: ''
  },
  inboundEmail: {
    type: String,
    default: ''
  },
  contactEmail: {
    type: String,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, { timestamps: true });

// Ensure only one settings document exists
emailSettingsSchema.statics.getOrCreate = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = new this({});
    await settings.save();
  }
  return settings;
};

module.exports = mongoose.model('EmailSettings', emailSettingsSchema);

