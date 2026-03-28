const mongoose = require('mongoose');

const contactMessageSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    copyToSelf: {
        type: Boolean,
        default: false
    },
    subscribeUpdates: {
        type: Boolean,
        default: false
    },
    read: {
        type: Boolean,
        default: false
    },
    replied: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    ip: String,
    userAgent: String
});

module.exports = mongoose.model('ContactMessage', contactMessageSchema);
