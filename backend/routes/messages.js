const express = require('express');
const { 
  getConversations, 
  getMessages, 
  createConversation, 
  archiveConversation 
} = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/conversations', protect, getConversations);
router.post('/conversations', protect, createConversation);
router.get('/:conversationId/messages', protect, getMessages);
router.put('/:conversationId/archive', protect, archiveConversation);

module.exports = router;