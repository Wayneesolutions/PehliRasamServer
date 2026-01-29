const mongoose = require('mongoose');

const mailLogSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true
    },
    to: {
        type: String,
        trim: true,
    },
    messageId: {
        type: String,
        trim: true,
        index: true // For faster lookup when checking replies
    },
    subject: {
        type: String,
        trim: true,
        required: true
    },
    body: {
        type: String,
        required: true
    },
    sentAt: {
        type: Date,
        default: Date.now
    },
    sentBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: false, // Optional - automated emails don't have a specific admin
        default: null
    },
    sentByEmail: {
        type: String,
        trim: true,
        // required: true,
        match: [/^\S+@\S+\.\S+$/, 'Invalid email format']
    },
    deliveryStatus: {
        type: String,
        enum: ['Pending', 'Sent', 'Failed'],
        default: 'Pending'
    },
    meetingDetails: {
        type: {
            isMeeting: { type: Boolean, default: false },
            date: { type: Date, default: null },
            durationInMinutes: { type: Number, default: null },
            meetingLink: { type: String, trim: true, default: null },
            notes: { type: String, default: null }
        },
        default: undefined
    },
    attachments: [
        {
            fileName: { type: String, trim: true },
            fileUrl: { type: String, trim: true }
        }
    ]
}, { timestamps: true });

module.exports = mongoose.model('MailLog', mailLogSchema);
