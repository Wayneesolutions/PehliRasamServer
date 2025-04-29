const mongoose = require('mongoose');

const introSchema = new mongoose.Schema({
  introId: {
    type: String,
    required: true,
    unique: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  sentCount: {
    type: Number,
    default: 0
  },
  viewed: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true
  },
  expiration: {
    type: Date,
    required: true
  },
  link: {
    type: String,
    required: true
  },
  profileImage: {
    type: String,
    required: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('Intro', introSchema);
