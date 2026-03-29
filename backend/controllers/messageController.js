const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

// @desc Get Conversations
// @route GET /api/conversations
// @access Private
exports.getConversations = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const conversations = await Conversation.find({
      $or: [
        { participant1: req.user.id },
        { participant2: req.user.id }
      ],
      isArchived: false
    })
      .populate('participant1', 'firstName lastName profilePicture')
      .populate('participant2', 'firstName lastName profilePicture')
      .populate('lastMessageSender', 'firstName lastName')
      .sort('-updatedAt')
      .skip(skip)
      .limit(Number(limit));

    const total = await Conversation.countDocuments({
      $or: [
        { participant1: req.user.id },
        { participant2: req.user.id }
      ],
      isArchived: false
    });

    res.status(200).json({
      success: true,
      count: conversations.length,
      total,
      pages: Math.ceil(total / limit),
      conversations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc Get Messages
// @route GET /api/conversations/:conversationId/messages
// @access Private
exports.getMessages = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const messages = await Message.find({ conversation: req.params.conversationId })
      .populate('sender', 'firstName lastName profilePicture')
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit));

    const total = await Message.countDocuments({ conversation: req.params.conversationId });

    res.status(200).json({
      success: true,
      count: messages.length,
      total,
      pages: Math.ceil(total / limit),
      messages: messages.reverse()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc Create or Get Conversation
// @route POST /api/conversations
// @access Private
exports.createConversation = async (req, res) => {
  try {
    const { otherUserId, productId } = req.body;

    if (!otherUserId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide otherUserId'
      });
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      $or: [
        { participant1: req.user.id, participant2: otherUserId },
        { participant1: otherUserId, participant2: req.user.id }
      ]
    });

    if (conversation) {
      return res.status(200).json({
        success: true,
        message: 'Conversation already exists',
        conversation
      });
    }

    // Create new conversation
    conversation = await Conversation.create({
      participant1: req.user.id,
      participant2: otherUserId,
      product: productId
    });

    res.status(201).json({
      success: true,
      message: 'Conversation created successfully',
      conversation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc Archive Conversation
// @route PUT /api/conversations/:conversationId/archive
// @access Private
exports.archiveConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findByIdAndUpdate(
      req.params.conversationId,
      { isArchived: true },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Conversation archived successfully',
      conversation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};