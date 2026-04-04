const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
    senderId: { type: String, required: true },
    senderName: { type: String, required: true },
    receiverId: { type: String, required: true },
    receiverName: { type: String },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    read: { type: Boolean, default: false }
});

// Indexes for faster queries
chatMessageSchema.index({ senderId: 1, receiverId: 1, timestamp: -1 });
chatMessageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // Auto-delete after 30 days

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
