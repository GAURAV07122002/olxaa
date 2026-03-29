const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

const setupSocket = (io) => {
  const users = {}; // { userId: socketId }

  io.on('connection', (socket) => {
    console.log('New user connected:', socket.id);

    // User joins
    socket.on('user_online', (userId) => {
      users[userId] = socket.id;
      io.emit('user_status', { userId, status: 'online' });
    });

    // User typing
    socket.on('typing', (data) => {
      const { conversationId, userId, userName } = data;
      socket.broadcast.emit('user_typing', { conversationId, userId, userName });
    });

    // User stopped typing
    socket.on('stop_typing', (data) => {
      socket.broadcast.emit('user_stopped_typing', { conversationId: data.conversationId });
    });

    // Send message
    socket.on('send_message', async (data) => {
      try {
        const { senderId, receiverId, conversationId, text, image } = data;

        // Create message
        const message = await Message.create({
          sender: senderId,
          receiver: receiverId,
          conversation: conversationId,
          text,
          image
        });

        // Update conversation
        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: text,
          lastMessageTime: new Date(),
          lastMessageSender: senderId
        });

        // Get sender info
        const populatedMessage = await message
          .populate('sender', 'firstName lastName profilePicture')
          .populate('receiver', 'firstName lastName');

        // Emit to receiver
        if (users[receiverId]) {
          io.to(users[receiverId]).emit('receive_message', {
            message: populatedMessage,
            conversationId
          });
        }

        // Emit to sender
        io.to(socket.id).emit('message_sent', {
          message: populatedMessage,
          conversationId
        });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Mark message as read
    socket.on('mark_as_read', async (data) => {
      try {
        const { messageId, conversationId } = data;

        await Message.findByIdAndUpdate(messageId, {
          isRead: true,
          readAt: new Date()
        });

        // Update conversation unread count
        await Conversation.findByIdAndUpdate(conversationId, {
          unreadCount2: 0 // Reset based on actual logic
        });

        socket.broadcast.emit('message_read', { messageId, conversationId });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // User offline
    socket.on('disconnect', () => {
      // Find and remove user
      for (let userId in users) {
        if (users[userId] === socket.id) {
          delete users[userId];
          io.emit('user_status', { userId, status: 'offline' });
          break;
        }
      }
      console.log('User disconnected:', socket.id);
    });

    // Join conversation room
    socket.on('join_conversation', (conversationId) => {
      socket.join(`conversation_${conversationId}`);
    });

    // Leave conversation room
    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conversation_${conversationId}`);
    });
  });
};

module.exports = setupSocket;