import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';

const Chat = ({ conversationId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [typing, setTyping] = useState(false);
  const [loading, setLoading] = useState(false);
  const socket = useRef(null);
  const messagesEndRef = useRef(null);
  const currentUser = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    socket.current = io(process.env.REACT_APP_API_URL);
    socket.current.emit('user_online', currentUser._id);
    socket.current.emit('join_conversation', conversationId);

    return () => {
      socket.current.disconnect();
    };
  }, [conversationId, currentUser._id]);

  useEffect(() => {
    fetchMessages();
  }, [conversationId]);

  useEffect(() => {
    socket.current.on('receive_message', (data) => {
      setMessages(prev => [...prev, data.message]);
    });

    socket.current.on('user_typing', () => {
      setTyping(true);
    });

    socket.current.on('user_stopped_typing', () => {
      setTyping(false);
    });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/messages/${conversationId}/messages`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      setMessages(response.data.messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    socket.current.emit('send_message', {
      senderId: currentUser._id,
      conversationId,
      text: newMessage
    });

    socket.current.emit('stop_typing', { conversationId });
    setNewMessage('');
  };

  const handleTyping = () => {
    socket.current.emit('typing', {
      conversationId,
      userId: currentUser._id,
      userName: currentUser.firstName
    });
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="text-center py-8">Loading messages...</div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message._id}
                className={`flex ${message.sender._id === currentUser._id ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    message.sender._id === currentUser._id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-900'
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                  <span className="text-xs opacity-70 mt-1 block">
                    {new Date(message.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex justify-start">
                <div className="bg-gray-300 px-4 py-2 rounded-lg">
                  <span className="text-sm">typing...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      <div className="border-t bg-white p-4">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;