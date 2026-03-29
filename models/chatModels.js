const mongoose = require('mongoose');

// Message Model
const messageSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

const Message = mongoose.model('Message', messageSchema);

// Conversation Model
const conversationSchema = new mongoose.Schema({
    participants: [{ type: String, required: true }],
    messages: [messageSchema],
    lastUpdated: { type: Date, default: Date.now }
});

const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = { Message, Conversation };