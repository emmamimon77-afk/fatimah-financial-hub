const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
    username: { type: String, required: true },
    message: { type: String, required: true },
    userId: { type: String },
    timestamp: { type: Date, default: Date.now }
});

// Optional: Auto-delete messages after 30 days (uncomment if desired)
// chatMessageSchema.index({ timestamp: 1 }, { expireAfterSeconds: 2592000 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
