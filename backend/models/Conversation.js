const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  participant1: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  participant2: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  product: {
    type: mongoose.Schema.ObjectId,
    ref: 'Product'
  },
  lastMessage: {
    type: String,
    maxlength: [5000, 'Message cannot exceed 5000 characters']
  },
  lastMessageTime: Date,
  lastMessageSender: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  unreadCount1: {
    type: Number,
    default: 0
  },
  unreadCount2: {
    type: Number,
    default: 0
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

conversationSchema.index({ participant1: 1, participant2: 1 });
conversationSchema.index({ participant1: 1, updatedAt: -1 });
conversationSchema.index({ participant2: 1, updatedAt: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);